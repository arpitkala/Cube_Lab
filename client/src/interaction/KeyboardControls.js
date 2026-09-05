/**
 * KeyboardControls.js — Keyboard Shortcuts for Cube Moves
 * 
 * Maps keyboard keys to cube face rotations:
 *   U/D/L/R/F/B = clockwise moves
 *   Shift+key   = counter-clockwise (prime) moves
 *   Ctrl+Z      = undo
 *   Ctrl+Y      = redo
 * 
 * COMPUTER GRAPHICS CONCEPT: Input mapping — translating discrete keyboard
 * events into 3D rotation commands that the animation system executes.
 */

import { Move } from '../core/Move.js';

const KEY_MAP = {
  'u': { face: 'U', direction: 1 },
  'd': { face: 'D', direction: 1 },
  'l': { face: 'L', direction: 1 },
  'r': { face: 'R', direction: 1 },
  'f': { face: 'F', direction: 1 },
  'b': { face: 'B', direction: 1 },
};

export class KeyboardControls {
  /**
   * @param {Function} onMove — callback(Move) when a move key is pressed
   * @param {Function} onUndo — callback() for undo
   * @param {Function} onRedo — callback() for redo
   */
  constructor(onMove, onUndo, onRedo) {
    this.onMove = onMove;
    this.onUndo = onUndo;
    this.onRedo = onRedo;
    this.enabled = true;

    this._handler = this._onKeyDown.bind(this);
    window.addEventListener('keydown', this._handler);
  }

  _onKeyDown(e) {
    if (!this.enabled) return;

    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Undo: Ctrl+Z
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      this.onUndo?.();
      return;
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
        (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      e.preventDefault();
      this.onRedo?.();
      return;
    }

    // Move keys
    const key = e.key.toLowerCase();
    const mapping = KEY_MAP[key];
    if (mapping) {
      e.preventDefault();
      const direction = e.shiftKey ? -1 : 1;
      const move = new Move(mapping.face, direction);
      this.onMove?.(move);
    }
  }

  /** Temporarily disable keyboard controls */
  disable() { this.enabled = false; }

  /** Re-enable keyboard controls */
  enable() { this.enabled = true; }

  /** Cleanup */
  dispose() {
    window.removeEventListener('keydown', this._handler);
  }
}
