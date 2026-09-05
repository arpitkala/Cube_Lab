/**
 * Lighting.js — Studio-Quality Lighting Rig
 * 
 * Creates a professional lighting setup for the 3D cube scene.
 * Uses a multi-point lighting pattern (key, fill, rim, top studio)
 * ensuring all puzzles (standard and metallic mirror blocks) render with
 * vibrant highlights and zero pitch-black faces.
 */

import * as THREE from 'three';

export class Lighting {
  /**
   * @param {import('./SceneManager.js').SceneManager} sceneManager
   * @param {import('../themes/ThemeManager.js').ThemeManager} themeManager
   */
  constructor(sceneManager, themeManager) {
    this.sceneManager = sceneManager;
    this.themeManager = themeManager;

    const theme = themeManager.getTheme();

    // ---------- Ambient Light ----------
    this.ambientLight = new THREE.AmbientLight(0xffffff, Math.max(0.6, theme.lighting.ambientIntensity));
    sceneManager.add(this.ambientLight);

    // ---------- Key Light (Primary Directional) ----------
    this.keyLight = new THREE.DirectionalLight(0xffffff, theme.lighting.keyIntensity * 1.2);
    this.keyLight.position.set(6, 9, 7);
    this.keyLight.castShadow = true;

    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;

    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 6;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.camera.near = 0.1;
    this.keyLight.shadow.camera.far = 25;

    this.keyLight.shadow.bias = -0.001;
    this.keyLight.shadow.normalBias = 0.02;

    sceneManager.add(this.keyLight);

    // ---------- Fill Light (Secondary Directional) ----------
    this.fillLight = new THREE.DirectionalLight(0xd0e0ff, Math.max(0.6, theme.lighting.fillIntensity));
    this.fillLight.position.set(-6, 4, -4);
    this.fillLight.castShadow = false;
    sceneManager.add(this.fillLight);

    // ---------- Top Front Studio Light ----------
    this.studioLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.studioLight.position.set(0, 8, 4);
    this.studioLight.castShadow = false;
    sceneManager.add(this.studioLight);

    // ---------- Hemisphere Light ----------
    this.hemisphereLight = new THREE.HemisphereLight(
      0x88bbff, // sky color (soft bright blue)
      0x444455, // ground color
      0.5       // intensity
    );
    sceneManager.add(this.hemisphereLight);

    // ---------- Rim Light (Back Light) ----------
    this.rimLight = new THREE.DirectionalLight(0xaabbff, 0.5);
    this.rimLight.position.set(-3, 5, -8);
    this.rimLight.castShadow = false;
    sceneManager.add(this.rimLight);

    // ---------- Theme Change Handler ----------
    this.themeManager.onChange((theme) => {
      this.ambientLight.intensity = Math.max(0.6, theme.lighting.ambientIntensity);
      this.keyLight.intensity = theme.lighting.keyIntensity * 1.2;
      this.fillLight.intensity = Math.max(0.6, theme.lighting.fillIntensity);
    });

    console.log('[Lighting] Studio lighting rig initialized');
  }

  dispose() {
    this.sceneManager.remove(this.ambientLight);
    this.sceneManager.remove(this.keyLight);
    this.sceneManager.remove(this.fillLight);
    this.sceneManager.remove(this.studioLight);
    this.sceneManager.remove(this.hemisphereLight);
    this.sceneManager.remove(this.rimLight);

    this.keyLight.shadow.map?.dispose();
  }
}
