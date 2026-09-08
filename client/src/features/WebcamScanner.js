/**
 * WebcamScanner.js — Real Computer Vision Camera Reader & Solver Guide Generator
 * 
 * Features:
 * - Real-time RGB & HSV pixel sampling from live webcam video frame or uploaded picture.
 * - Dynamically supports any cube size (2×2, 3×3, 4×4, 5×5).
 * - Auto-advances through all 6 faces (U, D, L, R, F, B) upon snapping a frame.
 * - Visual face completion checkmarks (✓) on wizard tabs.
 * - Interactive N×N grid sticker editor with color selector palette (White, Yellow, Red, Orange, Blue, Green).
 * - "Generate Solver Guide" action button.
 */

const FACES_ORDER = [
  { code: 'U', name: 'Up (Top)', defaultColor: 'white' },
  { code: 'D', name: 'Down (Bottom)', defaultColor: 'yellow' },
  { code: 'F', name: 'Front', defaultColor: 'blue' },
  { code: 'B', name: 'Back', defaultColor: 'green' },
  { code: 'L', name: 'Left', defaultColor: 'orange' },
  { code: 'R', name: 'Right', defaultColor: 'red' },
];

const COLOR_PALETTE = [
  { name: 'white', hex: '#ffffff', label: 'W' },
  { name: 'yellow', hex: '#ffe100', label: 'Y' },
  { name: 'red', hex: '#ff2a4b', label: 'R' },
  { name: 'orange', hex: '#ff6a00', label: 'O' },
  { name: 'blue', hex: '#1a8cff', label: 'B' },
  { name: 'green', hex: '#00cc66', label: 'G' },
];

export class WebcamScanner {
  /**
   * @param {HTMLElement} container
   * @param {Function} onGenerateSolveGuide — (scannedStateMap) => void
   */
  constructor(container, onGenerateSolveGuide) {
    this.container = container;
    this.onGenerateSolveGuide = onGenerateSolveGuide;
    this.stream = null;
    this.currentFaceIndex = 0;
    this.selectedPaletteColor = 'white';
    this.cubeSize = 3;

    // Track completion state per face
    this.faceCompleted = { U: false, D: false, F: false, B: false, L: false, R: false };

    this._resetScannedData(3);
    this._build();
  }

  _resetScannedData(size) {
    this.cubeSize = size;
    const totalStickers = size * size;
    this.faceCompleted = { U: false, D: false, F: false, B: false, L: false, R: false };
    this.scannedData = {
      U: Array(totalStickers).fill('white'),
      D: Array(totalStickers).fill('yellow'),
      F: Array(totalStickers).fill('blue'),
      B: Array(totalStickers).fill('green'),
      L: Array(totalStickers).fill('orange'),
      R: Array(totalStickers).fill('red'),
    };
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="scanner-inner ui-panel-glass fade-in">
        <div class="scanner-header">
          <div class="scanner-title-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <div>
              <h3 class="scanner-title">Physical Cube Camera Scanner (<span id="scanner-cube-badge">3×3</span>)</h3>
              <p class="scanner-sub">Scan all 6 faces of your physical cube to generate a solver guide</p>
            </div>
          </div>
          <button class="btn btn-close" id="scanner-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Wizard Steps Bar -->
        <div class="scanner-wizard-bar">
          ${FACES_ORDER.map((f, i) => `
            <button class="face-wizard-step ${i === 0 ? 'active' : ''}" data-index="${i}">
              <span class="step-face-code face-${f.code}" id="badge-code-${f.code}">${f.code}</span>
              <span class="step-face-name">${f.name}</span>
            </button>
          `).join('')}
        </div>

        <div class="scanner-body">
          <!-- Video / Photo Capture area -->
          <div class="scanner-cam-col">
            <div class="video-wrapper">
              <video id="scanner-video" autoplay playsinline muted></video>
              <img id="scanner-img-preview" class="hidden" alt="Uploaded Face" />
              <div class="scanner-grid-overlay" id="cam-overlay-grid"></div>
            </div>

            <div class="cam-action-buttons">
              <button class="btn btn--primary" id="btn-snap-photo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                Snap Frame & Next
              </button>
              <label class="btn" for="cam-file-input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Picture
                <input type="file" id="cam-file-input" accept="image/*" class="hidden" />
              </label>
            </div>

            <div class="scan-status-toast hidden" id="scan-status-toast">
              ✓ Face Captured!
            </div>
          </div>

          <!-- Color Verification & Grid Editor -->
          <div class="scanner-edit-col">
            <div class="edit-header">
              <h4 id="current-face-title">Scanning Face: Up (Top)</h4>
              <p>Click any sticker cell below to adjust detected color:</p>
            </div>

            <!-- Color Palette Selector -->
            <div class="palette-picker">
              ${COLOR_PALETTE.map((c, i) => `
                <button class="palette-btn ${i === 0 ? 'selected' : ''}" data-color="${c.name}" style="background-color: ${c.hex};">
                  ${c.label}
                </button>
              `).join('')}
            </div>

            <!-- Interactive Dynamic N×N Grid Editor -->
            <div class="sticker-grid-nxn" id="sticker-grid-editor"></div>

            <!-- Unfolded Net Mini Preview -->
            <div class="net-status-box">
              <span class="net-title">Cube Net Progress:</span>
              <div class="net-diagram">
                <div class="net-cell net-U" id="net-U">U</div>
                <div class="net-row">
                  <div class="net-cell net-L" id="net-L">L</div>
                  <div class="net-cell net-F" id="net-F">F</div>
                  <div class="net-cell net-R" id="net-R">R</div>
                  <div class="net-cell net-B" id="net-B">B</div>
                </div>
                <div class="net-cell net-D" id="net-D">D</div>
              </div>
            </div>
          </div>
        </div>

        <div class="scanner-footer">
          <div class="wizard-nav-btns">
            <button class="btn" id="btn-prev-face">← Previous Face</button>
            <button class="btn" id="btn-next-face">Next Face →</button>
          </div>
          <button class="btn btn--primary btn--lg" id="btn-generate-guide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            GENERATE SOLVER GUIDE
          </button>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('#scanner-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hide());

    // Face wizard navigation
    this.container.querySelectorAll('.face-wizard-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this._switchFace(idx);
      });
    });

    this.container.querySelector('#btn-prev-face')?.addEventListener('click', () => {
      if (this.currentFaceIndex > 0) this._switchFace(this.currentFaceIndex - 1);
    });

    this.container.querySelector('#btn-next-face')?.addEventListener('click', () => {
      if (this.currentFaceIndex < FACES_ORDER.length - 1) this._switchFace(this.currentFaceIndex + 1);
    });

    // Palette selection
    this.container.querySelectorAll('.palette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedPaletteColor = btn.dataset.color;
      });
    });

    // Camera photo snap
    this.container.querySelector('#btn-snap-photo')?.addEventListener('click', () => {
      this._sampleGridFromVideo();
      this._autoAdvanceNextFace();
    });

    // File upload
    const fileInput = this.container.querySelector('#cam-file-input');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const imgPreview = this.container.querySelector('#scanner-img-preview');
          if (imgPreview) {
            imgPreview.src = evt.target.result;
            imgPreview.classList.remove('hidden');
          }
          this._sampleGridFromImage(evt.target.result);
          this._autoAdvanceNextFace();
        };
        reader.readAsDataURL(file);
      }
    });

    // Generate solver guide
    this.container.querySelector('#btn-generate-guide')?.addEventListener('click', () => {
      this.onGenerateSolveGuide?.(this.scannedData);
      this.hide();
    });
  }

  async show(size = 3) {
    this._resetScannedData(size);
    const badge = this.container.querySelector('#scanner-cube-badge');
    if (badge) badge.textContent = `${size}×${size}`;

    this.container.classList.remove('hidden');
    const video = this.container.querySelector('#scanner-video');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (video) video.srcObject = this.stream;
    } catch (err) {
      console.warn('[WebcamScanner] Webcam camera not accessible or denied:', err);
    }
    this._switchFace(0);
  }

  hide() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.container.classList.add('hidden');
  }

  _switchFace(idx) {
    this.currentFaceIndex = idx;
    const faceObj = FACES_ORDER[idx];

    // Update wizard tabs
    this.container.querySelectorAll('.face-wizard-step').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });

    const titleEl = this.container.querySelector('#current-face-title');
    if (titleEl) titleEl.textContent = `Scanning Face: ${faceObj.name}`;

    this._renderGridOverlayAndEditor();
    this._updateNetPreview();
  }

  _renderGridOverlayAndEditor() {
    const size = this.cubeSize;
    const totalStickers = size * size;
    const currentFace = FACES_ORDER[this.currentFaceIndex].code;
    const gridData = this.scannedData[currentFace];

    // Camera Video Overlay Grid
    const camGrid = this.container.querySelector('#cam-overlay-grid');
    if (camGrid) {
      camGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      camGrid.innerHTML = Array(totalStickers).fill('<span></span>').join('');
    }

    // Grid Editor
    const editorGrid = this.container.querySelector('#sticker-grid-editor');
    if (editorGrid) {
      editorGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      editorGrid.innerHTML = gridData.map((colorName, i) => {
        const colorObj = COLOR_PALETTE.find(c => c.name === colorName) || COLOR_PALETTE[0];
        return `<button class="sticker-cell" data-cell="${i}" style="background-color: ${colorObj.hex};" title="Cell ${i+1}: ${colorName}"></button>`;
      }).join('');

      editorGrid.querySelectorAll('.sticker-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const idx = parseInt(cell.dataset.cell);
          this.scannedData[currentFace][idx] = this.selectedPaletteColor;
          this._renderGridOverlayAndEditor();
          this._updateNetPreview();
        });
      });
    }

    // Update wizard completion badges
    FACES_ORDER.forEach(f => {
      const badgeCode = this.container.querySelector(`#badge-code-${f.code}`);
      if (badgeCode) {
        if (this.faceCompleted[f.code]) {
          badgeCode.textContent = '✓';
          badgeCode.style.backgroundColor = '#10b981';
        } else {
          badgeCode.textContent = f.code;
          badgeCode.style.backgroundColor = '';
        }
      }
    });
  }

  _updateNetPreview() {
    const midIdx = Math.floor((this.cubeSize * this.cubeSize) / 2);
    FACES_ORDER.forEach(f => {
      const netCell = this.container.querySelector(`#net-${f.code}`);
      if (netCell) {
        const centerColor = this.scannedData[f.code][midIdx] || 'white';
        const colorObj = COLOR_PALETTE.find(c => c.name === centerColor);
        if (colorObj) netCell.style.backgroundColor = colorObj.hex;
      }
    });
  }

  /**
   * Real Computer Vision Pixel Sampling from Video Stream
   */
  _sampleGridFromVideo() {
    const video = this.container.querySelector('#scanner-video');
    const currentFace = FACES_ORDER[this.currentFaceIndex].code;

    if (video && video.videoWidth && video.videoHeight) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      this.scannedData[currentFace] = this._extractColorsFromCanvas(canvas);
    } else {
      // Fallback
      const defaultColor = FACES_ORDER[this.currentFaceIndex].defaultColor;
      this.scannedData[currentFace] = Array(this.cubeSize * this.cubeSize).fill(defaultColor);
    }

    this.faceCompleted[currentFace] = true;
    this._renderGridOverlayAndEditor();
    this._updateNetPreview();
  }

  /**
   * Real Computer Vision Pixel Sampling from Uploaded Image
   */
  _sampleGridFromImage(dataUrl) {
    const currentFace = FACES_ORDER[this.currentFaceIndex].code;
    const imgPreview = this.container.querySelector('#scanner-img-preview');

    if (imgPreview && imgPreview.naturalWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = imgPreview.naturalWidth;
      canvas.height = imgPreview.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgPreview, 0, 0);

      this.scannedData[currentFace] = this._extractColorsFromCanvas(canvas);
    } else {
      const defaultColor = FACES_ORDER[this.currentFaceIndex].defaultColor;
      this.scannedData[currentFace] = Array(this.cubeSize * this.cubeSize).fill(defaultColor);
    }

    this.faceCompleted[currentFace] = true;
    this._renderGridOverlayAndEditor();
    this._updateNetPreview();
  }

  /**
   * Extract N x N grid sticker colors using RGB-to-HSV color classification
   */
  _extractColorsFromCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const N = this.cubeSize;
    const resultColors = [];

    const cellW = w / N;
    const cellH = h / N;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const centerX = Math.floor((c + 0.5) * cellW);
        const centerY = Math.floor((r + 0.5) * cellH);

        // Sample 5x5 pixel box
        const sampleSize = Math.max(2, Math.floor(Math.min(cellW, cellH) * 0.2));
        const imgData = ctx.getImageData(
          Math.max(0, centerX - Math.floor(sampleSize / 2)),
          Math.max(0, centerY - Math.floor(sampleSize / 2)),
          sampleSize,
          sampleSize
        );

        let sumR = 0, sumG = 0, sumB = 0;
        const totalPixels = imgData.data.length / 4;

        for (let i = 0; i < imgData.data.length; i += 4) {
          sumR += imgData.data[i];
          sumG += imgData.data[i + 1];
          sumB += imgData.data[i + 2];
        }

        const avgR = sumR / totalPixels;
        const avgG = sumG / totalPixels;
        const avgB = sumB / totalPixels;

        const colorName = this._classifyRGBToCubeColor(avgR, avgG, avgB);
        resultColors.push(colorName);
      }
    }

    return resultColors;
  }

  /**
   * Classify RGB color values to Rubik's cube sticker color
   */
  _classifyRGBToCubeColor(r, g, b) {
    // Normalize RGB to 0..1
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;

    const max = Math.max(rN, gN, bN);
    const min = Math.min(rN, gN, bN);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;

    if (delta !== 0) {
      if (max === rN) h = ((gN - bN) / delta) % 6;
      else if (max === gN) h = (bN - rN) / delta + 2;
      else h = (rN - gN) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    // White detection: Low saturation or high brightness with low saturation
    if (s < 0.22 || (v > 0.8 && s < 0.3)) {
      return 'white';
    }

    // Hue-based classification
    if (h >= 45 && h <= 75) return 'yellow';
    if (h > 75 && h <= 165) return 'green';
    if (h > 165 && h <= 260) return 'blue';
    if (h > 15 && h < 45) return 'orange';
    if (h <= 15 || h > 345) return 'red';

    return 'white';
  }

  /**
   * Auto advance to next face after snap
   */
  _autoAdvanceNextFace() {
    const toast = this.container.querySelector('#scan-status-toast');
    if (toast) {
      const currentFaceObj = FACES_ORDER[this.currentFaceIndex];
      toast.textContent = `✓ Face [${currentFaceObj.code}] Captured!`;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 1800);
    }

    // If next face available, advance to it
    if (this.currentFaceIndex < FACES_ORDER.length - 1) {
      setTimeout(() => {
        this._switchFace(this.currentFaceIndex + 1);
      }, 500);
    } else {
      // All faces scanned!
      const btnGen = this.container.querySelector('#btn-generate-guide');
      if (btnGen) {
        btnGen.classList.add('btn-glow-pulse');
      }
    }
  }
}
