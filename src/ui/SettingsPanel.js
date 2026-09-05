/**
 * SettingsPanel.js — Settings / Theme Switching & Studio Features
 * Premium modal with theme previews, camera views, X-Ray mode, WCA inspection & ASMR sound settings.
 */

export class SettingsPanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="settings-inner">
        <div class="settings-header">
          <div class="settings-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="settings-title">Studio Settings</span>
          </div>
          <button class="btn btn-close" id="settings-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="settings-section">
          <div class="settings-label">VISUAL THEME</div>
          <div class="theme-group">
            <button class="btn theme-btn" data-theme="classic">
              <div class="theme-preview theme-preview-classic"></div>
              <span>Classic</span>
            </button>
            <button class="btn theme-btn active" data-theme="dark">
              <div class="theme-preview theme-preview-dark"></div>
              <span>Dark Studio</span>
            </button>
            <button class="btn theme-btn" data-theme="neon">
              <div class="theme-preview theme-preview-neon"></div>
              <span>Cyber Neon</span>
            </button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">FEATURES & MODES</div>
          <div class="toggles-grid">
            <label class="toggle-item">
              <input type="checkbox" id="toggle-xray" />
              <span>🔮 X-Ray Glass Mode</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="toggle-inspection" />
              <span>⏱️ WCA 15s Inspection Timer</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="toggle-asmr" checked />
              <span>🔊 ASMR Mechanical Sounds</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="toggle-voice" />
              <span>🎤 Web Speech Voice Controls</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="toggle-colorblind" />
              <span>👁️ Colorblind High Contrast</span>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">CAMERA VIEW</div>
          <div class="view-group">
            <button class="btn view-btn" data-view="isometric">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Isometric
            </button>
            <button class="btn view-btn" data-view="front">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Front
            </button>
            <button class="btn view-btn" data-view="top">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              Top
            </button>
            <button class="btn view-btn" data-view="right">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              Right
            </button>
          </div>
        </div>
      </div>
    `;

    const cb = this.callbacks;
    this.container.querySelector('#settings-close')?.addEventListener('click', () => cb.onClose?.());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => cb.onClose?.());

    this.container.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cb.onThemeChange?.(btn.dataset.theme);
      });
    });

    this.container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => cb.onViewChange?.(btn.dataset.view));
    });

    // Toggles
    this.container.querySelector('#toggle-xray')?.addEventListener('change', (e) => cb.onXRayToggle?.(e.target.checked));
    this.container.querySelector('#toggle-inspection')?.addEventListener('change', (e) => cb.onInspectionToggle?.(e.target.checked));
    this.container.querySelector('#toggle-asmr')?.addEventListener('change', (e) => cb.onASMRToggle?.(e.target.checked));
    this.container.querySelector('#toggle-voice')?.addEventListener('change', (e) => cb.onVoiceToggle?.(e.target.checked));
    this.container.querySelector('#toggle-colorblind')?.addEventListener('change', (e) => cb.onColorblindToggle?.(e.target.checked));
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
