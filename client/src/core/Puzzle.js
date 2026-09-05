/**
 * Puzzle.js — Generic PuzzleCube(size) Class
 * 
 * The central orchestrator that owns both the logical PuzzleState and the
 * visual Three.js Group of Cubie meshes. All cube sizes (2×2, 3×3, 4×4)
 * are instances of this single class, differing only in the `size` parameter.
 * 
 * COMPUTER GRAPHICS CONCEPTS:
 * - Hierarchical Scene Graph: The puzzle is a THREE.Group that contains
 *   all cubie meshes as children. Transforming the group transforms all
 *   cubies together (parent-child hierarchy).
 * - Local vs. World Coordinates: Cubies are positioned in the group's
 *   local space. The group itself can be translated/rotated in world space.
 * - Separation of Concerns: PuzzleState handles logical permutations;
 *   Puzzle handles visual updates. They stay in sync via explicit
 *   synchronization after each move.
 */

import * as THREE from 'three';
import { PuzzleState } from './PuzzleState.js';
import { Cubie } from './Cubie.js';

export class Puzzle {
  /**
   * @param {number} size — cube dimension (2, 3, 4, 5, ...)
   * @param {import('../rendering/Materials.js').Materials} materials
   * @param {object} [options={}] — { isMirror: boolean, variant: string }
   */
  constructor(size, materials, options = {}) {
    this.size = size;
    this.materials = materials;
    this.options = options;
    this.isMirror = !!options.isMirror;

    /** Logical puzzle state */
    this.state = new PuzzleState(size, this.isMirror);

    /** Visual Three.js group */
    this.group = new THREE.Group();
    this.group.name = `PuzzleCube_${size}x${size}${this.isMirror ? '_Mirror' : ''}`;

    /** @type {Cubie[]} all cubie instances */
    this.cubies = [];

    /** @type {Map<number, Cubie>} lookup cubie by ID */
    this.cubieMap = new Map();

    /** Move history for undo/redo (Phase 6) */
    this.moveHistory = [];
    this.moveRedoStack = [];

    /** Move counter */
    this.moveCount = 0;

    /** Scramble moves (tracked separately for solver) */
    this.scrambleMoves = [];

    /** Is an animation currently playing? */
    this.isAnimating = false;

    this._createCubies();

    console.log(`[Puzzle] Created ${size}×${size}×${size} cube (${this.cubies.length} cubies)`);
  }

  /**
   * Create Cubie instances from PuzzleState data and add to the scene group.
   * 
   * COMPUTER GRAPHICS CONCEPT: Building the scene graph — each cubie mesh
   * is added as a child of the puzzle group, establishing the parent-child
   * transformation hierarchy.
   */
  _createCubies() {
    for (const cubieData of this.state.cubies) {
      const cubie = new Cubie(cubieData, this.materials, this.options);
      this.cubies.push(cubie);
      this.cubieMap.set(cubie.id, cubie);
      this.group.add(cubie.mesh);
    }
  }

  /**
   * Get all cubies in a specific layer (for layer rotation).
   * 
   * @param {string} axis       — 'x', 'y', or 'z'
   * @param {number} layerCoord — coordinate value on that axis
   * @returns {Cubie[]}
   */
  getCubiesInLayer(axis, layerCoord) {
    return this.cubies.filter(cubie =>
      Math.abs(cubie.logicalPosition[axis] - layerCoord) < 0.01
    );
  }

  /**
   * Execute a move: update logical state, then sync visual state.
   * 
   * In Phase 1, this is an instant snap (no animation). Phase 5 will
   * add smooth animated rotation using a pivot Object3D.
   * 
   * @param {import('./Move.js').Move} move
   * @param {boolean} [recordHistory=true] — whether to add to move history
   */
  executeMove(move, recordHistory = true) {
    // 1. Apply to logical state
    this.state.applyMove(move);

    // 2. Sync cubie logical positions from state
    for (let i = 0; i < this.state.cubies.length; i++) {
      const stateData = this.state.cubies[i];
      const cubie = this.cubies[i];

      // Update logical position reference
      cubie.logicalPosition = { ...stateData.position };
      cubie.faceColors = stateData.faceColors;

      // Snap visual position to match logical
      cubie.syncPositionFromState();

      // Update materials to reflect new face colors
      cubie.syncMaterialsFromState(this.materials);
    }

    // 3. Reset any mesh rotations (important after animated moves)
    for (const cubie of this.cubies) {
      cubie.mesh.rotation.set(0, 0, 0);
    }

    // 4. Record move in history
    if (recordHistory) {
      this.moveHistory.push(move);
      this.moveRedoStack = []; // clear redo stack on new move
      this.moveCount++;
    }
  }

  /**
   * Undo the last move.
   * @returns {import('./Move.js').Move|null} the undone move, or null
   */
  undo() {
    if (this.moveHistory.length === 0) return null;
    const lastMove = this.moveHistory.pop();
    const inverseMove = lastMove.inverse();

    this.executeMove(inverseMove, false);
    this.moveRedoStack.push(lastMove);
    this.moveCount--;

    return lastMove;
  }

  /**
   * Redo the last undone move.
   * @returns {import('./Move.js').Move|null} the redone move, or null
   */
  redo() {
    if (this.moveRedoStack.length === 0) return null;
    const move = this.moveRedoStack.pop();

    this.executeMove(move, true);

    return move;
  }

  /**
   * Check if the puzzle is solved.
   * @returns {boolean}
   */
  isSolved() {
    return this.state.isSolved();
  }

  /**
   * Reset the puzzle to solved state.
   */
  reset() {
    this.state.reset();
    this.moveHistory = [];
    this.moveRedoStack = [];
    this.moveCount = 0;

    // Rebuild cubies from fresh state
    for (const cubie of this.cubies) {
      cubie.dispose();
    }
    this.cubies = [];
    this.cubieMap.clear();

    // Remove all children from group
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    this._createCubies();
    console.log(`[Puzzle] Reset ${this.size}×${this.size}×${this.size} cube`);
  }

  /**
   * Dispose all resources.
   */
  dispose() {
    for (const cubie of this.cubies) {
      cubie.dispose();
    }
    this.cubies = [];
    this.cubieMap.clear();

    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
