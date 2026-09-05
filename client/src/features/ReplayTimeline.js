/**
 * ReplayTimeline.js — Move History Timeline Replay Scrubber
 * 
 * Allows step-by-step video-style scrubbing forward and backward through solve history.
 */

export class ReplayTimeline {
  /**
   * @param {HTMLElement} container
   * @param {Object} callbacks
   * @param {Function} callbacks.onScrubToStep - (stepIndex) => void
   * @param {Function} callbacks.onClose - () => void
   */
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.history = [];
    this.currentIndex = 0;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="replay-inner ui-panel-glass">
        <div class="replay-header">
          <div class="replay-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span class="replay-title">Solve Replay Scrubber</span>
          </div>
          <span class="replay-counter" id="replay-step-label">Step 0 / 0</span>
          <button class="btn btn-close" id="replay-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="replay-controls">
          <button class="btn btn--icon" id="replay-prev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <input type="range" id="replay-slider" min="0" max="0" value="0" class="slider-field" />
          <button class="btn btn--icon" id="replay-next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    `;

    const slider = this.container.querySelector('#replay-slider');
    const prevBtn = this.container.querySelector('#replay-prev');
    const nextBtn = this.container.querySelector('#replay-next');

    slider?.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value);
      this.currentIndex = idx;
      this._updateLabel();
      this.callbacks.onScrubToStep?.(idx);
    });

    prevBtn?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        if (slider) slider.value = this.currentIndex;
        this._updateLabel();
        this.callbacks.onScrubToStep?.(this.currentIndex);
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (this.currentIndex < this.history.length) {
        this.currentIndex++;
        if (slider) slider.value = this.currentIndex;
        this._updateLabel();
        this.callbacks.onScrubToStep?.(this.currentIndex);
      }
    });

    this.container.querySelector('#replay-close')?.addEventListener('click', () => {
      this.hide();
      this.callbacks.onClose?.();
    });
  }

  setHistory(historyMoves) {
    this.history = [...(historyMoves || [])];
    this.currentIndex = this.history.length;
    const slider = this.container.querySelector('#replay-slider');
    if (slider) {
      slider.max = this.history.length;
      slider.value = this.currentIndex;
    }
    this._updateLabel();
  }

  _updateLabel() {
    const label = this.container.querySelector('#replay-step-label');
    if (label) {
      label.textContent = `Step ${this.currentIndex} / ${this.history.length}`;
    }
  }

  show() {
    this.container.classList.remove('hidden');
    const slider = this.container.querySelector('#replay-slider');
    if (slider) {
      slider.max = this.history.length;
      slider.value = this.currentIndex;
    }
    this._updateLabel();
  }

  hide() { this.container.classList.add('hidden'); }
}
