/**
 * BeginnerGuideModal.js — Interactive Beginner Cubing Academy
 * 
 * Provides a step-by-step beginner guide (Layer-by-Layer method) with:
 * - Interactive notation breakdown (U, D, L, R, F, B, Prime, Double).
 * - 7-Stage solving walkthrough with visual steps & formulas.
 * - "Try on 3D Cube" demo execution buttons for formulas like Sexy Move (R U R' U').
 */

import { Move } from '../core/Move.js';

export class BeginnerGuideModal {
  /**
   * @param {HTMLElement} container
   * @param {Object} callbacks — { onExecuteSequence: (movesArray) => void }
   */
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.activeTab = 'notation'; // 'notation' | 'method' | 'cheat'
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="beginner-inner ui-panel-glass fade-in">
        <div class="beginner-header">
          <div class="beginner-title-group">
            <div class="beginner-icon">🎓</div>
            <div>
              <h2 class="beginner-title">BEGINNER'S CUBING ACADEMY</h2>
              <p class="beginner-subtitle">Master the 3×3 Rubik's Cube Layer-by-Layer</p>
            </div>
          </div>
          <button class="btn btn-close" id="beginner-close" title="Close Guide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="beginner-tabs">
          <button class="tab-btn active" data-tab="notation">1. Notation & Anatomy</button>
          <button class="tab-btn" data-tab="method">2. 7-Step Beginner Solution</button>
          <button class="tab-btn" data-tab="cheat">3. Essential Formulas & Tricks</button>
        </div>

        <div class="beginner-body">
          <!-- TAB 1: NOTATION & ANATOMY -->
          <div class="tab-content active" id="tab-notation">
            <div class="guide-card">
              <h3>Cube Anatomy 101</h3>
              <p>A standard 3×3 Rubik's Cube consists of 26 individual pieces attached to a central core:</p>
              <div class="pieces-info-grid">
                <div class="piece-box">
                  <span class="p-badge p-center">6 Centers</span>
                  <p>1 color each. Fixed in place — they determine the color of each face!</p>
                </div>
                <div class="piece-box">
                  <span class="p-badge p-edge">12 Edges</span>
                  <p>2 colors each. Located between center pieces.</p>
                </div>
                <div class="piece-box">
                  <span class="p-badge p-corner">8 Corners</span>
                  <p>3 colors each. Located at the corners of the cube.</p>
                </div>
              </div>
            </div>

            <div class="guide-card">
              <h3>Standard WCA Move Notation</h3>
              <p>Each letter represents a face rotation looking directly at that face:</p>
              <div class="notation-grid">
                <div class="not-card face-U">
                  <span class="not-badge">U</span>
                  <div><strong>Up (Top)</strong><br/><small>Rotate top layer 90° Clockwise</small></div>
                </div>
                <div class="not-card face-D">
                  <span class="not-badge">D</span>
                  <div><strong>Down (Bottom)</strong><br/><small>Rotate bottom layer 90° Clockwise</small></div>
                </div>
                <div class="not-card face-F">
                  <span class="not-badge">F</span>
                  <div><strong>Front</strong><br/><small>Rotate front layer 90° Clockwise</small></div>
                </div>
                <div class="not-card face-B">
                  <span class="not-badge">B</span>
                  <div><strong>Back</strong><br/><small>Rotate back layer 90° Clockwise</small></div>
                </div>
                <div class="not-card face-L">
                  <span class="not-badge">L</span>
                  <div><strong>Left</strong><br/><small>Rotate left layer 90° Clockwise</small></div>
                </div>
                <div class="not-card face-R">
                  <span class="not-badge">R</span>
                  <div><strong>Right</strong><br/><small>Rotate right layer 90° Clockwise</small></div>
                </div>
              </div>

              <div class="modifiers-card">
                <h4>Rotation Modifiers:</h4>
                <ul>
                  <li><strong>Plain Letter (e.g. R, F, U)</strong>: 90° Clockwise rotation.</li>
                  <li><strong>Prime Apostrophe (e.g. R', F', U')</strong>: 90° Counter-Clockwise (CCW) rotation.</li>
                  <li><strong>Number 2 (e.g. R2, F2, U2)</strong>: 180° Half-turn rotation (either direction).</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- TAB 2: 7-STEP BEGINNER METHOD -->
          <div class="tab-content" id="tab-method">
            <div class="steps-timeline">
              <!-- Step 1 -->
              <div class="step-card">
                <div class="step-num">STEP 1</div>
                <div class="step-content">
                  <h4>The White Cross (Daisy Method)</h4>
                  <p>First form a "Daisy" (4 white edges around the yellow center), then align each edge's side color with its matching center piece and turn 180° (F2) to form the White Cross on the bottom.</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="step-card">
                <div class="step-num">STEP 2</div>
                <div class="step-content">
                  <h4>First Layer Corners</h4>
                  <p>Position white corner pieces directly above their target slot, then repeat the <strong>Righty Move (R U R' U')</strong> until the white sticker faces down and side colors match adjacent centers.</p>
                  <button class="btn btn--sm demo-formula-btn" data-seq="R U R' U'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Try Righty Move (R U R' U')
                  </button>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="step-card">
                <div class="step-num">STEP 3</div>
                <div class="step-content">
                  <h4>Middle Layer Edges</h4>
                  <p>Find a top edge piece without yellow. Align its side color with the matching center face. If it needs to go to the Right, use: <code>U R U' R' U' F' U F</code>. If to the Left, use: <code>U' L' U L U F U' F'</code>.</p>
                  <button class="btn btn--sm demo-formula-btn" data-seq="U R U' R' U' F' U F">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Try Insert Right Edge
                  </button>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="step-card">
                <div class="step-num">STEP 4</div>
                <div class="step-content">
                  <h4>Top Yellow Cross</h4>
                  <p>Form a yellow cross on top regardless of corner orientation. Repeat <strong>F R U R' U' F'</strong> from a Dot, L-shape, or Line stage until the Yellow Cross is formed.</p>
                  <button class="btn btn--sm demo-formula-btn" data-seq="F R U R' U' F'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Try Yellow Cross (F R U R' U' F')
                  </button>
                </div>
              </div>

              <!-- Step 5 -->
              <div class="step-card">
                <div class="step-num">STEP 5</div>
                <div class="step-content">
                  <h4>Permute Yellow Edges</h4>
                  <p>Rotate top layer (U) so 2 adjacent yellow edge side colors match their centers. Use <strong>Sune Algorithm (R U R' U R U2 R')</strong> to swap unmatched edges into correct positions.</p>
                  <button class="btn btn--sm demo-formula-btn" data-seq="R U R' U R U2 R'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Try Sune Algorithm (R U R' U R U2 R')
                  </button>
                </div>
              </div>

              <!-- Step 6 -->
              <div class="step-card">
                <div class="step-num">STEP 6</div>
                <div class="step-content">
                  <h4>Position Yellow Corners</h4>
                  <p>Look for a corner piece that is in the correct slot (even if twisted). Hold it on front-right and execute <strong>U R U' L' U R' U' L</strong> to cycle the other 3 corners into their correct positions.</p>
                  <button class="btn btn--sm demo-formula-btn" data-seq="U R U' L' U R' U' L">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Try Corner Positioning (U R U' L' U R' U' L)
                  </button>
                </div>
              </div>

              <!-- Step 7 -->
              <div class="step-card">
                <div class="step-num">STEP 7</div>
                <div class="step-content">
                  <h4>Orient Yellow Corners (Final Solve!)</h4>
                  <p>Turn the cube upside down (yellow on bottom). Hold an unsolved corner on bottom-right and repeat <strong>R U R' U'</strong> until yellow points down. Turn bottom layer (D) to bring the next unsolved corner, and repeat!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: ESSENTIAL FORMULAS & CHEAT SHEET -->
          <div class="tab-content" id="tab-cheat">
            <div class="guide-card">
              <h3>Speedcuber Cheat Sheet & Trigger Moves</h3>
              <p>Practice these fundamental muscle-memory triggers to drastically improve your solving speed:</p>
              
              <div class="cheat-list">
                <div class="cheat-item">
                  <div>
                    <strong>Sexy Move (Righty Trigger)</strong>
                    <div class="seq-code">R U R' U'</div>
                    <p>Used for inserting corners, orienting yellow layer, and basic algorithms.</p>
                  </div>
                  <button class="btn btn--sm demo-formula-btn" data-seq="R U R' U'">Demo</button>
                </div>

                <div class="cheat-item">
                  <div>
                    <strong>Lefty Move (Lefty Trigger)</strong>
                    <div class="seq-code">L' U' L U</div>
                    <p>Left-hand mirror of the Righty move.</p>
                  </div>
                  <button class="btn btn--sm demo-formula-btn" data-seq="L' U' L U">Demo</button>
                </div>

                <div class="cheat-item">
                  <div>
                    <strong>Sledgehammer</strong>
                    <div class="seq-code">R' F R F'</div>
                    <p>Versatile edge/corner orientation trigger.</p>
                  </div>
                  <button class="btn btn--sm demo-formula-btn" data-seq="R' F R F'">Demo</button>
                </div>

                <div class="cheat-item">
                  <div>
                    <strong>Sune Permutation</strong>
                    <div class="seq-code">R U R' U R U2 R'</div>
                    <p>Permutes 3 top edges or orient top corners.</p>
                  </div>
                  <button class="btn btn--sm demo-formula-btn" data-seq="R U R' U R U2 R'">Demo</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="beginner-footer">
          <span>💡 Press any formula "Demo" button to see it run live on the 3D cube!</span>
          <button class="btn btn--primary" id="beginner-btn-close">Got it, Let's Solve!</button>
        </div>
      </div>
    `;

    // Tab switcher
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        this.container.querySelector(`#tab-${target}`)?.classList.add('active');
      });
    });

    // Close buttons
    this.container.querySelector('#beginner-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#beginner-btn-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hide());

    // Demo formula execution buttons
    this.container.querySelectorAll('.demo-formula-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const seqStr = btn.dataset.seq;
        if (!seqStr) return;
        const moves = seqStr.split(' ').map(token => Move.fromString(token));
        this.callbacks.onExecuteSequence?.(moves);
        this.hide();
      });
    });
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
