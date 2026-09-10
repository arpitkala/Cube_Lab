/**
 * SceneManager.js — Three.js Scene & Renderer
 * 
 * Owns the THREE.Scene, THREE.WebGLRenderer, and the requestAnimationFrame
 * render loop. All visual objects are added to the scene through this manager.
 * 
 * COMPUTER GRAPHICS CONCEPTS:
 * - WebGL Rendering Pipeline: The WebGLRenderer manages the GPU rendering
 *   pipeline — vertex processing, rasterization, fragment shading, and
 *   framebuffer output.
 * - Antialiasing: MSAA (multisample anti-aliasing) smooths jagged polygon
 *   edges by sampling multiple points per pixel.
 * - Shadow Mapping: PCFSoftShadowMap uses percentage-closer filtering to
 *   produce soft shadow edges from depth map comparisons.
 * - Tone Mapping: ACESFilmicToneMapping maps HDR lighting values to the
 *   displayable [0,1] range with a cinematic S-curve.
 * - Device Pixel Ratio: Matching the canvas resolution to the display's
 *   physical pixel density prevents blurriness on HiDPI screens.
 * - Animation Loop: requestAnimationFrame synchronizes rendering with the
 *   display's refresh rate (~60fps) for smooth, tear-free animation.
 */

import * as THREE from 'three';

export class SceneManager {
  /**
   * @param {HTMLElement} container — DOM element to mount the canvas into
   * @param {import('../themes/ThemeManager.js').ThemeManager} themeManager
   */
  constructor(container, themeManager) {
    this.container = container;
    this.themeManager = themeManager;

    /** @type {Function[]} callbacks to run each frame */
    this._updateCallbacks = [];

    /** Is the render loop running? */
    this._running = false;

    // ---------- Scene ----------
    this.scene = new THREE.Scene();
    const theme = themeManager.getTheme();
    this.scene.background = new THREE.Color(theme.scene.background);

    // Optional subtle fog for depth
    this.scene.fog = new THREE.FogExp2(theme.scene.fogColor, theme.scene.fogDensity);

    // ---------- Renderer ----------
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });

    // Shadow map configuration
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Tone mapping for realistic lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Output color space
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Match device pixel ratio for crisp rendering
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Size the canvas to fill the container
    this._updateSize();

    // Mount canvas to DOM
    this.container.appendChild(this.renderer.domElement);

    // ---------- Resize Handler ----------
    // The container can be resized by layout alone (panels opening, device
    // rotation, browser chrome collapsing) without a window resize event, so
    // observe the element itself and keep the window listener as a fallback.
    this._onResize = this._updateSize.bind(this);
    window.addEventListener('resize', this._onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._onResize);
      this._resizeObserver.observe(this.container);
    }

    // ---------- Theme Change Handler ----------
    this.themeManager.onChange((theme) => {
      this.scene.background.setHex(theme.scene.background);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(theme.scene.fogColor);
        this.scene.fog.density = theme.scene.fogDensity;
      }
    });

    console.log('[SceneManager] Scene and renderer initialized');
  }

  /**
   * Update canvas size to match container dimensions.
   * 
   * COMPUTER GRAPHICS CONCEPT: The viewport transform maps normalized
   * device coordinates (NDC: -1 to +1) to screen pixel coordinates.
   * Updating the renderer size keeps this mapping correct when the
   * window resizes.
   */
  _updateSize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // A zero-sized container (hidden ancestor, layout not settled yet) would
    // make the renderer produce a 0x0 drawing buffer and the camera an
    // undefined aspect ratio, so skip until the element has real dimensions.
    if (!width || !height) return;

    this.renderer.setSize(width, height, false);
  }

  /**
   * Add a 3D object to the scene.
   * @param {THREE.Object3D} object
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove a 3D object from the scene.
   * @param {THREE.Object3D} object
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Register a callback to run every frame.
   * @param {Function} callback — receives (deltaTime, elapsedTime)
   */
  onUpdate(callback) {
    this._updateCallbacks.push(callback);
  }

  /**
   * Start the render loop.
   * @param {THREE.Camera} camera
   */
  start(camera) {
    if (this._running) return;
    this._running = true;
    this._camera = camera;

    const clock = new THREE.Clock();

    const animate = () => {
      if (!this._running) return;
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Run all update callbacks (animation, controls, etc.)
      for (const cb of this._updateCallbacks) {
        cb(delta, elapsed);
      }

      // Render the scene
      this.renderer.render(this.scene, this._camera);
    };

    animate();
    console.log('[SceneManager] Render loop started');
  }

  /**
   * Stop the render loop.
   */
  stop() {
    this._running = false;
  }

  /**
   * Get the current canvas size.
   * @returns {{ width: number, height: number }}
   */
  getSize() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  /**
   * Manually render a single frame (useful for snapshot capture).
   */
  render() {
    if (this._camera) {
      this.renderer.render(this.scene, this._camera);
    }
  }

  get camera() {
    return this._camera;
  }

  /**
   * Dispose all resources.
   */
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this._resizeObserver?.disconnect();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
