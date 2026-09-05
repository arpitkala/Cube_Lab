/**
 * SolvePanel.js — Auto-Solve Playback Overlay
 * Draggable card with playback controls.
 */

export class SolvePanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="solve-inner">
        <div class="solve-header" id="solve-drag-handle" title="Drag to move panel">
          <div class="solve-header-left">
            <div class="drag-grip" title="Drag panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
            </div>
            <div class="solve-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <span class="solve-title">AUTO SOLVE</span>
          </div>
          <button class="btn btn-close" id="solve-close" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="solve-body">
          <div class="solve-step" id="solve-step">Step 0 of 0</div>
          <div class="solve-move" id="solve-move">—</div>
          <div class="solve-desc" id="solve-desc"></div>
        </div>

        <div class="solve-progress-track">
          <div class="solve-progress-fill" id="solve-progress" style="width: 0%"></div>
        </div>

        <div class="solve-controls">
          <button class="btn ctrl-btn" id="solve-restart" title="Restart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          <button class="btn ctrl-btn" id="solve-prev" title="Previous Step">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="btn ctrl-btn ctrl-play" id="solve-play" title="Play / Pause">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="btn ctrl-btn" id="solve-next" title="Next Step">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="btn ctrl-btn" id="solve-skip" title="Skip to End">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>
        </div>

        <div class="solve-speed">
          <label>Speed</label>
          <input type="range" id="solve-speed-slider" min="0.25" max="4" step="0.25" value="1">
          <span id="solve-speed-val">1×</span>
        </div>
      </div>
    `;

    const cb = this.callbacks;
    this.container.querySelector('#solve-close')?.addEventListener('click', () => cb.onClose?.());
    this.container.querySelector('#solve-restart')?.addEventListener('click', () => cb.onRestart?.());
    this.container.querySelector('#solve-prev')?.addEventListener('click', () => cb.onPrev?.());
    this.container.querySelector('#solve-play')?.addEventListener('click', () => cb.onPlayPause?.());
    this.container.querySelector('#solve-next')?.addEventListener('click', () => cb.onNext?.());
    this.container.querySelector('#solve-skip')?.addEventListener('click', () => cb.onSkip?.());

    const slider = this.container.querySelector('#solve-speed-slider');
    slider?.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      this.container.querySelector('#solve-speed-val').textContent = `${val}×`;
      cb.onSpeedChange?.(val);
    });
  }

  updateStep(stepNum, totalSteps, notation, description) {
    const stepEl = this.container.querySelector('#solve-step');
    const moveEl = this.container.querySelector('#solve-move');
    const descEl = this.container.querySelector('#solve-desc');
    const progEl = this.container.querySelector('#solve-progress');
    if (stepEl) stepEl.textContent = `Step ${stepNum} of ${totalSteps}`;
    if (moveEl) moveEl.textContent = notation || '—';
    if (descEl) descEl.textContent = description || '';
    if (progEl) progEl.style.width = totalSteps > 0 ? `${(stepNum / totalSteps) * 100}%` : '0%';
  }

  setPlaying(isPlaying) {
    const btn = this.container.querySelector('#solve-play');
    if (btn) {
      btn.innerHTML = isPlaying 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
