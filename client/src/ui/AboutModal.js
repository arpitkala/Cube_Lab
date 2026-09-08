/**
 * AboutModal.js — CUBE LAB Modern About & Architecture Showcase
 * 
 * Features:
 * - Glassmorphic overlay with dynamic backdrop.
 * - Creator spotlight cards for Arpit Kala & Akshat Agrawal.
 * - Key features matrix & technical architecture breakdown.
 */

export class AboutModal {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="about-inner ui-panel-glass fade-in">
        <div class="about-header">
          <div class="about-title-group">
            <div class="about-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <div>
              <h2 class="about-title">CUBE <span class="accent">LAB</span></h2>
              <p class="about-subtitle">Next-Gen Interactive 3D Puzzle Studio & AI Engine</p>
            </div>
          </div>
          <button class="btn btn-close" id="about-close" title="Close About Page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="about-body">
          <!-- Overview Banner -->
          <div class="about-hero-card">
            <div class="hero-badge">Studio Version 2.0</div>
            <h3>Explore, Scramble, Solve & Master Cubing</h3>
            <p>
              CUBE LAB is a state-of-the-art WebGL 3D puzzle simulator engineered for speedcubers, puzzle enthusiasts, and beginners.
              Featuring real-time camera color recognition, step-by-step solving algorithms, ASMR sound synthesis, voice control, and shape-shifting mirror blocks.
            </p>
          </div>

          <!-- Key Features Showcase Grid -->
          <div class="about-section-title">KEY FEATURES & INNOVATIONS</div>
          <div class="features-matrix">
            <div class="feature-item">
              <div class="feature-icon">📷</div>
              <div>
                <h4>Physical Camera Vision Scanner</h4>
                <p>Capture face colors on real physical cubes via webcam or picture, with automatic step-by-step solver guide generation.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📚</div>
              <div>
                <h4>Interactive Beginner's Academy</h4>
                <p>Layer-by-Layer solving tutorial with notation diagrams, interactive 3D move practice, and live move banner explanations.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <div>
                <h4>Multi-Puzzle & Mirror Cubes</h4>
                <p>Supports 2×2, 3×3, 4×4, 5×5, plus Silver and Gold Mirror Block shape-shifting physical offset mechanics.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🔊</div>
              <div>
                <h4>Synthetic ASMR Engine & Voice Control</h4>
                <p>Web Audio API plastic-friction rotation acoustics and voice command support ("Rotate Front", "Scramble", "Reset").</p>
              </div>
            </div>
          </div>

          <!-- Tech Architecture -->
          <div class="about-section-title">TECH STACK & PERFORMANCE</div>
          <div class="tech-chips">
            <span class="tech-chip">Three.js WebGL</span>
            <span class="tech-chip">Vite / ES Modules</span>
            <span class="tech-chip">Vanilla CSS Glassmorphism</span>
            <span class="tech-chip">Web Audio API</span>
            <span class="tech-chip">WebRTC MediaDevices</span>
            <span class="tech-chip">Kociemba / Layer-by-Layer Solvers</span>
          </div>
        </div>

        <div class="about-footer">
          <div class="footer-note">CUBE LAB © 2026 — Designed for all devices</div>
          <button class="btn btn--primary" id="about-btn-close">Close Overview</button>
        </div>
      </div>
    `;

    this.container.querySelector('#about-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#about-btn-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hide());
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
