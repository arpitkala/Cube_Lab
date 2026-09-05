/**
 * PuzzleState.js — Pure Logical Puzzle State
 * 
 * Manages the logical state of an NxN Rubik's Cube as a flat array of
 * cubie data objects. Completely independent of Three.js — this is the
 * "model" in the model-view separation.
 * 
 * COMPUTER GRAPHICS CONCEPTS:
 * - Local vs. World Coordinates: Cubie positions are in the cube's local
 *   coordinate system (integer grid centered at origin).
 * - Rotation Transforms: Applying a move permutes cubie positions and
 *   cycles their face-color mappings, equivalent to a 90° rotation matrix
 *   applied to the affected slice.
 * - Hierarchical State: The puzzle state is a flat collection, but the
 *   "which layer" grouping creates an implicit hierarchy used for slicing.
 */

import { FACES } from './Move.js';

/**
 * Axis-aligned rotation transforms for CW rotation (as seen from + end of axis).
 * Each entry maps: { positionTransform, faceColorCycle }
 * 
 * Position transform: (x,y,z) → new (x,y,z) for a 90° CW rotation
 * Face color cycle: which face slots are permuted
 * 
 * COMPUTER GRAPHICS CONCEPT: These are the 3×3 rotation matrices for 90°
 * rotations about the principal axes, expressed as coordinate swaps rather
 * than full matrix multiplication (since the values are always 0 or ±1).
 */
const AXIS_ROTATIONS = {
  // CW when looking from +Y down (U move)
  y: {
    cw: {
      // (x,y,z) → (z, y, -x)
      transformPosition: (pos) => ({ x: pos.z, y: pos.y, z: -pos.x }),
      // F→R, R→B, B→L, L→F  (U and D stay)
      cycleFaces: { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' },
    },
    ccw: {
      // (x,y,z) → (-z, y, x)
      transformPosition: (pos) => ({ x: -pos.z, y: pos.y, z: pos.x }),
      // F→L, L→B, B→R, R→F
      cycleFaces: { F: 'L', L: 'B', B: 'R', R: 'F', U: 'U', D: 'D' },
    },
  },

  // CW when looking from +X right (R move)
  x: {
    cw: {
      // (x,y,z) → (x, z, -y)
      transformPosition: (pos) => ({ x: pos.x, y: pos.z, z: -pos.y }),
      // F→U, U→B, B→D, D→F  (R and L stay)
      cycleFaces: { F: 'U', U: 'B', B: 'D', D: 'F', R: 'R', L: 'L' },
    },
    ccw: {
      // (x,y,z) → (x, -z, y)
      transformPosition: (pos) => ({ x: pos.x, y: -pos.z, z: pos.y }),
      // U→F, F→D, D→B, B→U
      cycleFaces: { U: 'F', F: 'D', D: 'B', B: 'U', R: 'R', L: 'L' },
    },
  },

  // CW when looking from +Z front (F move)
  z: {
    cw: {
      // (x,y,z) → (y, -x, z)
      transformPosition: (pos) => ({ x: pos.y, y: -pos.x, z: pos.z }),
      // U→R, R→D, D→L, L→U  (F and B stay)
      cycleFaces: { U: 'R', R: 'D', D: 'L', L: 'U', F: 'F', B: 'B' },
    },
    ccw: {
      // (x,y,z) → (-y, x, z)
      transformPosition: (pos) => ({ x: -pos.y, y: pos.x, z: pos.z }),
      // U→L, L→D, D→R, R→U
      cycleFaces: { U: 'L', L: 'D', D: 'R', R: 'U', F: 'F', B: 'B' },
    },
  },
};

/**
 * Standard Western Rubik's Cube color scheme.
 * Maps each face of a solved cube to its color name.
 */
export const SOLVED_COLORS = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  R: 'blue',
  L: 'green',
};

export class PuzzleState {
  /**
   * @param {number} size — cube dimension (2, 3, 4, 5, ...)
   * @param {boolean} [isMirror=false] — mirror mode with silver faces
   */
  constructor(size, isMirror = false) {
    this.size = size;
    this.isMirror = isMirror;
    /** @type {CubieData[]} flat array of all cubie logical data */
    this.cubies = [];

    this._initCubies();
  }

  _initCubies() {
    const half = (this.size - 1) / 2;
    let id = 0;
    const mirrorColorName = typeof this.isMirror === 'string' ? this.isMirror : (this.isMirror ? 'silver' : null);
    const colors = mirrorColorName
      ? { U: mirrorColorName, D: mirrorColorName, F: mirrorColorName, B: mirrorColorName, R: mirrorColorName, L: mirrorColorName }
      : SOLVED_COLORS;

    for (let x = -half; x <= half; x++) {
      for (let y = -half; y <= half; y++) {
        for (let z = -half; z <= half; z++) {
          const faceColors = {};
          for (const face of FACES) faceColors[face] = null;

          if (Math.abs(y - half) < 0.01)  faceColors.U = colors.U;
          if (Math.abs(y + half) < 0.01)  faceColors.D = colors.D;
          if (Math.abs(x - half) < 0.01)  faceColors.R = colors.R;
          if (Math.abs(x + half) < 0.01)  faceColors.L = colors.L;
          if (Math.abs(z - half) < 0.01)  faceColors.F = colors.F;
          if (Math.abs(z + half) < 0.01)  faceColors.B = colors.B;

          this.cubies.push({
            id: id++,
            position: { x, y, z },
            faceColors: { ...faceColors },
          });
        }
      }
    }
  }

  /**
   * Get cubies in a specific layer.
   * 
   * @param {string} axis    — 'x', 'y', or 'z'
   * @param {number} layerCoord — coordinate value on that axis
   * @returns {CubieData[]}
   */
  getCubiesInLayer(axis, layerCoord) {
    return this.cubies.filter(c =>
      Math.abs(c.position[axis] - layerCoord) < 0.01
    );
  }

  /**
   * Apply a Move to the logical state.
   * 
   * 1. Select cubies in the affected layer
   * 2. Transform their grid positions
   * 3. Cycle their face-color mappings
   * 
   * For a 180° move, apply the CW transform twice.
   * 
   * COMPUTER GRAPHICS CONCEPT: This is the logical equivalent of applying
   * a 90° rotation matrix to a subset of objects in the scene graph.
   * 
   * @param {import('./Move.js').Move} move
   */
  applyMove(move) {
    const layerCoord = move.getLayerCoordinate(this.size);
    const cubiesInLayer = this.getCubiesInLayer(move.axis, layerCoord);

    // Determine rotation direction
    // move.cwDirection maps the face's "CW" to the axis rotation convention
    // move.direction is 1 (CW), -1 (CCW), or 2 (double)
    const isDouble = move.direction === 2;
    const isCW = move.cwDirection * move.direction > 0;
    const dirKey = isCW ? 'cw' : 'ccw';

    const rotation = AXIS_ROTATIONS[move.axis][dirKey];
    const iterations = isDouble ? 2 : 1;

    for (let i = 0; i < iterations; i++) {
      for (const cubie of cubiesInLayer) {
        // Transform position
        cubie.position = rotation.transformPosition(cubie.position);

        // Round to avoid floating point drift
        cubie.position.x = Math.round(cubie.position.x * 2) / 2;
        cubie.position.y = Math.round(cubie.position.y * 2) / 2;
        cubie.position.z = Math.round(cubie.position.z * 2) / 2;

        // Cycle face colors
        const oldColors = { ...cubie.faceColors };
        for (const face of FACES) {
          const targetFace = rotation.cycleFaces[face];
          cubie.faceColors[targetFace] = oldColors[face];
        }
      }
    }
  }

  /**
   * Check if the puzzle is in the solved state.
   * Each face must have all stickers of the same color.
   * 
   * @returns {boolean}
   */
  isSolved() {
    const half = (this.size - 1) / 2;

    // Check each of the 6 faces
    const faceChecks = [
      { face: 'U', axis: 'y', coord: half },
      { face: 'D', axis: 'y', coord: -half },
      { face: 'R', axis: 'x', coord: half },
      { face: 'L', axis: 'x', coord: -half },
      { face: 'F', axis: 'z', coord: half },
      { face: 'B', axis: 'z', coord: -half },
    ];

    for (const { face, axis, coord } of faceChecks) {
      const cubiesOnFace = this.getCubiesInLayer(axis, coord);
      const colors = cubiesOnFace.map(c => c.faceColors[face]);
      const firstColor = colors[0];
      if (!firstColor || colors.some(c => c !== firstColor)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the NxN grid of sticker colors for a specific face.
   * Returns a 2D array [row][col] of color names.
   * 
   * @param {string} face — 'U','D','L','R','F','B'
   * @returns {string[][]}
   */
  getFaceColors(face) {
    const half = (this.size - 1) / 2;
    const grid = [];

    // Determine which axis this face is on and its coordinate
    const axisMap = { U: 'y', D: 'y', R: 'x', L: 'x', F: 'z', B: 'z' };
    const coordMap = { U: half, D: -half, R: half, L: -half, F: half, B: -half };

    const axis = axisMap[face];
    const coord = coordMap[face];
    const cubies = this.getCubiesInLayer(axis, coord);

    // Sort cubies into a consistent 2D grid based on the face orientation
    // This is for display purposes (e.g., a 2D face diagram)
    for (let row = 0; row < this.size; row++) {
      grid[row] = [];
      for (let col = 0; col < this.size; col++) {
        grid[row][col] = null;
      }
    }

    for (const cubie of cubies) {
      const pos = cubie.position;
      let row, col;

      // Map 3D position to 2D grid indices based on face
      switch (face) {
        case 'U': row = Math.round(half - pos.z); col = Math.round(pos.x + half); break;
        case 'D': row = Math.round(pos.z + half); col = Math.round(pos.x + half); break;
        case 'F': row = Math.round(half - pos.y); col = Math.round(pos.x + half); break;
        case 'B': row = Math.round(half - pos.y); col = Math.round(half - pos.x); break;
        case 'R': row = Math.round(half - pos.y); col = Math.round(half - pos.z); break;
        case 'L': row = Math.round(half - pos.y); col = Math.round(pos.z + half); break;
      }

      grid[row][col] = cubie.faceColors[face];
    }

    return grid;
  }

  /**
   * Deep clone the entire puzzle state.
   * Used for solver search, undo snapshots, etc.
   * 
   * @returns {PuzzleState}
   */
  clone() {
    const cloned = new PuzzleState(this.size);
    cloned.cubies = this.cubies.map(c => ({
      id: c.id,
      position: { ...c.position },
      faceColors: { ...c.faceColors },
    }));
    return cloned;
  }

  /**
   * Reset to solved state.
   */
  reset() {
    this.cubies = [];
    this._initCubies();
  }
}
