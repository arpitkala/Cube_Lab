/**
 * WCAInspectionTimer.js — WCA Official 15-Second Inspection Phase Timer
 * 
 * Provides official WCA inspection countdown before solving starts.
 * Features audio alerts at 8 seconds ("8 seconds!") and 12 seconds ("12 seconds!").
 */

export class WCAInspectionTimer {
  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onTick - (secondsRemaining) => void
   * @param {Function} callbacks.onInspectionComplete - (penalty) => void // penalty: 'NONE' | '+2' | 'DNF'
   * @param {Function} callbacks.onVoiceCue - (text) => void
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.remaining = 15;
    this.timerId = null;
    this.active = false;
  }

  start() {
    this.stop();
    this.remaining = 15;
    this.active = true;
    this.callbacks.onTick?.(this.remaining);

    this.timerId = setInterval(() => {
      this.remaining--;
      this.callbacks.onTick?.(this.remaining);

      if (this.remaining === 7) {
        this.callbacks.onVoiceCue?.('8 seconds');
      } else if (this.remaining === 3) {
        this.callbacks.onVoiceCue?.('12 seconds');
      }

      if (this.remaining <= -2) {
        // DNF penalty after 17s total inspection
        this.stop();
        this.callbacks.onInspectionComplete?.('DNF');
      }
    }, 1000);
  }

  cancelAndStartSolve() {
    if (!this.active) return 'NONE';
    const inspectTime = 15 - this.remaining;
    this.stop();

    if (inspectTime > 17) return 'DNF';
    if (inspectTime > 15) return '+2';
    return 'NONE';
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.active = false;
  }
}
