/**
 * Move.js — Move Value Object
 * 
 * Encapsulates a single cube move in standard Rubik's Cube notation.
 * 
 * COMPUTER GRAPHICS CONCEPT: This class represents the abstract rotation
 * transform that will be applied to a subset of cubies. It maps standard
 * puzzle notation (U, R', F2) to the underlying axis, layer, and rotation
 * direction used by the 3D transformation system.
 * 
 * Architecture note: Move is a pure data object with zero Three.js dependency.
 * It lives in the logical layer and is consumed by both PuzzleState (logical
 * permutation) and MoveAnimator (visual rotation).
 */

/**
 * Face name to axis/direction mapping.
 * Each face defines:
 *   - axis: 'x' | 'y' | 'z'
 *   - sign: +1 (positive axis end) or -1 (negative axis end)
 *   - cwDirection: rotation direction for a CW move (as seen from outside)
 *       +1 = positive rotation around the axis (right-hand rule)
 *       -1 = negative rotation around the axis
 */
const FACE_DEFINITIONS = {
  U: { axis: 'y', sign: +1, cwDirection: +1 },
  D: { axis: 'y', sign: -1, cwDirection: -1 },
  R: { axis: 'x', sign: +1, cwDirection: +1 },
  L: { axis: 'x', sign: -1, cwDirection: -1 },
  F: { axis: 'z', sign: +1, cwDirection: +1 },
  B: { axis: 'z', sign: -1, cwDirection: -1 },
};

/** All valid face names */
export const FACES = Object.keys(FACE_DEFINITIONS);

/** Opposite face mapping */
export const OPPOSITE_FACE = {
  U: 'D', D: 'U',
  R: 'L', L: 'R',
  F: 'B', B: 'F',
};

export class Move {
  /**
   * @param {string} face     — 'U','D','L','R','F','B'
   * @param {number} direction — 1 (CW), -1 (CCW), 2 (180°)
   * @param {number} layer    — 0 = outermost (default), 1 = inner for 4×4+, etc.
   */
  constructor(face, direction = 1, layer = 0) {
    if (!FACE_DEFINITIONS[face]) {
      throw new Error(`Invalid face: ${face}. Must be one of ${FACES.join(', ')}`);
    }
    if (![1, -1, 2].includes(direction)) {
      throw new Error(`Invalid direction: ${direction}. Must be 1 (CW), -1 (CCW), or 2 (180°).`);
    }

    this.face = face;
    this.direction = direction;
    this.layer = layer;

    // Derived axis/rotation info from FACE_DEFINITIONS
    const def = FACE_DEFINITIONS[face];
    this.axis = def.axis;
    this.axisSign = def.sign;
    this.cwDirection = def.cwDirection;
  }

  /**
   * Returns the inverse of this move.
   * CW → CCW, CCW → CW, 180° → 180°.
   */
  inverse() {
    const invDir = this.direction === 2 ? 2 : -this.direction;
    return new Move(this.face, invDir, this.layer);
  }

  /**
   * Standard Rubik's Cube notation string.
   * Examples: "R", "R'", "R2", "2R" (inner layer of 4×4)
   */
  toString() {
    let prefix = '';
    if (this.layer > 0) {
      prefix = `${this.layer + 1}`; // inner layers: 2R, 3R, etc.
    }
    const suffix = this.direction === -1 ? "'" : this.direction === 2 ? '2' : '';
    return `${prefix}${this.face}${suffix}`;
  }

  /**
   * Get the actual layer coordinate value in the cube grid.
   * For an NxN cube centered at origin with positions from -(N-1)/2 to (N-1)/2:
   * - Outermost positive face: (N-1)/2
   * - Inner layers: (N-1)/2 - layer
   * 
   * @param {number} cubeSize — N (2, 3, 4, 5, ...)
   * @returns {number} the coordinate value on the move's axis
   */
  getLayerCoordinate(cubeSize) {
    const maxCoord = (cubeSize - 1) / 2;
    // For positive-side faces (U, R, F): layer 0 = maxCoord, layer 1 = maxCoord - 1, ...
    // For negative-side faces (D, L, B): layer 0 = -maxCoord, layer 1 = -maxCoord + 1, ...
    if (this.axisSign > 0) {
      return maxCoord - this.layer;
    } else {
      return -maxCoord + this.layer;
    }
  }

  /**
   * Get the Three.js rotation angle (in radians) for this move.
   * 
   * COMPUTER GRAPHICS CONCEPT: The rotation angle must match the Three.js
   * rotation matrix convention for each axis. The Y axis has opposite
   * handedness to X and Z in terms of CW/CCW mapping.
   * 
   * @returns {number} angle in radians
   */
  getRotationAngle() {
    const baseAngle = Math.PI / 2; // 90°
    const multiplier = this.direction === 2 ? 2 : this.direction;
    // Y axis: positive rotation = CW from above
    // X, Z axes: negative rotation = CW from positive end
    const axisFlip = this.axis === 'y' ? 1 : -1;
    return axisFlip * this.cwDirection * multiplier * baseAngle;
  }

  /**
   * Parse a notation string into a Move.
   * Supports: R, R', R2, U, U', U2, 2R (inner layer), 2R', etc.
   * 
   * @param {string} notation
   * @returns {Move}
   */
  static parse(notation) {
    const match = notation.trim().match(/^(\d?)([UDLRFB])([2']?)$/);
    if (!match) {
      throw new Error(`Cannot parse move notation: "${notation}"`);
    }

    const [, layerStr, face, dirStr] = match;
    const layer = layerStr ? parseInt(layerStr) - 1 : 0;
    let direction = 1;
    if (dirStr === "'") direction = -1;
    if (dirStr === '2') direction = 2;

    return new Move(face, direction, layer);
  }

  /**
   * Parse a space-separated sequence of moves.
   * @param {string} sequence — e.g. "R U R' F2 U' L"
   * @returns {Move[]}
   */
  static parseSequence(sequence) {
    return sequence.trim().split(/\s+/).filter(Boolean).map(Move.parse);
  }

  /**
   * Reverse a sequence of moves (for undo/inverse solutions).
   * @param {Move[]} moves
   * @returns {Move[]}
   */
  static reverseSequence(moves) {
    return moves.map(m => m.inverse()).reverse();
  }
}
