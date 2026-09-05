/**
 * PatternGallery.js — Famous 3x3 Rubik's Cube Preset Patterns Gallery
 * 
 * Provides algorithms for popular patterns: Checkerboard, Cube-in-a-Cube,
 * Superflip, Anaconda, Donut, and Vertical Stripes.
 * Uses standard canonical face notations (R, L, U, D, F, B).
 */

export const PATTERNS = [
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    subtitle: 'Classic alternating grid on all 6 faces',
    moves: ['R2', 'L2', 'U2', 'D2', 'F2', 'B2'],
    preview: '🏁'
  },
  {
    id: 'cube_in_cube',
    name: 'Cube in a Cube',
    subtitle: 'Embedded 2×2 inside 3×3',
    moves: ['F', 'L', 'F', "U'", 'R', 'U', 'F2', 'L2', "U'", "L'", 'B', "D'", "B'", 'L2', 'U'],
    preview: '🧊'
  },
  {
    id: 'donut',
    name: 'Donut (Center Switch)',
    subtitle: 'Swapped center tiles on all faces',
    moves: ['U', "D'", 'R', "L'", 'F', "B'", 'U', "D'"],
    preview: '🍩'
  },
  {
    id: 'anaconda',
    name: 'Anaconda (Snake)',
    subtitle: 'Winding continuous color ribbon',
    moves: ['L', 'U', 'B', "U'", 'R', 'L', 'B', 'R', 'F', "B'", 'D', 'R'],
    preview: '🐍'
  },
  {
    id: 'stripes',
    name: 'Vertical Stripes',
    subtitle: 'Clean parallel line pattern',
    moves: ['F', 'U', 'F', 'R', 'L2', 'B', 'D', 'R', 'D2', 'L', 'D', 'B', 'R2', 'L', 'F', 'U', 'F'],
    preview: '💈'
  },
  {
    id: 'superflip',
    name: 'Superflip',
    subtitle: 'All 12 edges flipped in place',
    moves: [
      'U', 'R2', 'F', 'B', 'R', 'B2', 'R', 'U2', 'L', 'B2',
      'R', "U'", 'D', 'R2', 'F', "R'", 'L', 'B2', 'U2', 'F2'
    ],
    preview: '✨'
  }
];

export class PatternGallery {
  /**
   * @param {HTMLElement} container
   * @param {Function} onApplyPattern - (movesArray) => void
   */
  constructor(container, onApplyPattern) {
    this.container = container;
    this.onApplyPattern = onApplyPattern;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="pattern-inner ui-panel-glass">
        <div class="pattern-header">
          <div class="pattern-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span class="pattern-title">Pattern Gallery</span>
          </div>
          <button class="btn btn-close" id="pattern-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="pattern-grid">
          ${PATTERNS.map(p => `
            <div class="pattern-card" data-id="${p.id}">
              <div class="pattern-card-icon">${p.preview}</div>
              <div class="pattern-card-info">
                <div class="pattern-card-name">${p.name}</div>
                <div class="pattern-card-sub">${p.subtitle}</div>
                <div class="pattern-card-moves">${p.moves.join(' ')}</div>
              </div>
              <button class="btn btn--sm btn--primary pattern-apply-btn">Apply Pattern</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.querySelector('#pattern-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll('.pattern-card').forEach(card => {
      const id = card.dataset.id;
      const pattern = PATTERNS.find(p => p.id === id);
      card.querySelector('.pattern-apply-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pattern) {
          this.onApplyPattern?.(pattern.moves);
          this.hide();
        }
      });
    });
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
