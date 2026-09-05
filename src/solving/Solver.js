/**
 * Solver.js — Cube Solving Engine
 * 
 * Provides solving capabilities for all cube sizes.
 * Uses move history reversal for reliable solutions, with annotated
 * steps for the Learning Mode.
 * 
 * Architecture: The Solver abstraction separates solving logic from
 * UI/animation. It outputs a plain array of annotated moves that the
 * SolvePanel and LearningPanel consume.
 */

import { Move, FACES, OPPOSITE_FACE } from '../core/Move.js';

/** Human-readable face names for explanations */
const FACE_NAMES = {
  U: 'Top', D: 'Bottom', L: 'Left', R: 'Right', F: 'Front', B: 'Back',
};

const DIR_NAMES = {
  1: 'clockwise (90°)',
  '-1': "counter-clockwise (90°)",
  2: '180°',
};

export class Solver {
  /**
   * Solve the puzzle by reversing the move history.
   * This always produces a valid solution and works for any cube size.
   * 
   * @param {import('../core/Puzzle.js').Puzzle} puzzle
   * @returns {SolveStep[]} array of annotated solve steps
   */
  solve(puzzle) {
    // Get all moves that were made (scramble + manual moves)
    const allMoves = [...puzzle.scrambleMoves, ...puzzle.moveHistory];

    if (allMoves.length === 0) {
      return []; // already solved
    }

    // Reverse the sequence
    const solution = allMoves.map(m => m.inverse()).reverse();

    // Annotate each step
    return solution.map((move, i) => ({
      move,
      stepNumber: i + 1,
      totalSteps: solution.length,
      notation: move.toString(),
      description: `Rotate the ${FACE_NAMES[move.face]} face ${DIR_NAMES[move.direction]}`,
      shortDesc: `${FACE_NAMES[move.face]} ${move.direction === -1 ? 'CCW' : move.direction === 2 ? '180°' : 'CW'}`,
    }));
  }
}

/**
 * Generate a random scramble sequence.
 * Avoids consecutive same-face moves and opposite-face pairs.
 * 
 * @param {number} size — cube dimension
 * @param {number} [numMoves] — number of scramble moves
 * @returns {Move[]}
 */
export function generateScramble(size, numMoves) {
  if (!numMoves) {
    numMoves = size === 2 ? 9 : size === 3 ? 20 : size === 4 ? 30 : 40;
  }

  const faces = size <= 3 ? ['U', 'D', 'L', 'R', 'F', 'B'] : FACES;
  const directions = [1, -1, 2];
  const moves = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < numMoves; i++) {
    let face;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (
      face === lastFace ||
      (face === OPPOSITE_FACE[lastFace] && lastFace === secondLastFace)
    );

    const direction = directions[Math.floor(Math.random() * directions.length)];
    moves.push(new Move(face, direction));

    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}
