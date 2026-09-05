/**
 * HudBar.js — Top-center floating HUD
 * Clear, high-visibility stats and mode controls (Play, Guide, Solve, Learn).
 */

export class HudBar {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._timerInterval = null;
    this._startTime = null;
    this._elapsed = 0;
    this._timerRunning = false;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="hud-inner">
        <div class="hud-badge" id="hud-badge">
          <span class="hud-badge-dot"></span>
          <span class="hud-badge-text">3×3×3</span>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-stat" title="Elapsed Time">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="hud-stat-value" id="hud-timer">00:00.0</span>
        </div>
        <div class="hud-stat" title="Total Moves">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          <span class="hud-stat-value" id="hud-moves">0</span>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-modes">
          <button class="hud-mode active" data-mode="manual" title="Manual Play">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/></svg>
            Play
          </button>
          <button class="hud-mode" data-mode="guide" title="Interactive Step-by-Step Guidance">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            Guide
          </button>
          <button class="hud-mode" data-mode="solve" title="Auto Solve Animation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            Solve
          </button>
          <button class="hud-mode" data-mode="learn" title="Guided Explanation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Learn
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.hud-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.hud-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onModeChange?.(btn.dataset.mode);
      });
    });
  }

  setPuzzleSize(size, isMirror = false) {
    const el = this.container.querySelector('.hud-badge-text');
    if (el) {
      if (isMirror === 'gold') el.textContent = `Gold Mirror 3×3`;
      else if (isMirror) el.textContent = `Silver Mirror 3×3`;
      else el.textContent = `${size}×${size}×${size}`;
    }
  }

  setMoveCount(count) {
    const el = this.container.querySelector('#hud-moves');
    if (el) el.textContent = count;
  }

  startTimer() {
    if (this._timerRunning) return;
    this._timerRunning = true;
    this._startTime = Date.now() - this._elapsed;
    this._timerInterval = setInterval(() => this._updateTimer(), 100);
  }

  stopTimer() {
    this._timerRunning = false;
    clearInterval(this._timerInterval);
    this._elapsed = this._startTime ? Date.now() - this._startTime : 0;
  }

  resetTimer() {
    this.stopTimer();
    this._elapsed = 0;
    this._startTime = null;
    this._updateTimer();
  }

  getElapsed() {
    return this._timerRunning ? Date.now() - this._startTime : this._elapsed;
  }

  _updateTimer() {
    const el = this.container.querySelector('#hud-timer');
    if (!el) return;
    const ms = this.getElapsed();
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const t = Math.floor((ms % 1000) / 100);
    el.textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${t}`;
  }

  setMode(mode) {
    this.container.querySelectorAll('.hud-mode').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); this.resetTimer(); }
}
