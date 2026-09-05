/**
 * MovesPanel.js — Right-side face move controls
 * Clear, color-coded, high-contrast face rotation buttons with move target highlighting.
 */

import { Move } from '../core/Move.js';

export class MovesPanel {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="moves-inner">
        <div class="moves-header">FACE MOVES</div>
        <div class="moves-face-group">
          <button class="btn move-btn face-U" data-move="U" data-face="U" data-dir="1" title="U — Top CW">U</button>
          <button class="btn move-btn face-U" data-move="U'" data-face="U" data-dir="-1" title="U' — Top CCW">U'</button>
        </div>
        <div class="moves-face-group">
          <button class="btn move-btn face-D" data-move="D" data-face="D" data-dir="1" title="D — Bottom CW">D</button>
          <button class="btn move-btn face-D" data-move="D'" data-face="D" data-dir="-1" title="D' — Bottom CCW">D'</button>
        </div>
        <div class="moves-face-group">
          <button class="btn move-btn face-L" data-move="L" data-face="L" data-dir="1" title="L — Left CW">L</button>
          <button class="btn move-btn face-L" data-move="L'" data-face="L" data-dir="-1" title="L' — Left CCW">L'</button>
        </div>
        <div class="moves-face-group">
          <button class="btn move-btn face-R" data-move="R" data-face="R" data-dir="1" title="R — Right CW">R</button>
          <button class="btn move-btn face-R" data-move="R'" data-face="R" data-dir="-1" title="R' — Right CCW">R'</button>
        </div>
        <div class="moves-face-group">
          <button class="btn move-btn face-F" data-move="F" data-face="F" data-dir="1" title="F — Front CW">F</button>
          <button class="btn move-btn face-F" data-move="F'" data-face="F" data-dir="-1" title="F' — Front CCW">F'</button>
        </div>
        <div class="moves-face-group">
          <button class="btn move-btn face-B" data-move="B" data-face="B" data-dir="1" title="B — Back CW">B</button>
          <button class="btn move-btn face-B" data-move="B'" data-face="B" data-dir="-1" title="B' — Back CCW">B'</button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const move = new Move(btn.dataset.face, parseInt(btn.dataset.dir));
        this.callbacks.onMove?.(move);
      });
    });
  }

  highlightMove(notation) {
    this.clearHighlight();
    if (!notation) return;
    const btn = this.container.querySelector(`.move-btn[data-move="${notation}"]`);
    if (btn) btn.classList.add('move-btn-highlighted');
  }

  clearHighlight() {
    this.container.querySelectorAll('.move-btn').forEach(b => b.classList.remove('move-btn-highlighted'));
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); this.clearHighlight(); }
}
