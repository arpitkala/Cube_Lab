/**
 * main.js — CUBE LAB Application Entry Point
 * 
 * Multi-Feature 3D Puzzle Studio with:
 * - Interactive 3D Render & Controls
 * - Preset Pattern Gallery & Custom Sticker Logo Uploader
 * - WCA Speedcubing Suite (15s Inspection Timer, Ao5/Ao12 Stats & SVG Trend Chart)
 * - Web Audio Synthetic ASMR Mechanical Sound Engine & Web Speech Voice Controls
 * - X-Ray Glass Mode & Colorblind Accessibility
 * - 4K HD Canvas Snapshot Exporter
 * - Physical Cube Camera Reader & Scanner
 */

import * as THREE from 'three';
import { ThemeManager } from './themes/ThemeManager.js';
import { SceneManager } from './rendering/SceneManager.js';
import { CameraManager } from './rendering/CameraManager.js';
import { Lighting } from './rendering/Lighting.js';
import { Materials } from './rendering/Materials.js';
import { Puzzle } from './core/Puzzle.js';
import { Move } from './core/Move.js';
import { MoveAnimator } from './animation/MoveAnimator.js';
import { KeyboardControls } from './interaction/KeyboardControls.js';
import { Solver, generateScramble } from './solving/Solver.js';
import { WelcomeScreen } from './ui/WelcomeScreen.js';
import { HudBar } from './ui/HudBar.js';
import { MovesPanel } from './ui/MovesPanel.js';
import { ActionBar } from './ui/ActionBar.js';
import { GuidePanel } from './ui/GuidePanel.js';
import { SolvePanel } from './ui/SolvePanel.js';
import { LearningPanel } from './ui/LearningPanel.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { StatisticsPanel } from './ui/StatisticsPanel.js';
import { makeDraggable } from './ui/draggable.js';

// Studio Feature Subsystems
import { ASMRAudioEngine } from './audio/ASMRAudioEngine.js';
import { VoiceControls } from './interaction/VoiceControls.js';
import { PatternGallery } from './features/PatternGallery.js';
import { StickerUploader } from './features/StickerUploader.js';
import { WCAInspectionTimer } from './features/WCAInspectionTimer.js';
import { Exporter } from './features/Exporter.js';
import { WebcamScanner } from './features/WebcamScanner.js';

import './styles/main.css';

class CubeLabApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) throw new Error('Canvas container not found');

    // State
    this._currentMode = 'manual'; // 'manual' | 'guide' | 'solve' | 'learn'
    this._solveSteps = [];
    this._solveIndex = 0;
    this._solvePlaying = false;
    this._solveInterval = null;
    this._stats = { solves: 0, bestTime: null, bestTimeMs: Infinity, totalMoves: 0 };
    this._hintTimer = null;
    this._isInspectionEnabled = false;

    // Subsystems
    this.themeManager = new ThemeManager();
    this.sceneManager = new SceneManager(this.container, this.themeManager);
    this.cameraManager = new CameraManager(this.sceneManager);
    this.lighting = new Lighting(this.sceneManager, this.themeManager);
    this.materials = new Materials(this.themeManager);

    this.puzzle = new Puzzle(3, this.materials);
    this.sceneManager.add(this.puzzle.group);

    this.animator = new MoveAnimator(this.puzzle, this.sceneManager);
    this.solver = new Solver();

    // Studio Feature Subsystems
    this.audioEngine = new ASMRAudioEngine();
    this.exporter = new Exporter(this.sceneManager);
    this.inspectionTimer = new WCAInspectionTimer({
      onTick: (sec) => console.log(`[Inspection] ${sec}s`),
      onVoiceCue: (text) => this.audioEngine.playVoiceCue(text),
      onInspectionComplete: (penalty) => console.log(`[Inspection] Complete penalty: ${penalty}`),
    });

    this.voiceControls = new VoiceControls({
      onMove: (m) => this._handleMove(m),
      onScramble: () => this._handleScramble(),
      onReset: () => this._handleReset(),
      onUndo: () => this._handleUndo(),
      onSolve: () => this._setMode('solve'),
    });

    this.keyboard = new KeyboardControls(
      (move) => this._handleMove(move),
      () => this._handleUndo(),
      () => this._handleRedo()
    );
    this.keyboard.disable();

    this._addGroundPlane();
    this._initUI();
    this.sceneManager.start(this.cameraManager.camera);
    this.cameraManager.setAutoRotate(true);

    window.cubelab = this;
    console.log('[CubeLab] ✓ All systems & advanced features ready');
  }

  _initUI() {
    // Welcome Screen
    this.welcomeScreen = new WelcomeScreen(
      document.getElementById('welcome-screen'),
      (size) => this._startPuzzle(size)
    );
    this.welcomeScreen.show();

    // HUD Bar
    this.hudBar = new HudBar(
      document.getElementById('hud-bar'),
      { onModeChange: (mode) => this._setMode(mode) }
    );

    // Moves Panel
    this.movesPanel = new MovesPanel(
      document.getElementById('moves-panel'),
      { onMove: (move) => this._handleMove(move) }
    );

    // Action Bar
    this.actionBar = new ActionBar(
      document.getElementById('action-bar'),
      {
        onScramble: () => this._handleScramble(),
        onReset: () => this._handleReset(),
        onHint: () => this._handleHint(),
        onPatterns: () => this.patternGallery.show(),
        onSnapshot: () => this.exporter.takeSnapshot(),
        onScanner: () => this.webcamScanner.show(),
        onLogo: () => this.stickerUploader.show(),
        onUndo: () => this._handleUndo(),
        onRedo: () => this._handleRedo(),
        onSettings: () => this._showSettings(),
        onStats: () => this._showStats(),
        onBack: () => this._showWelcome(),
      }
    );

    // Feature Modals
    this.patternGallery = new PatternGallery(
      document.getElementById('pattern-modal'),
      (moves) => this._applyPatternSequence(moves)
    );

    this.stickerUploader = new StickerUploader(
      document.getElementById('sticker-modal'),
      (texture, face) => {
        if (!texture) {
          if (face === 'ALL') {
            this.materials.clearCustomFaceTextures();
          } else {
            this.materials.removeCustomFaceTexture(face);
          }
        } else {
          this.materials.setCustomFaceTexture(face, texture);
        }
        this.puzzle.cubies.forEach(c => c.updateMaterials(this.materials));
      }
    );

    this.webcamScanner = new WebcamScanner(
      document.getElementById('scanner-modal'),
      (face, colors) => {
        console.log(`[WebcamScanner] Scanned face ${face}:`, colors);
      }
    );

    // Guide Panel
    const guideEl = document.getElementById('guide-overlay');
    this.guidePanel = new GuidePanel(
      guideEl,
      {
        onClose: () => this._setMode('manual'),
        onPrev: () => this._guidePrev(),
        onExecute: () => this._guideExecuteCurrent(),
        onNext: () => this._guideNext(),
      }
    );
    makeDraggable(guideEl, guideEl.querySelector('#guide-drag-handle'));

    // Solve Panel
    const solveEl = document.getElementById('solve-overlay');
    this.solvePanel = new SolvePanel(
      solveEl,
      {
        onClose: () => this._setMode('manual'),
        onRestart: () => this._solveRestart(),
        onPrev: () => this._solvePrev(),
        onPlayPause: () => this._solvePlayPause(),
        onNext: () => this._solveNext(),
        onSkip: () => this._solveSkipToEnd(),
        onSpeedChange: (s) => { this.animator.speed = s; },
      }
    );
    makeDraggable(solveEl, solveEl.querySelector('#solve-drag-handle'));

    // Learning Panel
    const learnEl = document.getElementById('learning-overlay');
    this.learningPanel = new LearningPanel(
      learnEl,
      {
        onClose: () => this._setMode('manual'),
        onPrev: () => this._solvePrev(),
        onShowMove: () => this._solveNext(),
        onNext: () => this._solveNext(),
      }
    );
    makeDraggable(learnEl, learnEl.querySelector('#learn-drag-handle'));

    // Settings
    this.settingsPanel = new SettingsPanel(
      document.getElementById('settings-panel'),
      {
        onClose: () => this.settingsPanel.hide(),
        onThemeChange: (theme) => this.themeManager.setTheme(theme),
        onViewChange: (view) => this.cameraManager.setPresetView(view),
        onXRayToggle: (val) => this.materials.setXRayMode(val),
        onInspectionToggle: (val) => { this._isInspectionEnabled = val; },
        onASMRToggle: (val) => this.audioEngine.setEnabled(val),
        onVoiceToggle: (val) => val ? this.voiceControls.start() : this.voiceControls.stop(),
        onColorblindToggle: (val) => this.materials.setColorblindMode(val),
      }
    );

    // Statistics
    this.statsPanel = new StatisticsPanel(
      document.getElementById('stats-panel'),
      { onClose: () => this.statsPanel.hide() }
    );

    // Move complete listener
    this.animator.onMoveComplete = () => {
      this.hudBar.setMoveCount(this.puzzle.moveCount);
      this.audioEngine.playTurnSound(this.puzzle.isMirror);
    };
  }

  // ─── Flow ──────────────────────────────────────────────────────

  _startPuzzle(config) {
    const size = typeof config === 'object' ? config.size : config;
    const isMirror = typeof config === 'object' ? !!config.isMirror : false;

    this.puzzle.dispose();
    this.materials = new Materials(this.themeManager);
    this.puzzle = new Puzzle(size, this.materials, { isMirror });
    this.sceneManager.add(this.puzzle.group);
    this.animator.setPuzzle(this.puzzle);
    this.animator.onMoveComplete = () => {
      this.hudBar.setMoveCount(this.puzzle.moveCount);
      this.audioEngine.playTurnSound(this.puzzle.isMirror);
    };

    this.welcomeScreen.hide();
    this.hudBar.show();
    this.hudBar.setPuzzleSize(size, isMirror);
    this.hudBar.setMoveCount(0);
    this.hudBar.resetTimer();
    this.movesPanel.show();
    this.actionBar.show();

    this.cameraManager.setAutoRotate(false);
    this.keyboard.enable();

    this._setMode('manual');
  }

  _showWelcome() {
    this._stopSolvePlayback();
    this.movesPanel.clearHighlight();
    this.hudBar.hide();
    this.movesPanel.hide();
    this.actionBar.hide();
    this.guidePanel.hide();
    this.solvePanel.hide();
    this.learningPanel.hide();
    this.settingsPanel.hide();
    this.statsPanel.hide();
    this.patternGallery.hide();

    this.keyboard.disable();
    this.puzzle.reset();
    this.welcomeScreen.show();
    this.cameraManager.setAutoRotate(true);
    this.cameraManager.setPresetView('isometric');
  }

  // ─── Move Handling ─────────────────────────────────────────────

  _handleMove(move) {
    if (this.puzzle.isAnimating) return;

    if (this._isInspectionEnabled && !this.hudBar.isRunning) {
      this.inspectionTimer.cancelAndStartSolve();
    }

    this.hudBar.startTimer();
    const moveObj = typeof move === 'string' ? Move.parse(move) : move;
    this.animator.animateMove(moveObj).then(() => {
      if (this.puzzle.isSolved() && this.puzzle.moveCount > 0) {
        this._onPuzzleSolved();
        return;
      }

      if (this._currentMode === 'guide') {
        this._updateGuideState();
      }
    });
  }

  _handleScramble() {
    if (this.puzzle.isAnimating) return;
    this._stopSolvePlayback();
    this._setMode('manual');
    this.puzzle.reset();
    this.hudBar.setMoveCount(0);
    this.hudBar.resetTimer();
    this.animator.setPuzzle(this.puzzle);
    this.animator.onMoveComplete = () => {
      this.hudBar.setMoveCount(this.puzzle.moveCount);
      this.audioEngine.playTurnSound(this.puzzle.isMirror);
    };

    if (this._isInspectionEnabled) {
      this.inspectionTimer.start();
    }

    const scrambleMoves = generateScramble(this.puzzle.size);
    this.puzzle.scrambleMoves = [...scrambleMoves];
    this.animator.animateSequence(scrambleMoves, { recordHistory: false, duration: 0.08 }).then(() => {
      this.puzzle.moveCount = 0;
      this.puzzle.moveHistory = [];
      this.hudBar.setMoveCount(0);
    });
  }

  _handleReset() {
    if (this.puzzle.isAnimating) return;
    this._stopSolvePlayback();
    this._setMode('manual');
    this.movesPanel.clearHighlight();
    this.puzzle.reset();
    this.animator.setPuzzle(this.puzzle);
    this.hudBar.setMoveCount(0);
    this.hudBar.resetTimer();
    this._hideCelebration();
  }

  _handleUndo() {
    if (this.puzzle.isAnimating || (this._currentMode !== 'manual' && this._currentMode !== 'guide')) return;
    if (this.puzzle.undo()) {
      this.hudBar.setMoveCount(this.puzzle.moveCount);
      if (this._currentMode === 'guide') this._updateGuideState();
    }
  }

  _handleRedo() {
    if (this.puzzle.isAnimating || (this._currentMode !== 'manual' && this._currentMode !== 'guide')) return;
    if (this.puzzle.redo()) {
      this.hudBar.setMoveCount(this.puzzle.moveCount);
      if (this._currentMode === 'guide') this._updateGuideState();
    }
  }

  _handleHint() {
    if (this.puzzle.isAnimating) return;
    const steps = this.solver.solve(this.puzzle);
    if (steps.length === 0) return;

    const nextStep = steps[0];
    this.movesPanel.highlightMove(nextStep.notation);

    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      if (this._currentMode !== 'guide') {
        this.movesPanel.clearHighlight();
      }
    }, 4000);
  }

  _applyPatternSequence(moves) {
    if (this.puzzle.isAnimating || !moves) return;
    const parsedMoves = moves.map(m => typeof m === 'string' ? Move.parse(m) : m);
    this.animator.animateSequence(parsedMoves, { recordHistory: true, duration: 0.15 });
  }

  _onPuzzleSolved() {
    this.hudBar.stopTimer();
    this.movesPanel.clearHighlight();
    this.audioEngine.playSolveCelebration();
    const elapsed = this.hudBar.getElapsed();

    this._stats.solves++;
    this._stats.totalMoves += this.puzzle.moveCount;
    const timeStr = this._formatTime(elapsed);

    this.statsPanel.addSolveRecord(elapsed);

    if (elapsed < this._stats.bestTimeMs) {
      this._stats.bestTime = timeStr;
      this._stats.bestTimeMs = elapsed;
    }
    this._showCelebration(timeStr, this.puzzle.moveCount);
  }

  // ─── Celebration ───────────────────────────────────────────────

  _showCelebration(time, moves) {
    const el = document.getElementById('celebration-overlay');
    el.innerHTML = `
      <div class="celebration-inner">
        <div class="celebration-particles">
          ${Array.from({length:30}, (_,i) => `<div class="confetti confetti-${i % 6}" style="--delay:${Math.random()*2}s;--x:${Math.random()*100}vw;--r:${Math.random()*360}deg;--dur:${2+Math.random()*2}s"></div>`).join('')}
        </div>
        <div class="celebration-content">
          <div class="celebration-icon">🎉</div>
          <h2 class="celebration-title">SOLVED!</h2>
          <div class="celebration-stats">
            <div class="celebration-stat">
              <div class="celebration-stat-label">Time</div>
              <div class="celebration-stat-value">${time}</div>
            </div>
            <div class="celebration-divider"></div>
            <div class="celebration-stat">
              <div class="celebration-stat-label">Moves</div>
              <div class="celebration-stat-value">${moves}</div>
            </div>
          </div>
          <div class="celebration-actions">
            <button class="btn btn--primary celebration-btn" id="celebrate-scramble">Scramble Again</button>
            <button class="btn celebration-btn" id="celebrate-close">Continue</button>
          </div>
        </div>
      </div>
    `;
    el.classList.remove('hidden');
    el.querySelector('#celebrate-scramble')?.addEventListener('click', () => {
      this._hideCelebration();
      this._handleScramble();
    });
    el.querySelector('#celebrate-close')?.addEventListener('click', () => {
      this._hideCelebration();
    });
  }

  _hideCelebration() {
    document.getElementById('celebration-overlay')?.classList.add('hidden');
  }

  // ─── Mode Switching ────────────────────────────────────────────

  _setMode(mode) {
    this._currentMode = mode;
    this._stopSolvePlayback();
    this.movesPanel.clearHighlight();

    this.guidePanel.hide();
    this.solvePanel.hide();
    this.learningPanel.hide();

    if (mode === 'guide') this._startGuideMode();
    else if (mode === 'solve') this._startAutoSolve();
    else if (mode === 'learn') this._startLearnMode();

    this.hudBar.setMode(mode);
  }

  // ─── Guide Mode ────────────────────────────────────────────────

  _startGuideMode() {
    this.keyboard.enable();
    this._updateGuideState();
    this.guidePanel.show();
  }

  _updateGuideState() {
    this._solveSteps = this.solver.solve(this.puzzle);
    if (this._solveSteps.length === 0) {
      this.guidePanel.updateStep(0, 0, '✓', 'Puzzle is fully solved!', '🎉 Great job!');
      this.movesPanel.clearHighlight();
      return;
    }

    if (this._solveIndex >= this._solveSteps.length) {
      this._solveIndex = 0;
    }

    const currentStep = this._solveSteps[this._solveIndex];
    this.guidePanel.updateStep(
      this._solveIndex + 1,
      this._solveSteps.length,
      currentStep.notation,
      currentStep.description,
      `💡 Perform move "${currentStep.notation}" on keyboard or click button`
    );
    this.movesPanel.highlightMove(currentStep.notation);
  }

  _guideExecuteCurrent() {
    if (this.puzzle.isAnimating || this._solveSteps.length === 0) return;
    const currentStep = this._solveSteps[this._solveIndex];
    this._handleMove(currentStep.move);
  }

  _guideNext() {
    if (this._solveIndex < this._solveSteps.length - 1) {
      this._solveIndex++;
      this._updateGuideState();
    }
  }

  _guidePrev() {
    if (this._solveIndex > 0) {
      this._solveIndex--;
      this._updateGuideState();
    }
  }

  // ─── Auto Solve & Learn Modes ──────────────────────────────────

  _startAutoSolve() {
    this._solveSteps = this.solver.solve(this.puzzle);
    if (this._solveSteps.length === 0) { this._setMode('manual'); return; }
    this._solveIndex = 0;
    this._solvePlaying = false;
    this.solvePanel.show();
    this.solvePanel.updateStep(0, this._solveSteps.length, '—', 'Press ▶ to begin');
    this.solvePanel.setPlaying(false);
    this.keyboard.disable();
  }

  _startLearnMode() {
    this._solveSteps = this.solver.solve(this.puzzle);
    if (this._solveSteps.length === 0) { this._setMode('manual'); return; }
    this._solveIndex = 0;
    this.learningPanel.show();
    const s = this._solveSteps[0];
    this.learningPanel.updateStep(0, this._solveSteps.length, s.notation, s.description);
    this.keyboard.disable();
  }

  _solvePlayPause() {
    if (this._solvePlaying) {
      this._solvePlaying = false;
      this.solvePanel.setPlaying(false);
    } else {
      this._solvePlaying = true;
      this.solvePanel.setPlaying(true);
      this._solvePlayNext();
    }
  }

  _solvePlayNext() {
    if (!this._solvePlaying || this._solveIndex >= this._solveSteps.length) {
      this._solvePlaying = false;
      this.solvePanel.setPlaying(false);
      return;
    }
    const step = this._solveSteps[this._solveIndex];
    this.solvePanel.updateStep(step.stepNumber, step.totalSteps, step.notation, step.description);
    this.animator.animateMove(step.move, { recordHistory: false }).then(() => {
      this._solveIndex++;
      if (this._solvePlaying) this._solvePlayNext();
    });
  }

  _solveNext() {
    if (this._solveIndex >= this._solveSteps.length || this.puzzle.isAnimating) return;
    const step = this._solveSteps[this._solveIndex];
    if (this._currentMode === 'learn')
      this.learningPanel.updateStep(step.stepNumber, step.totalSteps, step.notation, step.description);
    else
      this.solvePanel.updateStep(step.stepNumber, step.totalSteps, step.notation, step.description);
    this.animator.animateMove(step.move, { recordHistory: false }).then(() => {
      this._solveIndex++;
      if (this._currentMode === 'learn' && this._solveIndex < this._solveSteps.length) {
        const next = this._solveSteps[this._solveIndex];
        this.learningPanel.updateStep(this._solveIndex, this._solveSteps.length, next.notation, next.description);
      }
    });
  }

  _solvePrev() {
    if (this._solveIndex <= 0 || this.puzzle.isAnimating) return;
    this._solveIndex--;
    const step = this._solveSteps[this._solveIndex];
    this.animator.animateMove(step.move.inverse(), { recordHistory: false }).then(() => {
      if (this._currentMode === 'learn')
        this.learningPanel.updateStep(this._solveIndex, this._solveSteps.length, step.notation, step.description);
      else
        this.solvePanel.updateStep(this._solveIndex, step.totalSteps, step.notation, step.description);
    });
  }

  _solveRestart() {
    this._stopSolvePlayback();
    for (let i = this._solveIndex - 1; i >= 0; i--) {
      this.puzzle.executeMove(this._solveSteps[i].move.inverse(), false);
    }
    this._solveIndex = 0;
    this.solvePanel.updateStep(0, this._solveSteps.length, '—', 'Press ▶ to begin');
  }

  async _solveSkipToEnd() {
    if (this.puzzle.isAnimating) return;
    this._stopSolvePlayback();
    while (this._solveIndex < this._solveSteps.length) {
      this.puzzle.executeMove(this._solveSteps[this._solveIndex].move, false);
      this._solveIndex++;
    }
    const last = this._solveSteps[this._solveSteps.length - 1];
    this.solvePanel.updateStep(last.totalSteps, last.totalSteps, '✓', 'Solved!');
  }

  _stopSolvePlayback() {
    this._solvePlaying = false;
    clearInterval(this._solveInterval);
  }

  _showSettings() { this.settingsPanel.show(); }
  _showStats() {
    this.statsPanel.update({
      puzzle: this.puzzle.size,
      solves: this._stats.solves,
      bestTime: this._stats.bestTime || '—',
      totalMoves: this._stats.totalMoves,
    });
    this.statsPanel.show();
  }

  _formatTime(ms) {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${tenths}`;
  }

  _addGroundPlane() {
    const geo = new THREE.PlaneGeometry(20, 20);
    const mat = new THREE.ShadowMaterial({ opacity: 0.15, color: 0x000000 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.5;
    ground.receiveShadow = true;
    this.sceneManager.add(ground);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new CubeLabApp();
  } catch (err) {
    console.error('[CubeLab] Fatal:', err);
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#ff4757;font-family:monospace;text-align:center"><div><h1 style="margin-bottom:1rem">⚠ CUBE LAB Error</h1><p style="color:#888">${err.message}</p></div></div>`;
  }
});
