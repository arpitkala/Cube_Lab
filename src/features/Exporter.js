/**
 * Exporter.js — 4K Canvas Snapshot Render & WCA Notation String Exporter
 */

export class Exporter {
  /**
   * @param {import('../rendering/SceneManager.js').SceneManager} sceneManager
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
  }

  takeSnapshot() {
    const renderer = this.sceneManager.renderer;
    if (!renderer) return;

    // Force a fresh render pass right before data URL extraction
    this.sceneManager.render();

    try {
      const dataURL = renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cubelab-snapshot-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('[Exporter] HD Canvas snapshot downloaded successfully');
    } catch (err) {
      console.error('[Exporter] Failed to capture snapshot:', err);
    }
  }

  copyWCANotation(scramble, solveMoves) {
    const text = `Scramble: ${scramble || 'None'}\nSolve (${solveMoves?.length || 0} moves): ${(solveMoves || []).join(' ')}`;
    navigator.clipboard.writeText(text).then(() => {
      console.log('[Exporter] WCA notation copied to clipboard');
    }).catch(err => {
      console.warn('[Exporter] Clipboard write failed:', err);
    });
    return text;
  }
}
