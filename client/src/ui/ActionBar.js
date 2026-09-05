/**
 * ActionBar.js — Bottom-center floating action toolbar
 * Scramble, Reset, Hint, Patterns, Snapshot, Scanner, Logo, Undo, Redo, Settings, Stats, Back.
 */

export class ActionBar {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="actionbar-inner">
        <div class="actionbar-group actionbar-main">
          <button class="btn actionbar-btn action-scramble" id="ab-scramble" title="Scramble">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
            <span>Scramble</span>
          </button>
          <button class="btn actionbar-btn action-reset" id="ab-reset" title="Reset">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span>Reset</span>
          </button>
          <button class="btn actionbar-btn action-hint" id="ab-hint" title="Get Next Move Hint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            <span>Hint</span>
          </button>
          <div class="actionbar-sep"></div>
          <button class="btn actionbar-btn" id="ab-patterns" title="Famous Pattern Gallery">
            <span>🏁 Patterns</span>
          </button>
          <button class="btn actionbar-btn" id="ab-snapshot" title="4K HD Snapshot">
            <span>📷 Snapshot</span>
          </button>
          <button class="btn actionbar-btn" id="ab-scanner" title="Physical Cube Reader">
            <span>👁️ Camera</span>
          </button>
          <button class="btn actionbar-btn" id="ab-logo" title="Upload Custom Logo Sticker">
            <span>🎨 Logo</span>
          </button>
          <div class="actionbar-sep"></div>
          <button class="btn actionbar-btn" id="ab-undo" title="Undo (Ctrl+Z)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          </button>
          <button class="btn actionbar-btn" id="ab-redo" title="Redo (Ctrl+Y)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
          </button>
        </div>
        <div class="actionbar-group actionbar-utils">
          <button class="btn actionbar-btn" id="ab-settings" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button class="btn actionbar-btn" id="ab-stats" title="Statistics">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </button>
          <button class="btn actionbar-btn" id="ab-back" title="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>
      </div>
    `;

    const cb = this.callbacks;
    this.container.querySelector('#ab-scramble')?.addEventListener('click', () => cb.onScramble?.());
    this.container.querySelector('#ab-reset')?.addEventListener('click', () => cb.onReset?.());
    this.container.querySelector('#ab-hint')?.addEventListener('click', () => cb.onHint?.());
    this.container.querySelector('#ab-patterns')?.addEventListener('click', () => cb.onPatterns?.());
    this.container.querySelector('#ab-snapshot')?.addEventListener('click', () => cb.onSnapshot?.());
    this.container.querySelector('#ab-scanner')?.addEventListener('click', () => cb.onScanner?.());
    this.container.querySelector('#ab-logo')?.addEventListener('click', () => cb.onLogo?.());
    this.container.querySelector('#ab-undo')?.addEventListener('click', () => cb.onUndo?.());
    this.container.querySelector('#ab-redo')?.addEventListener('click', () => cb.onRedo?.());
    this.container.querySelector('#ab-settings')?.addEventListener('click', () => cb.onSettings?.());
    this.container.querySelector('#ab-stats')?.addEventListener('click', () => cb.onStats?.());
    this.container.querySelector('#ab-back')?.addEventListener('click', () => cb.onBack?.());
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
