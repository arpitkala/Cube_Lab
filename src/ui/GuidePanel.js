/**
 * GuidePanel.js — Interactive Guidance Mode Overlay
 * 
 * Provides real-time step-by-step solving guidance:
 * - Draggable card: drag header to move anywhere on screen.
 * - Shows current recommended move with large high-visibility notation.
 * - Highlights target button in Moves Panel.
 * - Explains move purpose and supports auto execution.
 */

export class GuidePanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="guide-inner">
        <div class="guide-header" id="guide-drag-handle" title="Drag to move panel">
          <div class="guide-header-left">
            <div class="drag-grip" title="Drag panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
            </div>
            <div class="guide-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <span class="guide-title">INTERACTIVE GUIDANCE</span>
          </div>
          <button class="btn btn-close" id="guide-close" title="Exit Guidance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="guide-body">
          <div class="guide-step-badge" id="guide-step-badge">Step 1 of 20</div>
          <div class="guide-target-box">
            <span class="guide-target-label">NEXT MOVE:</span>
            <span class="guide-target-move" id="guide-target-move">F</span>
          </div>
          <div class="guide-desc" id="guide-desc">Rotate the Front face Clockwise</div>
          <div class="guide-hint-tip" id="guide-hint-tip">💡 Tip: Press key "F" or click the highlighted "F" button</div>
        </div>

        <div class="guide-progress-track">
          <div class="guide-progress-fill" id="guide-progress" style="width: 5%"></div>
        </div>

        <div class="guide-controls">
          <button class="btn guide-btn" id="guide-prev" title="Previous Step">← Back</button>
          <button class="btn btn--primary guide-btn" id="guide-execute" title="Perform this move">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Do Move
          </button>
          <button class="btn guide-btn" id="guide-next" title="Skip to Next Step">Skip →</button>
        </div>
      </div>
    `;

    const cb = this.callbacks;
    this.container.querySelector('#guide-close')?.addEventListener('click', () => cb.onClose?.());
    this.container.querySelector('#guide-prev')?.addEventListener('click', () => cb.onPrev?.());
    this.container.querySelector('#guide-execute')?.addEventListener('click', () => cb.onExecute?.());
    this.container.querySelector('#guide-next')?.addEventListener('click', () => cb.onNext?.());
  }

  updateStep(stepNum, totalSteps, notation, description, hintTip) {
    const stepEl = this.container.querySelector('#guide-step-badge');
    const moveEl = this.container.querySelector('#guide-target-move');
    const descEl = this.container.querySelector('#guide-desc');
    const tipEl = this.container.querySelector('#guide-hint-tip');
    const progEl = this.container.querySelector('#guide-progress');

    if (stepEl) stepEl.textContent = `Step ${stepNum} of ${totalSteps}`;
    if (moveEl) moveEl.textContent = notation || '✓ Done';
    if (descEl) descEl.textContent = description || 'Puzzle solved!';
    if (tipEl) tipEl.textContent = hintTip || (notation ? `💡 Click "${notation}" or press key` : '🎉 Puzzle is fully solved!');
    if (progEl) progEl.style.width = totalSteps > 0 ? `${(stepNum / totalSteps) * 100}%` : '100%';
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
