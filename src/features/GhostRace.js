/**
 * GhostRace.js — Ghost Cube PB Race Engine
 * 
 * Spawns a translucent, glowing 3D ghost cube next to the main cube
 * that replays the user's personal best (PB) solve for head-to-head racing.
 */

import * as THREE from 'three';
import { Puzzle } from '../core/Puzzle.js';
import { MoveAnimator } from '../animation/MoveAnimator.js';
import { Move } from '../core/Move.js';

export class GhostRace {
  /**
   * @param {import('../rendering/SceneManager.js').SceneManager} sceneManager
   * @param {import('../rendering/Materials.js').Materials} materials
   */
  constructor(sceneManager, materials) {
    this.sceneManager = sceneManager;
    this.materials = materials;
    this.ghostPuzzle = null;
    this.animator = null;
    this.pbMoves = []; 
    this.pbScramble = [];
    this.isPlaying = false;
    this.enabled = false;
  }

  setPBRecord(movesArray, scrambleArray = []) {
    this.pbMoves = [...(movesArray || [])];
    this.pbScramble = [...(scrambleArray || [])];
  }

  showGhost(size = 3) {
    this.hideGhost();

    // Create ghost puzzle
    this.ghostPuzzle = new Puzzle(size, this.materials);
    this.animator = new MoveAnimator(this.ghostPuzzle, this.sceneManager);

    // Apply translucent ghost glass material to all ghost cubies
    this.ghostPuzzle.cubies.forEach(cubie => {
      cubie.mesh.traverse(child => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.45;
          child.material.emissive = new THREE.Color(0x00e5ff);
          child.material.emissiveIntensity = 0.4;
        }
      });
    });

    // Offset position to the right
    this.ghostPuzzle.group.position.set(4.5, 0, 0);
    this.ghostPuzzle.group.scale.set(0.75, 0.75, 0.75);
    this.sceneManager.add(this.ghostPuzzle.group);
    this.enabled = true;
  }

  hideGhost() {
    if (this.ghostPuzzle) {
      this.sceneManager.remove(this.ghostPuzzle.group);
      this.ghostPuzzle = null;
      this.animator = null;
    }
    this.isPlaying = false;
    this.enabled = false;
  }

  async startPBRace() {
    if (!this.ghostPuzzle) return;
    this.isPlaying = true;

    // First apply PB scramble instantly to ghost puzzle if available
    if (this.pbScramble && this.pbScramble.length > 0) {
      for (const scrambleMove of this.pbScramble) {
        const moveObj = typeof scrambleMove === 'string' ? Move.parse(scrambleMove) : scrambleMove;
        this.ghostPuzzle.executeMove(moveObj, false);
      }
    }

    if (this.pbMoves.length === 0) return;

    for (let i = 0; i < this.pbMoves.length; i++) {
      if (!this.isPlaying || !this.ghostPuzzle) break;
      const step = this.pbMoves[i];
      const moveObj = typeof step === 'string' ? Move.parse(step) : (step instanceof Move ? step : Move.parse(step.notation || step.move));

      await new Promise(res => setTimeout(res, 300));
      if (!this.isPlaying || !this.ghostPuzzle) break;

      if (moveObj) {
        await this.animator.animateMove(moveObj, { recordHistory: false, duration: 0.15 });
      }
    }

    this.isPlaying = false;
  }

  stop() {
    this.isPlaying = false;
  }
}
