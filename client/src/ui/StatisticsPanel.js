/**
 * StatisticsPanel.js — Session Statistics & WCA Speedcubing Analytics
 * Premium stats modal with Ao5, Ao12, and SVG trend graph.
 */

export class StatisticsPanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.solveTimesHistory = [];
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="stats-inner">
        <div class="stats-header">
          <div class="stats-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            <span class="stats-title">Session Statistics & WCA Analytics</span>
          </div>
          <button class="btn btn-close" id="stats-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="stat-card-label">Puzzle</div>
            <div class="stat-card-value" id="stat-puzzle">3×3×3</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon accent-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-card-label">Solves</div>
            <div class="stat-card-value" id="stat-solves">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon accent-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
            <div class="stat-card-label">Best Time</div>
            <div class="stat-card-value" id="stat-best">—</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon accent-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </div>
            <div class="stat-card-label">Total Moves</div>
            <div class="stat-card-value" id="stat-total-moves">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon accent-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6"/><path d="M6 20V10"/><path d="M18 20V4"/></svg>
            </div>
            <div class="stat-card-label">Current Ao5</div>
            <div class="stat-card-value" id="stat-ao5">—</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon accent-cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-card-label">Current Ao12</div>
            <div class="stat-card-value" id="stat-ao12">—</div>
          </div>
        </div>

        <div class="stats-chart-section">
          <div class="stats-chart-title">Solve Time Progression Chart</div>
          <div class="stats-chart-wrapper" id="stats-chart">
            <span class="chart-empty">No solves recorded yet in this session.</span>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#stats-close')?.addEventListener('click', () => {
      this.callbacks.onClose?.();
    });
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.callbacks.onClose?.();
    });
  }

  addSolveRecord(timeMs) {
    this.solveTimesHistory.push(timeMs);
    this._renderChart();
  }

  _calculateWCAAverage(count) {
    if (this.solveTimesHistory.length < count) return '—';
    const recent = this.solveTimesHistory.slice(-count).sort((a, b) => a - b);
    // Drop fastest and slowest
    const middle = recent.slice(1, count - 1);
    const avg = middle.reduce((acc, v) => acc + v, 0) / middle.length;
    return this._formatMs(avg);
  }

  _formatMs(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const msRemainder = Math.floor((ms % 1000) / 10);
    return `${m > 0 ? `${m}:` : ''}${s.toString().padStart(2, '0')}.${msRemainder.toString().padStart(2, '0')}`;
  }

  _renderChart() {
    const wrapper = this.container.querySelector('#stats-chart');
    if (!wrapper) return;
    if (this.solveTimesHistory.length === 0) {
      wrapper.innerHTML = `<span class="chart-empty">No solves recorded yet in this session.</span>`;
      return;
    }

    const width = 460;
    const height = 120;
    const maxVal = Math.max(...this.solveTimesHistory);
    const minVal = Math.min(...this.solveTimesHistory);
    const range = (maxVal - minVal) || 1;

    const points = this.solveTimesHistory.map((val, idx) => {
      const x = (idx / Math.max(1, this.solveTimesHistory.length - 1)) * (width - 40) + 20;
      const y = height - 20 - ((val - minVal) / range) * (height - 40);
      return `${x},${y}`;
    }).join(' ');

    wrapper.innerHTML = `
      <svg width="100%" height="120" viewBox="0 0 ${width} ${height}">
        <polyline fill="none" stroke="#00e5ff" stroke-width="2.5" points="${points}" />
        ${this.solveTimesHistory.map((val, idx) => {
          const x = (idx / Math.max(1, this.solveTimesHistory.length - 1)) * (width - 40) + 20;
          const y = height - 20 - ((val - minVal) / range) * (height - 40);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#00e5ff" />`;
        }).join('')}
      </svg>
    `;
  }

  update(data) {
    const set = (id, val) => {
      const el = this.container.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };
    if (data.puzzle) set('stat-puzzle', `${data.puzzle}×${data.puzzle}×${data.puzzle}`);
    if (data.solves !== undefined) set('stat-solves', data.solves);
    if (data.bestTime) set('stat-best', data.bestTime);
    if (data.totalMoves !== undefined) set('stat-total-moves', data.totalMoves);

    set('stat-ao5', this._calculateWCAAverage(5));
    set('stat-ao12', this._calculateWCAAverage(12));
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
