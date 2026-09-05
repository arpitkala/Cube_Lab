/**
 * Materials.js — Material Factory
 * 
 * Creates and caches Three.js materials for cubie stickers and body.
 * Theme-aware: material properties update when the theme changes.
 * Supports Brushed Silver & Gold Metallic Mirror Blocks Cubes with bright specular sheen.
 * Supports X-Ray Glass mode, Colorblind Accessibility textures, and Custom Center Logos.
 */

import * as THREE from 'three';

/**
 * Standard Rubik's Cube sticker color hex values + Mirror Silver & Gold.
 */
const STICKER_COLORS = {
  white:  0xffffff,
  yellow: 0xffd500,
  red:    0xc41e3a,
  orange: 0xff5800,
  blue:   0x0051ba,
  green:  0x009e60,
  silver: 0xe0e8f5, // Bright Brushed Silver Mirror
  gold:   0xffd700, // Bright Brushed Gold Mirror
};

const INTERNAL_COLOR = 0x181818;

export class Materials {
  /**
   * @param {import('../themes/ThemeManager.js').ThemeManager} themeManager
   */
  constructor(themeManager) {
    this.themeManager = themeManager;
    this._stickerCache = new Map();
    this._bodyMaterial = null;
    this._internalMaterial = null;
    this._isXRay = false;
    this._isColorblind = false;
    this._customTextures = new Map(); // faceName -> THREE.Texture

    this.themeManager.onChange(() => this._updateMaterialsForTheme());
    console.log('[Materials] Material factory initialized');
  }

  setXRayMode(enable) {
    this._isXRay = enable;
    for (const [, mat] of this._stickerCache) {
      mat.transparent = enable;
      mat.opacity = enable ? 0.45 : 1.0;
      mat.wireframe = enable;
      mat.needsUpdate = true;
    }
    if (this._bodyMaterial) {
      this._bodyMaterial.transparent = enable;
      this._bodyMaterial.opacity = enable ? 0.2 : 1.0;
      this._bodyMaterial.needsUpdate = true;
    }
  }

  setColorblindMode(enable) {
    this._isColorblind = enable;
    // Re-create cached materials with pattern textures if enabled
    this._stickerCache.forEach(mat => mat.dispose());
    this._stickerCache.clear();
  }

  setCustomFaceTexture(faceName, texture) {
    this._customTextures.set(faceName, texture);
  }

  removeCustomFaceTexture(faceName) {
    this._customTextures.delete(faceName);
  }

  clearCustomFaceTextures() {
    this._customTextures.clear();
  }

  getStickerMaterial(colorName) {
    if (this._stickerCache.has(colorName)) {
      return this._stickerCache.get(colorName);
    }

    const hex = STICKER_COLORS[colorName];
    if (hex === undefined) {
      return this.getStickerMaterial('white');
    }

    const theme = this.themeManager.getTheme();

    const isSilver = colorName === 'silver';
    const isGold = colorName === 'gold';
    const isMirror = isSilver || isGold;

    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: isMirror ? 0.22 : theme.sticker.roughness,
      metalness: isMirror ? 0.45 : theme.sticker.metalness,
      emissive: isSilver ? 0x555566 : isGold ? 0x665511 : hex,
      emissiveIntensity: isMirror ? 0.22 : theme.sticker.emissiveIntensity,
      transparent: this._isXRay,
      opacity: this._isXRay ? 0.45 : 1.0,
      wireframe: this._isXRay,
      flatShading: false,
    });

    this._stickerCache.set(colorName, mat);
    return mat;
  }

  getBodyMaterial() {
    if (this._bodyMaterial) return this._bodyMaterial;

    const theme = this.themeManager.getTheme();
    this._bodyMaterial = new THREE.MeshStandardMaterial({
      color: theme.body.color,
      roughness: theme.body.roughness,
      metalness: theme.body.metalness,
      transparent: this._isXRay,
      opacity: this._isXRay ? 0.2 : 1.0,
      flatShading: false,
    });

    return this._bodyMaterial;
  }

  getInternalMaterial() {
    if (this._internalMaterial) return this._internalMaterial;

    this._internalMaterial = new THREE.MeshStandardMaterial({
      color: INTERNAL_COLOR,
      roughness: 0.8,
      metalness: 0.1,
    });

    return this._internalMaterial;
  }

  getCubieMaterials(faceColors) {
    const faceOrder = ['R', 'L', 'U', 'D', 'F', 'B'];
    const internalMat = this.getInternalMaterial();
    const activeFaces = Object.keys(faceColors).filter(k => !!faceColors[k]);
    const isCenterPiece = activeFaces.length === 1;

    return faceOrder.map(face => {
      const color = faceColors[face];
      if (color) {
        if (this._customTextures.has(face) && (isCenterPiece || activeFaces.length <= 1)) {
          const customMat = this.getStickerMaterial(color).clone();
          const tex = this._customTextures.get(face);
          tex.needsUpdate = true;
          customMat.map = tex;
          customMat.needsUpdate = true;
          return customMat;
        }
        return this.getStickerMaterial(color);
      }
      return internalMat;
    });
  }

  _updateMaterialsForTheme() {
    const theme = this.themeManager.getTheme();

    for (const [colorName, mat] of this._stickerCache) {
      if (colorName !== 'silver' && colorName !== 'gold') {
        mat.roughness = theme.sticker.roughness;
        mat.metalness = theme.sticker.metalness;
        mat.emissiveIntensity = theme.sticker.emissiveIntensity;
        mat.needsUpdate = true;
      }
    }

    if (this._bodyMaterial) {
      this._bodyMaterial.color.setHex(theme.body.color);
      this._bodyMaterial.roughness = theme.body.roughness;
      this._bodyMaterial.metalness = theme.body.metalness;
      this._bodyMaterial.needsUpdate = true;
    }
  }

  dispose() {
    for (const [, mat] of this._stickerCache) mat.dispose();
    this._stickerCache.clear();
    this._bodyMaterial?.dispose();
    this._internalMaterial?.dispose();
    this._bodyMaterial = null;
    this._internalMaterial = null;
  }
}
