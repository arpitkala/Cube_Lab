/**
 * ControlsPanel.js — Main Controls HUD
 * 
 * Premium floating panel with: puzzle info, timer, move counter, mode selection,
 * color-coded face move buttons, and action buttons (Scramble, Reset, Undo, Redo).
 */

import { Move } from '../core/Move.js';

export class ControlsPanel {
  /**
   * @param {HTMLElement} container
   * @param {object} callbacks
   */
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
      <div class="panel-inner">
        <!-- Header bar -->
        <div class="panel-header">
          <div class="puzzle-badge" id="puzzle-badge">
            <span class="badge-icon">◆</span>
            <span class="badge-text">3×3×3</span>
          </div>
          <div class="header-actions">
            <button class="btn icon-btn" id="btn-settings" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button class="btn icon-btn" id="btn-stats" title="Statistics">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            </button>
          </div>
        </div>

        <!-- Stats display -->
        <div class="panel-section stats-row">
          <div class="stat-item">
            <div class="stat-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">TIME</div>
              <div class="stat-value" id="timer-display">00:00.0</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">MOVES</div>
              <div class="stat-value" id="move-counter">0</div>
            </div>
          </div>
        </div>

        <!-- Mode selector -->
        <div class="panel-section">
          <div class="mode-group">
            <button class="btn mode-btn active" data-mode="manual" title="Manual Play">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/></svg>
              Manual
            </button>
            <button class="btn mode-btn" data-mode="solve" title="Auto Solve">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              Solve
            </button>
            <button class="btn mode-btn" data-mode="learn" title="Guided Learning">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Learn
            </button>
          </div>
        </div>

        <!-- Face move buttons — color coded -->
        <div class="panel-section">
          <div class="panel-section-title">FACE MOVES</div>
          <div class="move-grid">
            <button class="btn move-btn face-U" data-face="U" data-dir="1" title="U — Top face clockwise">U</button>
            <button class="btn move-btn face-U" data-face="U" data-dir="-1" title="U' — Top face counter-clockwise">U'</button>
            <button class="btn move-btn face-D" data-face="D" data-dir="1" title="D — Bottom face clockwise">D</button>
            <button class="btn move-btn face-D" data-face="D" data-dir="-1" title="D' — Bottom face counter-clockwise">D'</button>
            <button class="btn move-btn face-L" data-face="L" data-dir="1" title="L — Left face clockwise">L</button>
            <button class="btn move-btn face-L" data-face="L" data-dir="-1" title="L' — Left face counter-clockwise">L'</button>
            <button class="btn move-btn face-R" data-face="R" data-dir="1" title="R — Right face clockwise">R</button>
            <button class="btn move-btn face-R" data-face="R" data-dir="-1" title="R' — Right face counter-clockwise">R'</button>
            <button class="btn move-btn face-F" data-face="F" data-dir="1" title="F — Front face clockwise">F</button>
            <button class="btn move-btn face-F" data-face="F" data-dir="-1" title="F' — Front face counter-clockwise">F'</button>
            <button class="btn move-btn face-B" data-face="B" data-dir="1" title="B — Back face clockwise">B</button>
            <button class="btn move-btn face-B" data-face="B" data-dir="-1" title="B' — Back face counter-clockwise">B'</button>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="panel-section">
          <div class="action-grid">
            <button class="btn action-btn action-scramble" id="btn-scramble" title="Scramble Puzzle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
              Scramble
            </button>
            <button class="btn action-btn action-reset" id="btn-reset" title="Reset to Solved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset
            </button>
            <button class="btn action-btn" id="btn-undo" title="Undo (Ctrl+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              Undo
            </button>
            <button class="btn action-btn" id="btn-redo" title="Redo (Ctrl+Y)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
              Redo
            </button>
          </div>
        </div>

        <!-- Keyboard hint -->
        <div class="panel-hint">
          <span>Keys: U D L R F B · Shift = inverse · Ctrl+Z/Y</span>
        </div>

        <!-- Back to menu -->
        <div class="panel-section panel-footer">
          <button class="btn footer-btn" id="btn-back" title="Back to Menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to Menu
          </button>
        </div>
      </div>
    `;

    const cb = this.callbacks;

    // Move buttons
    this.container.querySelectorAll('.move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const move = new Move(btn.dataset.face, parseInt(btn.dataset.dir));
        cb.onMove?.(move);
      });
    });

    this.container.querySelector('#btn-scramble')?.addEventListener('click', () => cb.onScramble?.());
    this.container.querySelector('#btn-reset')?.addEventListener('click', () => cb.onReset?.());
    this.container.querySelector('#btn-undo')?.addEventListener('click', () => cb.onUndo?.());
    this.container.querySelector('#btn-redo')?.addEventListener('click', () => cb.onRedo?.());
    this.container.querySelector('#btn-settings')?.addEventListener('click', () => cb.onSettings?.());
    this.container.querySelector('#btn-stats')?.addEventListener('click', () => cb.onStats?.());
    this.container.querySelector('#btn-back')?.addEventListener('click', () => cb.onBack?.());

    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cb.onModeChange?.(btn.dataset.mode);
      });
    });
  }

  setPuzzleSize(size) {
    const el = this.container.querySelector('.badge-text');
    if (el) el.textContent = `${size}×${size}×${size}`;
  }

  setMoveCount(count) {
    const el = this.container.querySelector('#move-counter');
    if (el) el.textContent = count;
  }

  startTimer() {
    if (this._timerRunning) return;
    this._timerRunning = true;
    this._startTime = Date.now() - this._elapsed;
    this._timerInterval = setInterval(() => this._updateTimerDisplay(), 100);
  }

  stopTimer() {
    this._timerRunning = false;
    clearInterval(this._timerInterval);
    this._timerInterval = null;
    this._elapsed = this._startTime ? Date.now() - this._startTime : 0;
  }

  resetTimer() {
    this.stopTimer();
    this._elapsed = 0;
    this._startTime = null;
    this._updateTimerDisplay();
  }

  getElapsed() {
    return this._timerRunning ? Date.now() - this._startTime : this._elapsed;
  }

  _updateTimerDisplay() {
    const el = this.container.querySelector('#timer-display');
    if (!el) return;
    const ms = this.getElapsed();
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    el.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${tenths}`;
  }

  setMode(mode) {
    this.container.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); this.resetTimer(); }
}
