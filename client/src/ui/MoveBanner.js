/**
 * MoveBanner.js — Real-Time Top Move Explanation Notification Line
 * 
 * Whenever any move button (D, F, R, U, L, B, etc.) or keyboard shortcut is pressed,
 * this component displays a sleek, top notification line explaining exactly what that move does.
 */

const FACE_NAMES = {
  U: 'Up (Top)',
  D: 'Down (Bottom)',
  L: 'Left',
  R: 'Right',
  F: 'Front',
  B: 'Back',
  M: 'Middle (Vertical)',
  E: 'Equator (Horizontal)',
  S: 'Standing (Center)',
  X: 'Whole Cube Pitch (X)',
  Y: 'Whole Cube Yaw (Y)',
  Z: 'Whole Cube Roll (Z)',
};

const DIRECTION_EXPLANATIONS = {
  1: 'rotated 90° Clockwise',
  '-1': 'rotated 90° Counter-Clockwise (Prime)',
  2: 'rotated 180° Half-Turn',
};

export class MoveBanner {
  constructor(container) {
    this.container = container;
    this.timer = null;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="move-banner-inner ui-panel-glass hidden" id="move-banner-card">
        <div class="move-banner-badge" id="banner-badge">D</div>
        <div class="move-banner-text">
          <span class="move-banner-title" id="banner-title">Down Face</span>
          <span class="move-banner-desc" id="banner-desc">rotated 90° Clockwise</span>
        </div>
      </div>
    `;
  }

  /**
   * Display live explanation for a move
   * @param {import('../core/Move.js').Move|string} move
   */
  showMove(move) {
    const card = this.container.querySelector('#move-banner-card');
    const badge = this.container.querySelector('#banner-badge');
    const title = this.container.querySelector('#banner-title');
    const desc = this.container.querySelector('#banner-desc');

    if (!card || !badge || !title || !desc) return;

    let notation = '';
    let face = 'F';
    let dir = 1;

    if (typeof move === 'string') {
      notation = move;
      face = move[0];
      dir = move.includes("'") ? -1 : move.includes('2') ? 2 : 1;
    } else if (move && move.face) {
      notation = move.toString();
      face = move.face;
      dir = move.direction;
    } else {
      return;
    }

    const faceName = FACE_NAMES[face] || `Face ${face}`;
    const dirText = DIRECTION_EXPLANATIONS[dir] || 'rotated';

    badge.textContent = notation;
    title.textContent = faceName;
    desc.textContent = dirText;

    // Face color theme
    card.setAttribute('data-face', face);

    // Reset visibility and animation
    card.classList.remove('hidden');
    card.classList.remove('banner-pop');
    // Force reflow
    void card.offsetWidth;
    card.classList.add('banner-pop');

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      card.classList.remove('banner-pop');
      card.classList.add('hidden');
    }, 2800);
  }
}
