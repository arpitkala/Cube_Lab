/**
 * StickerUploader.js — Custom Sticker Image Uploader
 * 
 * Allows users to upload custom images for center cap logos or face stickers.
 */

import * as THREE from 'three';

export class StickerUploader {
  /**
   * @param {HTMLElement} container
   * @param {Function} onTextureLoaded - (texture, faceName) => void
   */
  constructor(container, onTextureLoaded) {
    this.container = container;
    this.onTextureLoaded = onTextureLoaded;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="sticker-inner ui-panel-glass">
        <div class="sticker-header">
          <div class="sticker-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span class="sticker-title">Custom Sticker Logo Creator</span>
          </div>
          <button class="btn btn-close" id="sticker-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div class="sticker-body">
          <p class="sticker-desc">Upload a logo or image to display on the center cap sticker of your 3D cube:</p>
          
          <div class="sticker-dropzone" id="dropzone">
            <input type="file" id="sticker-file-input" accept="image/*" class="file-input-hidden" />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Click or Drag Image Here to Upload Logo</span>
          </div>

          <div class="sticker-controls">
            <label class="sticker-label">Apply to Face:</label>
            <select id="sticker-face-select" class="select-field">
              <option value="U">White Center (Up)</option>
              <option value="F">Green Center (Front)</option>
              <option value="R">Red Center (Right)</option>
              <option value="B">Blue Center (Back)</option>
              <option value="L">Orange Center (Left)</option>
              <option value="D">Yellow Center (Down)</option>
            </select>
          </div>

          <div class="sticker-preview-container hidden" id="preview-box">
            <img id="sticker-preview-img" alt="Preview" />
            <button class="btn btn--primary" id="sticker-apply-btn">Apply Texture to Cube</button>
          </div>

          <div class="sticker-actions">
            <button class="btn btn-danger-sm" id="sticker-remove-face-btn">
              🗑️ Remove Logo from Face
            </button>
            <button class="btn btn-secondary-sm" id="sticker-reset-all-btn">
              🔄 Reset All Logos
            </button>
          </div>
        </div>
      </div>
    `;

    const dropzone = this.container.querySelector('#dropzone');
    const fileInput = this.container.querySelector('#sticker-file-input');
    const previewBox = this.container.querySelector('#preview-box');
    const previewImg = this.container.querySelector('#sticker-preview-img');
    const applyBtn = this.container.querySelector('#sticker-apply-btn');
    const faceSelect = this.container.querySelector('#sticker-face-select');
    const removeFaceBtn = this.container.querySelector('#sticker-remove-face-btn');
    const resetAllBtn = this.container.querySelector('#sticker-reset-all-btn');

    dropzone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          previewBox.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    applyBtn?.addEventListener('click', () => {
      if (previewImg.src) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Applying...';
        const loader = new THREE.TextureLoader();
        loader.load(
          previewImg.src,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            this.onTextureLoaded?.(texture, faceSelect.value);
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply Texture to Cube';
            this.hide();
          },
          undefined,
          (err) => {
            console.error('[StickerUploader] Texture load failed:', err);
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply Texture to Cube';
          }
        );
      }
    });

    removeFaceBtn?.addEventListener('click', () => {
      this.onTextureLoaded?.(null, faceSelect.value);
      this.hide();
    });

    resetAllBtn?.addEventListener('click', () => {
      this.onTextureLoaded?.(null, 'ALL');
      this.hide();
    });

    this.container.querySelector('#sticker-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hide());
  }

  show() { this.container.classList.remove('hidden'); }
  hide() { this.container.classList.add('hidden'); }
}
