/**
 * WelcomeScreen.js — Cube Selection Welcome Screen
 * 
 * Selectable puzzle cards: 2×2, 3×3, 4×4, 5×5, Silver Mirror Blocks, and Gold Mirror Blocks.
 * Features creator credits: Made by Arpit Kala and Akshat Agrawal.
 */

export class WelcomeScreen {
  /**
   * @param {HTMLElement} container
   * @param {Function} onStart — callback({ size: number, isMirror: boolean|string })
   * @param {Function} onShowAbout — callback()
   * @param {Function} onShowBeginnerGuide — callback()
   */
  constructor(container, onStart, onShowAbout, onShowBeginnerGuide) {
    this.container = container;
    this.onStart = onStart;
    this.onShowAbout = onShowAbout;
    this.onShowBeginnerGuide = onShowBeginnerGuide;
    this.selectedConfig = { size: 3, isMirror: false };

    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="welcome-inner">
        <div class="welcome-header">
          <div class="welcome-logo">
            <div class="logo-cube">
              <div class="logo-face logo-face-1"></div>
              <div class="logo-face logo-face-2"></div>
              <div class="logo-face logo-face-3"></div>
            </div>
          </div>
          <h1 class="welcome-title">CUBE <span class="accent">LAB</span></h1>
          <p class="welcome-subtitle">Interactive 3D Puzzle Studio</p>
          <p class="welcome-tagline">Scramble · Solve · Learn · Explore</p>
        </div>

        <div class="welcome-cards" id="cube-cards">
          <button class="cube-card" data-size="2" data-type="normal">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-2">
                <span></span><span></span>
                <span></span><span></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">2×2×2</div>
              <div class="cube-card-name">Pocket Cube</div>
            </div>
          </button>

          <button class="cube-card selected" data-size="3" data-type="normal">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-3">
                <span></span><span></span><span></span>
                <span></span><span></span><span></span>
                <span></span><span></span><span></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">3×3×3</div>
              <div class="cube-card-name">Rubik's Cube</div>
            </div>
            <div class="card-badge">Classic</div>
          </button>

          <button class="cube-card" data-size="4" data-type="normal">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-4">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">4×4×4</div>
              <div class="cube-card-name">Revenge Cube</div>
            </div>
          </button>

          <button class="cube-card" data-size="5" data-type="normal">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-5">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">5×5×5</div>
              <div class="cube-card-name">Professor's Cube</div>
            </div>
            <div class="card-badge card-badge-pro">Pro</div>
          </button>

          <button class="cube-card cube-card-mirror-silver" data-size="3" data-type="silver">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-mirror-silver">
                <span class="m-span-1"></span><span class="m-span-2"></span><span class="m-span-3"></span>
                <span class="m-span-2"></span><span class="m-span-1"></span><span class="m-span-2"></span>
                <span class="m-span-3"></span><span class="m-span-2"></span><span class="m-span-1"></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">Silver Mirror</div>
              <div class="cube-card-name">Shape-Shifter</div>
            </div>
            <div class="card-badge card-badge-silver">Silver</div>
          </button>

          <button class="cube-card cube-card-mirror-gold" data-size="3" data-type="gold">
            <div class="cube-card-preview">
              <div class="mini-grid mini-grid-mirror-gold">
                <span class="m-span-1"></span><span class="m-span-2"></span><span class="m-span-3"></span>
                <span class="m-span-2"></span><span class="m-span-1"></span><span class="m-span-2"></span>
                <span class="m-span-3"></span><span class="m-span-2"></span><span class="m-span-1"></span>
              </div>
            </div>
            <div class="cube-card-info">
              <div class="cube-card-label">Gold Mirror</div>
              <div class="cube-card-name">Shape-Shifter</div>
            </div>
            <div class="card-badge card-badge-gold">Gold</div>
          </button>
        </div>

        <div class="welcome-actions">
          <button class="btn btn--primary welcome-start" id="start-btn">
            <span>START SOLVING</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
          
          <button class="btn welcome-btn-secondary" id="welcome-beginner-btn" title="Beginner's Guide & Notation Tutorial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Beginner Guide</span>
          </button>

          <button class="btn welcome-btn-secondary welcome-btn-about" id="welcome-about-btn" title="About CUBE LAB & Credits">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>About Studio</span>
          </button>
        </div>

        <div class="welcome-footer">
          <div class="welcome-credits">
            <span class="credits-label">CUBE LAB Studio</span>
          </div>
        </div>
      </div>
    `;

    // Card selection
    this.container.querySelectorAll('.cube-card').forEach(card => {
      card.addEventListener('click', () => {
        this.container.querySelectorAll('.cube-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const size = parseInt(card.dataset.size);
        const type = card.dataset.type;
        const isMirror = type === 'silver' ? 'silver' : (type === 'gold' ? 'gold' : false);
        this.selectedConfig = { size, isMirror };
      });
    });

    // Start button
    this.container.querySelector('#start-btn').addEventListener('click', () => {
      this.onStart?.(this.selectedConfig);
    });

    // Beginner guide button
    this.container.querySelector('#welcome-beginner-btn')?.addEventListener('click', () => {
      this.onShowBeginnerGuide?.();
    });

    // About button
    this.container.querySelector('#welcome-about-btn')?.addEventListener('click', () => {
      this.onShowAbout?.();
    });
  }

  show() {
    this.container.classList.remove('hidden');
    this.container.classList.add('fade-in');
  }

  hide() {
    this.container.classList.add('hidden');
    this.container.classList.remove('fade-in');
  }
}
