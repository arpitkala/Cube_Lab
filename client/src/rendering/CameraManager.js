/**
 * CameraManager.js — Camera & OrbitControls
 *
 * Owns the THREE.PerspectiveCamera and OrbitControls. Manages camera
 * position, constraints, framing, and preset view transitions.
 *
 * COMPUTER GRAPHICS CONCEPTS:
 * - Perspective Projection: The PerspectiveCamera defines a viewing frustum
 *   with field-of-view angle, aspect ratio, and near/far clipping planes.
 *   Objects closer appear larger (foreshortening) — mimicking human vision.
 * - Camera Transformation: The camera's position and target define the
 *   view matrix, transforming world coordinates into camera (eye) space.
 * - Frustum Fitting: To frame an object of bounding radius R without
 *   clipping, the eye distance must satisfy d >= R / sin(fov/2). Because the
 *   vertical FOV is fixed, a narrow viewport (aspect < 1) constrains the
 *   horizontal extent instead, so the effective half-angle is
 *   min(vFov/2, hFov/2) where tan(hFov/2) = aspect * tan(vFov/2).
 * - OrbitControls: Implements spherical coordinate camera manipulation —
 *   azimuthal angle (horizontal orbit), polar angle (vertical orbit),
 *   and radius (zoom/dolly).
 * - Damping: Inertial deceleration after interaction release creates a
 *   smooth, polished feel by applying exponential decay to angular velocity.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Preset camera views, stored as unit DIRECTIONS from the target rather than
 * absolute positions. The orbit radius is supplied separately by the framing
 * logic, so a preset keeps whatever zoom level suits the puzzle currently on
 * screen instead of snapping back to a hard-coded distance.
 */
const CAMERA_PRESETS = {
  isometric: { dir: new THREE.Vector3( 1,  0.8, 1),     name: 'Isometric' },
  front:     { dir: new THREE.Vector3( 0,  0,   1),     name: 'Front' },
  back:      { dir: new THREE.Vector3( 0,  0,  -1),     name: 'Back' },
  right:     { dir: new THREE.Vector3( 1,  0,   0),     name: 'Right' },
  left:      { dir: new THREE.Vector3(-1,  0,   0),     name: 'Left' },
  // A pure (0,1,0) view is degenerate for OrbitControls — the up vector and
  // the view direction become parallel — so tilt it a hair off the pole.
  top:       { dir: new THREE.Vector3( 0,  1,   0.001), name: 'Top' },
  bottom:    { dir: new THREE.Vector3( 0, -1,   0.001), name: 'Bottom' },
  free:      { dir: null,                               name: 'Free' },
};

/** Vertical field of view, in degrees. */
const FOV = 45;

/** Extra breathing room around the puzzle bounding sphere when framing. */
const FRAMING_MARGIN = 1.35;

/** Seconds a preset-view transition takes. */
const TRANSITION_DURATION = 0.6;

export class CameraManager {
  /**
   * @param {import('./SceneManager.js').SceneManager} sceneManager
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;

    /** Bounding-sphere radius of the subject being framed (3×3 cube by default). */
    this._subjectRadius = this._radiusForPuzzleSize(3);

    /** Active preset-view tween, or null. */
    this._transition = null;

    // ---------- Camera Setup ----------
    /**
     * COMPUTER GRAPHICS CONCEPT: Perspective Projection Matrix
     * - FOV: 45° vertical field of view
     * - Aspect: viewport width/height ratio
     * - Near plane: 0.1 (minimum render distance)
     * - Far plane: 200 — must comfortably exceed the largest orbit radius,
     *   otherwise the subject is clipped away when fully zoomed out.
     */
    this.camera = new THREE.PerspectiveCamera(
      FOV,
      this._currentAspect(),
      0.1,
      200
    );

    // ---------- OrbitControls Setup ----------
    /**
     * COMPUTER GRAPHICS CONCEPT: Interactive camera control using spherical
     * coordinates. The mouse drag is converted to changes in the azimuthal
     * (theta) and polar (phi) angles around the target point.
     */
    this.controls = new OrbitControls(this.camera, sceneManager.renderer.domElement);
    this.controls.target.set(0, 0, 0);

    // Damping for smooth deceleration
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    // Pan configuration
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;
    this.controls.screenSpacePanning = true;

    // Rotation / zoom speed
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.0;

    // Auto-rotate (disabled by default, enabled for the welcome screen)
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 2.0;

    // Any manual interaction cancels an in-flight preset transition, so the
    // tween never fights the drag.
    this._onUserInteractionStart = () => { this._transition = null; };
    this.controls.addEventListener('start', this._onUserInteractionStart);

    // Default framing: isometric, distance derived from the subject size.
    this.setPresetView('isometric', { animate: false });

    // ---------- Resize Handling ----------
    /**
     * The canvas container can change size without the window resizing (side
     * panels opening, orientation changes, browser chrome collapsing), so
     * observe the element itself and fall back to the window event where
     * ResizeObserver is unavailable.
     */
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._onResize);
      this._resizeObserver.observe(sceneManager.container);
    }

    // Per-frame update in the render loop — required for damping,
    // auto-rotation, and preset transitions.
    this._onFrame = (delta) => this._update(delta);
    sceneManager.onUpdate(this._onFrame);

    console.log('[CameraManager] Camera and OrbitControls initialized');
  }

  // ─── Framing ─────────────────────────────────────────────────────

  /**
   * Bounding-sphere radius of an N×N×N cube. Cubies occupy unit cells, so the
   * cube spans N units per axis and its half-diagonal is N·sqrt(3) / 2.
   *
   * @param {number} size
   * @returns {number}
   */
  _radiusForPuzzleSize(size) {
    const n = Math.max(2, Number(size) || 3);
    return (n * Math.sqrt(3)) / 2;
  }

  /** Current viewport aspect ratio, guarded against a zero-sized container. */
  _currentAspect() {
    const { width, height } = this.sceneManager.getSize();
    if (!width || !height) return 1;
    return width / height;
  }

  /**
   * Distance at which a sphere of `_subjectRadius` exactly fills the frustum,
   * accounting for narrow (portrait) viewports where the horizontal FOV, not
   * the vertical one, is the binding constraint.
   *
   * @returns {number}
   */
  _fitDistance() {
    const vHalf = THREE.MathUtils.degToRad(FOV) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * this._currentAspect());
    const halfAngle = Math.min(vHalf, hHalf);
    return (this._subjectRadius * FRAMING_MARGIN) / Math.sin(halfAngle);
  }

  /**
   * Recompute the zoom limits from the current subject size and viewport, then
   * clamp the camera back inside them.
   */
  _applyDistanceConstraints() {
    const fit = this._fitDistance();
    this.controls.minDistance = Math.max(this._subjectRadius * 1.05, fit * 0.45);
    this.controls.maxDistance = fit * 2.6;

    const offset = this.camera.position.clone().sub(this.controls.target);
    const dist = offset.length();
    if (dist > 0) {
      const clamped = THREE.MathUtils.clamp(dist, this.controls.minDistance, this.controls.maxDistance);
      if (clamped !== dist) {
        this.camera.position.copy(this.controls.target).add(offset.multiplyScalar(clamped / dist));
      }
    }
    this.controls.update();
  }

  /**
   * Frame the camera for a puzzle of the given dimension. Called whenever a
   * new puzzle is created so that 2×2 through 5×5 cubes are all fully visible
   * — a single fixed distance tuned for a 3×3 clips the larger cubes.
   *
   * @param {number} size — cube dimension (2, 3, 4, 5, ...)
   * @param {{ animate?: boolean }} [options]
   */
  frameToPuzzleSize(size, options = {}) {
    const { animate = true } = options;
    this._subjectRadius = this._radiusForPuzzleSize(size);
    this._applyDistanceConstraints();

    // Dolly to the ideal distance along the current viewing direction, keeping
    // whatever orbit angle the camera is currently looking from.
    const dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() === 0) dir.set(1, 0.8, 1);
    dir.normalize();

    const targetPos = this.controls.target.clone().addScaledVector(dir, this._fitDistance());
    const targetLook = this.controls.target.clone();

    if (animate) this._startTransition(targetPos, targetLook);
    else this._applyCamera(targetPos, targetLook);
  }

  // ─── Preset Views ────────────────────────────────────────────────
  /**
   * Reset to a preset angle AND the ideal framing distance for a puzzle of the
   * given size, in a single transition. Used when returning to the welcome
   * screen, where both the angle and the zoom should return to defaults.
   *
   * @param {number} size — cube dimension
   * @param {string} [presetName='isometric']
   * @param {{ animate?: boolean }} [options]
   */
  resetView(size, presetName = 'isometric', options = {}) {
    const { animate = true } = options;
    this._subjectRadius = this._radiusForPuzzleSize(size);
    this._applyDistanceConstraints();

    const preset = CAMERA_PRESETS[presetName] || CAMERA_PRESETS.isometric;
    const dir = (preset.dir || CAMERA_PRESETS.isometric.dir).clone().normalize();
    const targetPos = dir.multiplyScalar(this._fitDistance());
    const targetLook = new THREE.Vector3(0, 0, 0);

    if (animate) this._startTransition(targetPos, targetLook);
    else this._applyCamera(targetPos, targetLook);
  }


  /**
   * Move the camera to a preset view.
   *
   * @param {string} presetName — 'isometric', 'front', 'back', 'right', 'left', 'top', 'bottom', 'free'
   * @param {{ animate?: boolean }} [options]
   */
  setPresetView(presetName, options = {}) {
    const { animate = true } = options;
    const preset = CAMERA_PRESETS[presetName];

    if (!preset) {
      console.warn(`[CameraManager] Unknown preset: "${presetName}"`);
      return;
    }
    if (presetName === 'free' || !preset.dir) {
      // Free mode: leave the camera wherever the user put it.
      return;
    }

    this._applyDistanceConstraints();

    // Preserve the current zoom where it still frames the puzzle; otherwise
    // fall back to the computed fit distance.
    const current = this.camera.position.distanceTo(this.controls.target);
    const distance = current > 0.001
      ? THREE.MathUtils.clamp(current, this.controls.minDistance, this.controls.maxDistance)
      : this._fitDistance();

    const targetPos = preset.dir.clone().normalize().multiplyScalar(distance);
    const targetLook = new THREE.Vector3(0, 0, 0);

    if (animate) this._startTransition(targetPos, targetLook);
    else this._applyCamera(targetPos, targetLook);

    console.log(`[CameraManager] Set view: ${preset.name}`);
  }

  /**
   * Begin a smooth transition of both the eye position and the orbit target.
   * The interpolation runs in the render loop so it stays frame-rate
   * independent.
   *
   * @param {THREE.Vector3} position
   * @param {THREE.Vector3} target
   */
  _startTransition(position, target) {
    this._transition = {
      fromPos: this.camera.position.clone(),
      toPos: position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      elapsed: 0,
      duration: TRANSITION_DURATION,
    };
  }

  /**
   * Snap the camera to a position/target immediately.
   *
   * @param {THREE.Vector3} position
   * @param {THREE.Vector3} target
   */
  _applyCamera(position, target) {
    this._transition = null;
    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
    this.controls.update();
  }

  // ─── Per-Frame Update ────────────────────────────────────────────

  /**
   * @param {number} delta — seconds since the previous frame
   */
  _update(delta) {
    if (this._transition) {
      const t = this._transition;
      t.elapsed += delta;
      const raw = Math.min(1, t.elapsed / t.duration);

      // Smoothstep easing: zero velocity at both ends, so the move starts and
      // stops without a visible jerk.
      const k = raw * raw * (3 - 2 * raw);

      this.camera.position.lerpVectors(t.fromPos, t.toPos, k);
      this.controls.target.lerpVectors(t.fromTarget, t.toTarget, k);

      if (raw >= 1) this._transition = null;
    }

    this.controls.update();
  }

  // ─── Viewport ────────────────────────────────────────────────────

  /**
   * Keep the projection matrix in sync with the viewport, and re-derive the
   * zoom limits, which depend on the aspect ratio.
   */
  _handleResize() {
    const aspect = this._currentAspect();
    if (this.camera.aspect === aspect) return;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this._applyDistanceConstraints();
  }

  // ─── Public Controls ─────────────────────────────────────────────

  /**
   * Enable/disable auto-rotation.
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    this.controls.autoRotate = !!enabled;
  }

  /**
   * Enable/disable user interaction with the camera.
   * Used during layer rotation to prevent conflicting gestures.
   *
   * @param {boolean} enabled
   */
  setInteractionEnabled(enabled) {
    this.controls.enabled = !!enabled;
  }

  /**
   * Get all available preset names.
   * @returns {string[]}
   */
  getPresetNames() {
    return Object.keys(CAMERA_PRESETS);
  }

  /**
   * Dispose resources.
   */
  dispose() {
    this.controls.removeEventListener('start', this._onUserInteractionStart);
    window.removeEventListener('resize', this._onResize);
    this._resizeObserver?.disconnect();
    this.controls.dispose();
  }
}
