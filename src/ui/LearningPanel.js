/**
 * LearningPanel.js — Guided Solve Mode Overlay
 * Draggable card showing step-by-step move notation and explanation.
 */

export class LearningPanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="learn-inner">
        <div class="learn-header" id="learn-drag-handle" title="Drag to move panel">
          <div class="learn-header-left">
            <div class="drag-grip" title="Drag panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
            </div>
            <div class="learn-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <span class="learn-title">LEARNING MODE</span>
          </div>
          <button class="btn btn-close" id="learn-close" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="learn-step" id="learn-step">Step 0 of 0</div>
        <div class="learn-move" id="learn-move">—</div>
        <div class="learn-desc" id="learn-desc">
          Press "Show Move" to see the next solving step animated on the cube.
        </div>

        <div class="learn-progress">
          <div class="learn-progress-bar" id="learn-progress-bar" style="width: 0%"></div>
        </div>

        <div class="learn-controls">
          <button class="btn" id="learn-prev">← Previous</button>
          <button class="btn btn--primary" id="learn-show">Show Move</button>
          <button class="btn" id="learn-next">Next →</button>
        </div>
      </div>
    `;

    const cb = this.callbacks;
    this.container.querySelector('#learn-close')?.addEventListener('click', () => cb.onClose?.());
    this.container.querySelector('#learn-prev')?.addEventListener('click', () => cb.onPrev?.());
    this.container.querySelector('#learn-show')?.addEventListener('click', () => cb.onShowMove?.());
    this.container.querySelector('#learn-next')?.addEventListener('click', () => cb.onNext?.());
  }

  updateStep(stepNum, totalSteps, notation, description) {
    const stepEl = this.container.querySelector('#learn-step');
    const moveEl = this.container.querySelector('#learn-move');
    const descEl = this.container.querySelector('#learn-desc');
    const barEl = this.container.querySelector('#learn-progress-bar');
    if (stepEl) stepEl.textContent = `Step ${stepNum} of ${totalSteps}`;
    if (moveEl) moveEl.textContent = notation || '—';
    if (descEl) descEl.textContent = description || '';
    if (barEl) barEl.style.width = totalSteps > 0 ? `${(stepNum / totalSteps) * 100}%` : '0%';
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
