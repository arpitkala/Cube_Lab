/**
 * CameraManager.js — Camera & OrbitControls
 * 
 * Owns the THREE.PerspectiveCamera and OrbitControls. Manages camera
 * position, constraints, and preset view transitions.
 * 
 * COMPUTER GRAPHICS CONCEPTS:
 * - Perspective Projection: The PerspectiveCamera defines a viewing frustum
 *   with field-of-view angle, aspect ratio, and near/far clipping planes.
 *   Objects closer appear larger (foreshortening) — mimicking human vision.
 * - Camera Transformation: The camera's position and target define the
 *   view matrix, transforming world coordinates into camera (eye) space.
 * - OrbitControls: Implements spherical coordinate camera manipulation —
 *   azimuthal angle (horizontal orbit), polar angle (vertical orbit),
 *   and radius (zoom/dolly).
 * - Damping: Inertial deceleration after interaction release creates a
 *   smooth, polished feel by applying exponential decay to angular velocity.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Preset camera positions for different viewing angles.
 * Each preset is defined as a spherical coordinate { phi, theta, radius }
 * or a direct position vector.
 */
const CAMERA_PRESETS = {
  isometric: { position: new THREE.Vector3(5, 4, 5), name: 'Isometric' },
  front:     { position: new THREE.Vector3(0, 0, 7), name: 'Front' },
  back:      { position: new THREE.Vector3(0, 0, -7), name: 'Back' },
  right:     { position: new THREE.Vector3(7, 0, 0), name: 'Right' },
  left:      { position: new THREE.Vector3(-7, 0, 0), name: 'Left' },
  top:       { position: new THREE.Vector3(0, 7, 0.01), name: 'Top' }, // small z offset to avoid gimbal lock
  free:      { position: null, name: 'Free' }, // no preset, user-controlled
};

export class CameraManager {
  /**
   * @param {import('./SceneManager.js').SceneManager} sceneManager
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    const { width, height } = sceneManager.getSize();

    // ---------- Camera Setup ----------
    /**
     * COMPUTER GRAPHICS CONCEPT: Perspective Projection Matrix
     * - FOV: 45° vertical field of view
     * - Aspect: viewport width/height ratio
     * - Near plane: 0.1 (minimum render distance)
     * - Far plane: 100 (maximum render distance)
     */
    this.camera = new THREE.PerspectiveCamera(
      45,             // fov
      width / height, // aspect
      0.1,            // near clipping plane
      100             // far clipping plane
    );

    // Default position: isometric view
    const defaultPos = CAMERA_PRESETS.isometric.position;
    this.camera.position.copy(defaultPos);
    this.camera.lookAt(0, 0, 0);

    // ---------- OrbitControls Setup ----------
    /**
     * COMPUTER GRAPHICS CONCEPT: Interactive camera control using spherical
     * coordinates. The user's mouse drag is converted to changes in the
     * azimuthal (θ) and polar (φ) angles around the target point.
     */
    this.controls = new OrbitControls(this.camera, sceneManager.renderer.domElement);
    this.controls.target.set(0, 0, 0);

    // Damping for smooth deceleration
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    // Zoom constraints
    this.controls.minDistance = 3;
    this.controls.maxDistance = 20;

    // Pan constraints (limit how far off-center the user can pan)
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;

    // Rotation speed
    this.controls.rotateSpeed = 0.8;

    // Zoom speed
    this.controls.zoomSpeed = 1.0;

    // Auto-rotate (disabled by default, can be enabled for welcome screen)
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 2.0;

    this.controls.update();

    // ---------- Resize Handler ----------
    window.addEventListener('resize', () => {
      const { width, height } = sceneManager.getSize();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });

    // Register controls update in the render loop (required for damping)
    sceneManager.onUpdate(() => {
      this.controls.update();
    });

    console.log('[CameraManager] Camera and OrbitControls initialized');
  }

  /**
   * Set camera to a preset view (instant, no animation for Phase 1).
   * Phase 4 will add smooth animated transitions.
   * 
   * @param {string} presetName — 'isometric', 'front', 'back', 'right', 'left', 'top', 'free'
   */
  setPresetView(presetName) {
    const preset = CAMERA_PRESETS[presetName];
    if (!preset) {
      console.warn(`[CameraManager] Unknown preset: "${presetName}"`);
      return;
    }
    if (presetName === 'free' || !preset.position) {
      // Free mode: don't move the camera
      return;
    }

    this.camera.position.copy(preset.position);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    console.log(`[CameraManager] Set view: ${preset.name}`);
  }

  /**
   * Enable/disable auto-rotation.
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    this.controls.autoRotate = enabled;
  }

  /**
   * Enable/disable user interaction with the camera.
   * Used during layer rotation to prevent conflicting gestures.
   * 
   * @param {boolean} enabled
   */
  setInteractionEnabled(enabled) {
    this.controls.enabled = enabled;
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
    this.controls.dispose();
  }
}
