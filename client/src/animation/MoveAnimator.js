/**
 * MoveAnimator.js — Smooth Layer Rotation Animation
 * 
 * Animates cube layer rotations using the pivot Object3D technique:
 * 1. Create a temporary pivot at origin
 * 2. Attach affected cubies to the pivot
 * 3. Smoothly rotate the pivot from 0° to 90°
 * 4. Detach cubies and sync logical state
 * 
 * COMPUTER GRAPHICS CONCEPTS:
 * - Hierarchical Transformation: Cubies are temporarily re-parented to a
 *   pivot Object3D. Rotating the pivot rotates all children (the layer).
 * - Animation / Interpolation: Progress is interpolated 0→1 over time,
 *   with cubic ease-in-out for smooth acceleration/deceleration.
 * - Local vs World Space: pivot.attach() preserves world transforms when
 *   re-parenting, ensuring cubies don't jump positions.
 */

import * as THREE from 'three';

export class MoveAnimator {
  /**
   * @param {import('../core/Puzzle.js').Puzzle} puzzle
   * @param {import('../rendering/SceneManager.js').SceneManager} sceneManager
   */
  constructor(puzzle, sceneManager) {
    this.puzzle = puzzle;
    this.sceneManager = sceneManager;

    /** Temporary pivot for layer rotation */
    this.pivot = new THREE.Object3D();
    this.pivot.name = 'RotationPivot';

    /** Is any animation currently playing? */
    this.isAnimating = false;

    /** Move queue for sequential animations */
    this.queue = [];

    /** Current animation state */
    this._current = null;

    /** Speed multiplier (1 = normal, 2 = double speed, etc.) */
    this._speed = 1.0;

    /** Base duration per move in seconds */
    this._baseDuration = 0.3;

    /** Paused state for playback control */
    this._paused = false;

    /** Callback when any move completes */
    this.onMoveComplete = null;

    // Register in the render loop
    sceneManager.onUpdate((delta) => this._update(delta));
  }

  get speed() { return this._speed; }
  set speed(val) { this._speed = Math.max(0.25, Math.min(5, val)); }

  get paused() { return this._paused; }

  pause() { this._paused = true; }
  resume() { this._paused = false; }

  /**
   * Animate a single move. Returns a promise that resolves when complete.
   * @param {import('../core/Move.js').Move} move
   * @param {object} [options]
   * @param {boolean} [options.recordHistory=true]
   * @param {number} [options.duration] — override duration
   * @returns {Promise<void>}
   */
  animateMove(move, options = {}) {
    return new Promise((resolve) => {
      this.queue.push({ move, resolve, options });
      if (!this.isAnimating) {
        this._startNext();
      }
    });
  }

  /**
   * Animate a sequence of moves one after another.
   * @param {import('../core/Move.js').Move[]} moves
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async animateSequence(moves, options = {}) {
    for (const move of moves) {
      await this.animateMove(move, options);
    }
  }

  /**
   * Cancel all queued animations and finish current instantly.
   */
  cancelAll() {
    this.queue = [];
    if (this._current) {
      this._finishCurrent();
    }
    this._paused = false;
  }

  /**
   * Update the puzzle reference (when switching cube sizes).
   * @param {import('../core/Puzzle.js').Puzzle} puzzle
   */
  setPuzzle(puzzle) {
    this.cancelAll();
    this.puzzle = puzzle;
  }

  /** Start animating the next move in queue */
  _startNext() {
    if (this.queue.length === 0) {
      this.isAnimating = false;
      this.puzzle.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    this.puzzle.isAnimating = true;

    const { move, resolve, options } = this.queue.shift();

    // Get affected cubies for this layer
    const layerCoord = move.getLayerCoordinate(this.puzzle.size);
    const affectedCubies = this.puzzle.getCubiesInLayer(move.axis, layerCoord);

    // Reset pivot
    this.pivot.position.set(0, 0, 0);
    this.pivot.rotation.set(0, 0, 0);
    this.puzzle.group.add(this.pivot);

    // Attach affected cubies to pivot (preserves world transform)
    for (const cubie of affectedCubies) {
      this.pivot.attach(cubie.mesh);
    }

    // Store animation state
    this._current = {
      move,
      resolve,
      options,
      affectedCubies,
      targetAngle: move.getRotationAngle(),
      progress: 0,
      duration: (options.duration || this._baseDuration) / this._speed,
    };
  }

  /** Per-frame update — advances animation progress */
  _update(delta) {
    if (!this._current || this._paused) return;

    const anim = this._current;
    anim.progress += delta / anim.duration;

    if (anim.progress >= 1) {
      this._finishCurrent();
    } else {
      // Cubic ease-in-out for smooth acceleration/deceleration
      const t = anim.progress;
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const angle = anim.targetAngle * eased;
      this._setPivotRotation(angle, anim.move.axis);
    }
  }

  /** Set the pivot rotation on the correct axis */
  _setPivotRotation(angle, axis) {
    this.pivot.rotation.set(
      axis === 'x' ? angle : 0,
      axis === 'y' ? angle : 0,
      axis === 'z' ? angle : 0
    );
  }

  /** Complete the current animation */
  _finishCurrent() {
    const anim = this._current;
    if (!anim) return;

    // Snap to exact final angle
    this._setPivotRotation(anim.targetAngle, anim.move.axis);

    // Detach cubies from pivot back to puzzle group
    for (const cubie of anim.affectedCubies) {
      this.puzzle.group.attach(cubie.mesh);
    }

    // Remove pivot from group
    this.puzzle.group.remove(this.pivot);

    // Apply move to logical state and sync visuals
    this.puzzle.executeMove(anim.move, anim.options.recordHistory !== false);

    // Notify
    if (this.onMoveComplete) {
      this.onMoveComplete(anim.move);
    }

    // Resolve promise
    anim.resolve(anim.move);

    // Clear and process next
    this._current = null;
    this._startNext();
  }
}
