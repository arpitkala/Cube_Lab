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
 *
 * SAMPLING GEOMETRY:
 * The <video> is displayed with `object-fit: cover`, which scales the camera
 * frame up to fill the wrapper and crops the overflow. The alignment guide the
 * user frames the cube inside is a separate overlay element inset from that
 * wrapper. Sampling the raw frame therefore reads the wrong pixels — the
 * capture must be mapped back through the cover transform so that the sampled
 * region is exactly the region under the on-screen guide.
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

/** Fraction of each grid cell that is sampled, centred — avoids sticker edges and gaps. */
const CELL_SAMPLE_RATIO = 0.5;

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

    /** True once the live video has real dimensions and can be sampled. */
    this.cameraReady = false;

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
              <img id="scanner-img-preview" class="hidden" alt="Uploaded Face"
                   style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
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
        const idx = parseInt(btn.dataset.index, 10);
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

    // Camera photo snap — only advance when a frame was genuinely sampled.
    this.container.querySelector('#btn-snap-photo')?.addEventListener('click', () => {
      if (this._sampleGridFromVideo()) this._autoAdvanceNextFace();
    });

    // File upload
    const fileInput = this.container.querySelector('#cam-file-input');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      // Reset the input so re-picking the same file still fires a change event.
      e.target.value = '';
      if (!file) return;

      const reader = new FileReader();
      reader.onerror = () => this._toast('⚠ Could not read that file');
      reader.onload = (evt) => this._loadAndSampleImage(evt.target.result);
      reader.readAsDataURL(file);
    });

    // Generate solver guide
    this.container.querySelector('#btn-generate-guide')?.addEventListener('click', () => {
      const missing = FACES_ORDER.filter(f => !this.faceCompleted[f.code]).map(f => f.code);
      if (missing.length > 0) {
        this._toast(`⚠ Scan the remaining ${missing.length} face(s): ${missing.join(', ')}`, 2800);
        return;
      }

      const problem = this._validateScannedState();
      if (problem) {
        this._toast(`⚠ ${problem} — fix the colors in the grid editor`, 3600);
        return;
      }

      this.onGenerateSolveGuide?.(this.scannedData);
      this.hide();
    });
  }

  // ─── Lifecycle ───────────────────────────────────────────────────

  async show(size = 3) {
    this._resetScannedData(size);
    const badge = this.container.querySelector('#scanner-cube-badge');
    if (badge) badge.textContent = `${size}×${size}`;

    this._clearImagePreview();
    this.container.classList.remove('hidden');
    this._switchFace(0);

    await this._startCamera();
  }

  hide() {
    this._stopCamera();
    this._clearImagePreview();
    this.container.classList.add('hidden');
  }

  /**
   * Request the camera and wait until the video actually has dimensions.
   * `facingMode: 'environment'` as a hard constraint fails outright on
   * desktops with a single front-facing webcam, so it is requested as a
   * preference with a plain video fallback.
   */
  async _startCamera() {
    const video = this.container.querySelector('#scanner-video');
    if (!video) return;

    this.cameraReady = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      this._toast('⚠ Camera unavailable — use "Upload Picture" instead', 4000);
      return;
    }

    const attempts = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!this.stream) {
      console.warn('[WebcamScanner] Camera not accessible or denied:', lastError);
      const denied = lastError?.name === 'NotAllowedError' || lastError?.name === 'SecurityError';
      this._toast(
        denied
          ? '⚠ Camera permission denied — use "Upload Picture" instead'
          : '⚠ No camera found — use "Upload Picture" instead',
        4000
      );
      return;
    }

    // The modal may have been closed while the permission prompt was open.
    if (this.container.classList.contains('hidden')) {
      this._stopCamera();
      return;
    }

    video.srcObject = this.stream;

    try {
      await this._waitForVideoReady(video);
      await video.play();
      this.cameraReady = true;
    } catch (err) {
      console.warn('[WebcamScanner] Video failed to start:', err);
      this._toast('⚠ Camera stream failed to start', 4000);
    }
  }

  /**
   * Resolve once the video reports real dimensions. Sampling before this point
   * yields a 0×0 frame and silently produces default colors.
   *
   * @param {HTMLVideoElement} video
   */
  _waitForVideoReady(video) {
    if (video.videoWidth && video.videoHeight) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timed out waiting for camera metadata'));
      }, 8000);

      const onReady = () => {
        if (!video.videoWidth || !video.videoHeight) return;
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Video element error'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('error', onError);
    });
  }

  _stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraReady = false;

    // Releasing the element's reference matters too: a retained srcObject keeps
    // the camera indicator lit in some browsers and blocks the next getUserMedia.
    const video = this.container.querySelector('#scanner-video');
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  /** Hide the uploaded still so the live camera feed is visible again. */
  _clearImagePreview() {
    const imgPreview = this.container.querySelector('#scanner-img-preview');
    if (imgPreview) {
      imgPreview.classList.add('hidden');
      imgPreview.removeAttribute('src');
    }
  }

  // ─── Wizard ──────────────────────────────────────────────────────

  _switchFace(idx) {
    this.currentFaceIndex = idx;
    const faceObj = FACES_ORDER[idx];

    // Each face is captured from its own frame, so drop the previous upload.
    this._clearImagePreview();

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
      camGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      camGrid.innerHTML = Array(totalStickers).fill('<span></span>').join('');
    }

    // Grid Editor
    const editorGrid = this.container.querySelector('#sticker-grid-editor');
    if (editorGrid) {
      editorGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      editorGrid.innerHTML = gridData.map((colorName, i) => {
        const colorObj = COLOR_PALETTE.find(c => c.name === colorName) || COLOR_PALETTE[0];
        return `<button class="sticker-cell" data-cell="${i}" style="background-color: ${colorObj.hex};" title="Cell ${i + 1}: ${colorName}"></button>`;
      }).join('');

      editorGrid.querySelectorAll('.sticker-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const idx = parseInt(cell.dataset.cell, 10);
          this.scannedData[currentFace][idx] = this.selectedPaletteColor;

          // A hand-corrected face counts as reviewed, so the wizard does not
          // block the user for a face they filled in without a photo.
          this.faceCompleted[currentFace] = true;

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

  // ─── Capture ─────────────────────────────────────────────────────

  /**
   * Sample the current face from the live video stream.
   * @returns {boolean} true if a real frame was sampled
   */
  _sampleGridFromVideo() {
    const video = this.container.querySelector('#scanner-video');

    if (!video || !this.cameraReady || !video.videoWidth || !video.videoHeight) {
      this._toast('⚠ Camera not ready — allow access or upload a picture', 3000);
      return false;
    }

    // A live snap replaces any still left over from an upload.
    this._clearImagePreview();
    return this._captureFace(video, video.videoWidth, video.videoHeight);
  }

  /**
   * Decode an uploaded picture, show it in the preview, and sample it.
   * The original implementation sampled immediately after assigning `src`,
   * before the browser had decoded the image, so `naturalWidth` was still 0
   * and every upload silently fell back to the face's default color.
   *
   * @param {string} dataUrl
   */
  _loadAndSampleImage(dataUrl) {
    const imgPreview = this.container.querySelector('#scanner-img-preview');
    if (!imgPreview) return;

    const onLoad = () => {
      imgPreview.removeEventListener('load', onLoad);
      imgPreview.removeEventListener('error', onError);
      imgPreview.classList.remove('hidden');

      if (this._captureFace(imgPreview, imgPreview.naturalWidth, imgPreview.naturalHeight)) {
        this._autoAdvanceNextFace();
      }
    };
    const onError = () => {
      imgPreview.removeEventListener('load', onLoad);
      imgPreview.removeEventListener('error', onError);
      this._toast('⚠ That image could not be decoded');
    };

    imgPreview.addEventListener('load', onLoad);
    imgPreview.addEventListener('error', onError);
    imgPreview.src = dataUrl;
  }

  /**
   * Draw a media element to an offscreen canvas and classify the N×N grid
   * region that sits under the on-screen alignment guide.
   *
   * @param {HTMLVideoElement|HTMLImageElement} source
   * @param {number} srcW — intrinsic source width
   * @param {number} srcH — intrinsic source height
   * @returns {boolean} true on success
   */
  _captureFace(source, srcW, srcH) {
    if (!srcW || !srcH) return false;

    const currentFace = FACES_ORDER[this.currentFaceIndex].code;

    const canvas = document.createElement('canvas');
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    try {
      ctx.drawImage(source, 0, 0, srcW, srcH);
    } catch (err) {
      console.warn('[WebcamScanner] Failed to draw frame:', err);
      return false;
    }

    const region = this._guideRegionInSourcePixels(srcW, srcH);
    const colors = this._extractColors(ctx, region);
    if (!colors) return false;

    this.scannedData[currentFace] = colors;
    this.faceCompleted[currentFace] = true;
    this._renderGridOverlayAndEditor();
    this._updateNetPreview();
    return true;
  }

  /**
   * Map the alignment-guide rectangle from CSS pixels into source-frame
   * pixels, undoing the `object-fit: cover` scale-and-crop that the browser
   * applies when painting the media into the wrapper.
   *
   * @param {number} srcW
   * @param {number} srcH
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  _guideRegionInSourcePixels(srcW, srcH) {
    const wrapper = this.container.querySelector('.video-wrapper');
    const guide = this.container.querySelector('#cam-overlay-grid');

    const wrapperRect = wrapper?.getBoundingClientRect();
    const guideRect = guide?.getBoundingClientRect();

    // If the layout is unavailable (modal not painted yet), fall back to the
    // largest centred square of the frame, which is a reasonable framing.
    if (!wrapperRect?.width || !wrapperRect?.height || !guideRect?.width || !guideRect?.height) {
      const side = Math.min(srcW, srcH);
      return { x: (srcW - side) / 2, y: (srcH - side) / 2, w: side, h: side };
    }

    // `cover` scales by the larger ratio, then centres and crops the overflow.
    const scale = Math.max(wrapperRect.width / srcW, wrapperRect.height / srcH);
    const displayedW = srcW * scale;
    const displayedH = srcH * scale;
    const cropX = (displayedW - wrapperRect.width) / 2;
    const cropY = (displayedH - wrapperRect.height) / 2;

    // Guide position relative to the wrapper, in CSS pixels.
    const guideX = guideRect.left - wrapperRect.left;
    const guideY = guideRect.top - wrapperRect.top;

    // The guide is a square in CSS; force the sampled region square as well so
    // every N×N cell maps to an undistorted sticker even if layout rounding or
    // an unexpected wrapper shape makes the overlay rect slightly off-square.
    const side = Math.min(guideRect.width, guideRect.height) / scale;
    const x = (guideX + (guideRect.width - side * scale) / 2 + cropX) / scale;
    const y = (guideY + (guideRect.height - side * scale) / 2 + cropY) / scale;
    const w = side;
    const h = side;

    // Clamp into the frame — a guide edge can fall outside a heavily cropped frame.
    const clampedX = Math.max(0, Math.min(x, srcW - 1));
    const clampedY = Math.max(0, Math.min(y, srcH - 1));
    return {
      x: clampedX,
      y: clampedY,
      w: Math.max(1, Math.min(w, srcW - clampedX)),
      h: Math.max(1, Math.min(h, srcH - clampedY)),
    };
  }

  /**
   * Extract N×N grid sticker colors from a region using RGB-to-HSV
   * classification, averaging the centre of each cell.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ x: number, y: number, w: number, h: number }} region
   * @returns {string[]|null} row-major color names, or null if unreadable
   */
  _extractColors(ctx, region) {
    const N = this.cubeSize;
    const cellW = region.w / N;
    const cellH = region.h / N;
    const resultColors = [];

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const sampleW = Math.max(1, Math.floor(cellW * CELL_SAMPLE_RATIO));
        const sampleH = Math.max(1, Math.floor(cellH * CELL_SAMPLE_RATIO));
        const sx = Math.floor(region.x + (c + 0.5) * cellW - sampleW / 2);
        const sy = Math.floor(region.y + (r + 0.5) * cellH - sampleH / 2);

        let imgData;
        try {
          imgData = ctx.getImageData(Math.max(0, sx), Math.max(0, sy), sampleW, sampleH);
        } catch (err) {
          // Tainted canvas (cross-origin image) — nothing can be read.
          console.warn('[WebcamScanner] Pixel read blocked:', err);
          this._toast('⚠ This image could not be read (cross-origin)', 3200);
          return null;
        }

        resultColors.push(this._classifyRGBToCubeColor(...this._medianRGB(imgData)));
      }
    }

    return resultColors;
  }

  /**
   * Per-channel median of a pixel block. The median rejects the outliers a
   * plain mean is dragged by — specular highlights on glossy stickers and the
   * dark sticker gaps that clip the edge of a sample box.
   *
   * @param {ImageData} imgData
   * @returns {[number, number, number]}
   */
  _medianRGB(imgData) {
    const data = imgData.data;
    const pixelCount = data.length / 4;
    const rs = [], gs = [], bs = [];

    // A cell of a 720p frame can hold tens of thousands of pixels; a few
    // hundred evenly spread samples pin down the median just as well.
    const stride = Math.max(1, Math.floor(pixelCount / 512));

    for (let px = 0; px < pixelCount; px += stride) {
      const i = px * 4;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }

    const mid = (arr) => {
      arr.sort((a, b) => a - b);
      return arr[Math.floor(arr.length / 2)] || 0;
    };
    return [mid(rs), mid(gs), mid(bs)];
  }

  /**
   * Classify an RGB triple as one of the six standard sticker colors.
   *
   * Works in HSV: value separates bright stickers from shadowed ones,
   * saturation separates white from the chromatic colors, and hue separates
   * the five chromatic colors from each other. Every hue is assigned to a
   * color — the previous version left 260°–345° unclaimed and fell through to
   * white, which turned violet-cast reds into whites under warm lighting.
   *
   * @param {number} r 0-255
   * @param {number} g 0-255
   * @param {number} b 0-255
   * @returns {string}
   */
  _classifyRGBToCubeColor(r, g, b) {
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;

    const max = Math.max(rN, gN, bN);
    const min = Math.min(rN, gN, bN);
    const delta = max - min;

    const v = max;
    const s = max === 0 ? 0 : delta / max;

    let h = 0;
    if (delta > 0) {
      if (max === rN) h = ((gN - bN) / delta) % 6;
      else if (max === gN) h = (bN - rN) / delta + 2;
      else h = (rN - gN) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    // White: little chroma. The threshold rises with brightness because a dim
    // white sticker in shadow still reads as near-neutral, while a dark, weakly
    // saturated pixel is more likely a shadowed colored sticker than a white one.
    const whiteSatCutoff = v > 0.65 ? 0.30 : 0.18;
    if (s < whiteSatCutoff) return 'white';

    // Yellow and white are the pair most often confused: a yellow sticker is
    // saturated in the 40°–70° band, whereas warm-lit white is not.
    if (h >= 40 && h < 72) return 'yellow';
    if (h >= 72 && h < 165) return 'green';
    if (h >= 165 && h < 260) return 'blue';

    // Orange vs. red both sit in the 0°–40° band. Orange carries a
    // meaningfully higher green component relative to red than red does.
    if (h >= 15 && h < 40) return 'orange';
    if (h < 15 || h >= 260) {
      const greenRatio = rN > 0 ? gN / rN : 0;
      return greenRatio > 0.42 ? 'orange' : 'red';
    }

    return 'red';
  }

  // ─── Validation ──────────────────────────────────────────────────

  /**
   * Sanity-check a completed scan before it is handed to the puzzle. A real
   * cube has exactly N² stickers of each of the six colors, and six distinct
   * center colors. A mis-detected sticker breaks one of those invariants, and
   * catching it here is far more useful than silently applying an impossible
   * state to the 3D cube.
   *
   * @returns {string|null} human-readable problem, or null if the scan is consistent
   */
  _validateScannedState() {
    const perFace = this.cubeSize * this.cubeSize;
    const counts = {};

    for (const face of FACES_ORDER) {
      for (const color of this.scannedData[face.code]) {
        counts[color] = (counts[color] || 0) + 1;
      }
    }

    const wrong = COLOR_PALETTE
      .map(c => ({ name: c.name, n: counts[c.name] || 0 }))
      .filter(c => c.n !== perFace);

    if (wrong.length > 0) {
      const detail = wrong.map(c => `${c.name} ${c.n}/${perFace}`).join(', ');
      return `Sticker counts are off (${detail})`;
    }

    // Centers are fixed on a real cube, so on odd-order cubes all six must differ.
    if (this.cubeSize % 2 === 1) {
      const mid = Math.floor(perFace / 2);
      const centers = FACES_ORDER.map(f => this.scannedData[f.code][mid]);
      if (new Set(centers).size !== 6) {
        return 'Two faces have the same center color';
      }
    }

    return null;
  }

  // ─── Feedback ────────────────────────────────────────────────────

  /**
   * Show a transient message in the existing status toast.
   *
   * @param {string} message
   * @param {number} [duration=1800]
   */
  _toast(message, duration = 1800) {
    const toast = this.container.querySelector('#scan-status-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
  }

  /**
   * Confirm the capture and advance to the next unscanned face.
   */
  _autoAdvanceNextFace() {
    const currentFaceObj = FACES_ORDER[this.currentFaceIndex];
    this._toast(`✓ Face [${currentFaceObj.code}] Captured!`);

    if (this.currentFaceIndex < FACES_ORDER.length - 1) {
      setTimeout(() => {
        // The user may have navigated away during the delay.
        if (this.currentFaceIndex < FACES_ORDER.length - 1) {
          this._switchFace(this.currentFaceIndex + 1);
        }
      }, 500);
      return;
    }

    // Last face in the wizard — highlight the action if the scan is complete.
    const allDone = FACES_ORDER.every(f => this.faceCompleted[f.code]);
    const btnGen = this.container.querySelector('#btn-generate-guide');
    if (btnGen) btnGen.classList.toggle('btn-glow-pulse', allDone);
  }
}
