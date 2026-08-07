// Web Audio API Procedural Sound Synthesizer for Mechanical CDU Switches

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playKeyClick(isExec = false) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    // 1. High tactile snap click
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = isExec ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(isExec ? 880 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(isExec ? 440 : 100, now + 0.02);

    gain.gain.setValueAtTime(isExec ? 0.25 : 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.03);

    // 2. Low mechanical key body thup
    const bodyOsc = this.audioCtx.createOscillator();
    const bodyGain = this.audioCtx.createGain();

    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(180, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    bodyGain.gain.setValueAtTime(0.2, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.audioCtx.destination);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.045);
  }

  playExecChime() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}

export const soundEngine = new SoundEngine();
