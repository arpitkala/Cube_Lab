/**
 * ThemeManager.js — Visual Theme State Manager
 * 
 * Manages the active visual theme (Classic, Dark, Neon) and notifies
 * subscribers when the theme changes so Materials, Lighting, and CSS
 * can update in sync.
 * 
 * COMPUTER GRAPHICS CONCEPT: Theme switching demonstrates dynamic material
 * property changes — roughness, metalness, emissive, and environment
 * intensity are all shader uniforms that update in real-time without
 * rebuilding geometry.
 */

/**
 * Theme definitions.
 * Each theme specifies: scene background, body material properties,
 * sticker material overrides, lighting intensities, and CSS tokens.
 */
const THEMES = {
  classic: {
    name: 'Classic',
    scene: {
      background: 0x1a1a2e,
      fogColor: 0x1a1a2e,
      fogDensity: 0.02,
    },
    body: {
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.0,
    },
    sticker: {
      roughness: 0.35,
      metalness: 0.05,
      emissiveIntensity: 0.0,
    },
    lighting: {
      ambientIntensity: 0.5,
      keyIntensity: 1.2,
      fillIntensity: 0.4,
    },
    css: {
      '--bg-primary': '#1a1a2e',
      '--bg-secondary': '#16213e',
      '--accent-primary': '#6c63ff',
    },
  },

  dark: {
    name: 'Dark Studio',
    scene: {
      background: 0x0a0a0f,
      fogColor: 0x0a0a0f,
      fogDensity: 0.015,
    },
    body: {
      color: 0x0a0a0a,
      roughness: 0.4,
      metalness: 0.1,
    },
    sticker: {
      roughness: 0.3,
      metalness: 0.1,
      emissiveIntensity: 0.0,
    },
    lighting: {
      ambientIntensity: 0.4,
      keyIntensity: 1.4,
      fillIntensity: 0.3,
    },
    css: {
      '--bg-primary': '#0a0a0f',
      '--bg-secondary': '#12121a',
      '--accent-primary': '#6c63ff',
    },
  },

  neon: {
    name: 'Cyber Neon',
    scene: {
      background: 0x050510,
      fogColor: 0x050510,
      fogDensity: 0.01,
    },
    body: {
      color: 0x0a0a15,
      roughness: 0.2,
      metalness: 0.3,
    },
    sticker: {
      roughness: 0.15,
      metalness: 0.2,
      emissiveIntensity: 0.5,
    },
    lighting: {
      ambientIntensity: 0.3,
      keyIntensity: 1.0,
      fillIntensity: 0.5,
    },
    css: {
      '--bg-primary': '#050510',
      '--bg-secondary': '#0a0a20',
      '--accent-primary': '#00ffcc',
    },
  },
};

export class ThemeManager {
  constructor() {
    /** @type {string} current theme key */
    this.currentTheme = 'dark'; // default theme

    /** @type {Set<Function>} change listeners */
    this._listeners = new Set();
  }

  /**
   * Get the current theme definition object.
   * @returns {object}
   */
  getTheme() {
    return THEMES[this.currentTheme];
  }

  /**
   * Get all available theme keys.
   * @returns {string[]}
   */
  getAvailableThemes() {
    return Object.keys(THEMES);
  }

  /**
   * Switch to a different theme.
   * Updates CSS custom properties and notifies all listeners.
   * 
   * @param {string} themeKey — 'classic', 'dark', or 'neon'
   */
  setTheme(themeKey) {
    if (!THEMES[themeKey]) {
      console.warn(`Unknown theme: "${themeKey}". Available: ${Object.keys(THEMES).join(', ')}`);
      return;
    }
    if (themeKey === this.currentTheme) return;

    this.currentTheme = themeKey;
    const theme = THEMES[themeKey];

    // Update CSS custom properties on :root
    if (theme.css) {
      const root = document.documentElement;
      for (const [prop, value] of Object.entries(theme.css)) {
        root.style.setProperty(prop, value);
      }
    }

    // Notify listeners
    for (const listener of this._listeners) {
      listener(theme, themeKey);
    }

    console.log(`[ThemeManager] Switched to theme: ${theme.name}`);
  }

  /**
   * Subscribe to theme changes.
   * @param {Function} callback — receives (themeDefinition, themeKey)
   * @returns {Function} unsubscribe function
   */
  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }
}
