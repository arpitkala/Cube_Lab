/**
 * VoiceControls.js — Hands-free Web Speech API Voice Controller
 * 
 * Maps spoken speech commands directly to cube moves and actions.
 */

export class VoiceControls {
  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onMove - (moveNotation) => void
   * @param {Function} callbacks.onScramble - () => void
   * @param {Function} callbacks.onReset - () => void
   * @param {Function} callbacks.onUndo - () => void
   * @param {Function} callbacks.onSolve - () => void
   * @param {Function} callbacks.onStatusChange - (listeningState) => void
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.recognition = null;
    this.isListening = false;
    this.enabled = false;

    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceControls] Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
      console.log(`[VoiceControls] Heard: "${transcript}"`);
      this._parseCommand(transcript);
    };

    this.recognition.onerror = (err) => {
      console.warn('[VoiceControls] Speech recognition error:', err.error);
    };

    this.recognition.onend = () => {
      if (this.enabled && this.isListening) {
        try { this.recognition.start(); } catch (e) {}
      }
    };
  }

  _parseCommand(phrase) {
    if (phrase.includes('scramble')) {
      this.callbacks.onScramble?.();
      return;
    }
    if (phrase.includes('reset') || phrase.includes('clear')) {
      this.callbacks.onReset?.();
      return;
    }
    if (phrase.includes('undo')) {
      this.callbacks.onUndo?.();
      return;
    }
    if (phrase.includes('solve')) {
      this.callbacks.onSolve?.();
      return;
    }

    // Direct move mapping
    if (phrase.includes('right prime') || phrase.includes('right inverted')) this.callbacks.onMove?.("R'");
    else if (phrase.includes('right')) this.callbacks.onMove?.('R');
    else if (phrase.includes('left prime') || phrase.includes('left inverted')) this.callbacks.onMove?.("L'");
    else if (phrase.includes('left')) this.callbacks.onMove?.('L');
    else if (phrase.includes('up prime') || phrase.includes('top prime')) this.callbacks.onMove?.("U'");
    else if (phrase.includes('up') || phrase.includes('top')) this.callbacks.onMove?.('U');
    else if (phrase.includes('down prime') || phrase.includes('bottom prime')) this.callbacks.onMove?.("D'");
    else if (phrase.includes('down') || phrase.includes('bottom')) this.callbacks.onMove?.('D');
    else if (phrase.includes('front prime')) this.callbacks.onMove?.("F'");
    else if (phrase.includes('front')) this.callbacks.onMove?.('F');
    else if (phrase.includes('back prime')) this.callbacks.onMove?.("B'");
    else if (phrase.includes('back')) this.callbacks.onMove?.('B');
  }

  start() {
    if (!this.recognition) return false;
    this.enabled = true;
    this.isListening = true;
    try {
      this.recognition.start();
      this.callbacks.onStatusChange?.(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  stop() {
    this.enabled = false;
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.callbacks.onStatusChange?.(false);
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
    return this.isListening;
  }
}
