// Web Audio API Sound Engine: Independent Volume Controls for Cockpit Cabin Hum & ATC Radio Chatter

const CALLSIGNS = [
  "Aero 4 1 2", "United 9 5 4", "Delta 8 1 9", "American 3 0 7",
  "Air Canada 7 4 2", "FedEx 1 1 4 Heavy", "Speedbird 1 1 7",
  "Cessna November 4 2 2", "Skyhawk 9 1 Charlie"
];

const FACILITIES = [
  "Kennedy Tower", "Boston Center", "Seattle Approach",
  "Chicago O'Hare Tower", "Heathrow Control", "Tokyo Radar", "Departure"
];

const RUNWAYS = ["2 2 Right", "2 8 Left", "0 4 Right", "1 8 Left", "3 6 Right"];
const HEADINGS = ["0 9 0", "1 8 0", "2 1 0", "2 7 0", "3 6 0"];
const FLIGHT_LEVELS = ["2 4 0", "3 2 0", "3 5 0", "3 9 0"];
const ALTITUDES = ["3 thousand", "5 thousand", "8 thousand", "1 2 thousand"];
const FREQUENCIES = ["1 2 4 point 7 5", "1 1 8 point 3", "1 3 3 point 4 5", "1 2 1 point 9"];

const ALIEN_PHRASES = [
  "Tower, Aero 7 3 7, we have an unidentified contact 12 o'clock high, velocity Mach 1 4, no transponder.",
  "Center, radar contact moving across sector 4 at flight level 8 0 0, trajectory non-ballistic.",
  "Unknown contact, state your callsign and intention on 1 2 1 point 5."
];

const EMERGENCY_PHRASES = [
  "MAYDAY MAYDAY MAYDAY, Aero 4 1 2, engine failure number 2, requesting immediate vector back to the field!",
  "PAN-PAN PAN-PAN PAN-PAN, Delta 8 1 9, hydraulic pressure loss, requesting priority handling.",
  "Aero 4 1 2, Mayday acknowledged, turn heading 0 9 0, cleared ILS approach runway 2 2 Right, crash rescue dispatched."
];

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = false;

    // Cabin Hum
    this.noisePlaying = false;
    this.noiseNode = null;
    this.gainNode = null;
    this.filterNode = null;
    this.cabinVolume = 0.25; // 0.0 to 1.0

    // ATC Radio Engine
    this.chatterActive = false;
    this.chatterFrequency = 2; // 1: LOW, 2: MED, 3: HIGH, 4: RAPID
    this.chatterTimer = null;
    this.currentStaticSource = null;
    this.currentStaticGain = null;
    this.atcVolume = 0.35; // 0.0 to 1.0
    this.voices = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
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
    if (this.muted) {
      if (this.noisePlaying) this.stopCockpitNoise();
      if (this.chatterActive) this.stopATCChatter();
    }
    return this.muted;
  }

  setCabinVolume(val) {
    this.cabinVolume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.audioCtx && this.noisePlaying) {
      this.gainNode.gain.setValueAtTime(this.cabinVolume, this.audioCtx.currentTime);
    }
  }

  setATCVolume(val) {
    this.atcVolume = Math.max(0, Math.min(1, val));
    if (this.currentStaticGain && this.audioCtx) {
      this.currentStaticGain.gain.setValueAtTime(this.atcVolume * 0.7, this.audioCtx.currentTime);
    }
  }

  // Key Click Sound
  playKeyClick(isExec = false) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

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
  }

  playExecChime() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Master Caution Warning Chime (Emergency Trigger Sound)
  playEmergencyChime() {
    if (this.muted || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(800, now);
    osc2.frequency.setValueAtTime(960, now);

    gain.gain.setValueAtTime(0.3 * this.atcVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  }

  // Procedural Cockpit Cabin White Noise
  toggleCockpitNoise() {
    if (this.noisePlaying) {
      this.stopCockpitNoise();
      return false;
    } else {
      this.startCockpitNoise();
      return true;
    }
  }

  startCockpitNoise() {
    this.init();
    if (!this.audioCtx || this.noisePlaying) return;

    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(280, this.audioCtx.currentTime);
    this.filterNode.Q.setValueAtTime(1.5, this.audioCtx.currentTime);

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(this.cabinVolume, this.audioCtx.currentTime);

    whiteNoise.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    whiteNoise.start();
    this.noiseNode = whiteNoise;
    this.noisePlaying = true;
  }

  stopCockpitNoise() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    this.noisePlaying = false;
  }

  // Dynamic ATC Transmission Engine
  toggleATCChatter() {
    if (this.chatterActive) {
      this.stopATCChatter();
      return false;
    } else {
      this.startATCChatter();
      return true;
    }
  }

  startATCChatter() {
    this.init();
    this.chatterActive = true;
    this.scheduleNextTransmission();
  }

  stopATCChatter() {
    this.chatterActive = false;
    if (this.chatterTimer) {
      clearTimeout(this.chatterTimer);
      this.chatterTimer = null;
    }
    this.stopActiveTransmissionStatic();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  setATCChatterFrequency(level) {
    this.chatterFrequency = level;
    if (this.chatterActive && this.chatterTimer) {
      clearTimeout(this.chatterTimer);
      this.scheduleNextTransmission();
    }
  }

  scheduleNextTransmission() {
    if (!this.chatterActive) return;
    this.generateAndPlayDynamicTransmission();

    let minDelay = 7000;
    let maxDelay = 14000;

    switch (this.chatterFrequency) {
      case 1: // LOW (15s - 25s)
        minDelay = 15000;
        maxDelay = 25000;
        break;
      case 2: // MED (7s - 14s)
        minDelay = 7000;
        maxDelay = 14000;
        break;
      case 3: // HIGH (3s - 7s)
        minDelay = 3000;
        maxDelay = 7000;
        break;
      case 4: // RAPID (1s - 3s)
        minDelay = 1000;
        maxDelay = 3000;
        break;
      default:
        minDelay = 7000;
        maxDelay = 14000;
        break;
    }

    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    this.chatterTimer = setTimeout(() => {
      this.scheduleNextTransmission();
    }, delay);
  }

  stopActiveTransmissionStatic() {
    if (this.currentStaticSource) {
      try {
        if (this.currentStaticGain && this.audioCtx) {
          const now = this.audioCtx.currentTime;
          this.currentStaticGain.gain.setValueAtTime(this.currentStaticGain.gain.value, now);
          this.currentStaticGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        }
        setTimeout(() => {
          if (this.currentStaticSource) {
            try { this.currentStaticSource.stop(); this.currentStaticSource.disconnect(); } catch (e) {}
            this.currentStaticSource = null;
            this.currentStaticGain = null;
          }
        }, 60);
      } catch (e) {
        this.currentStaticSource = null;
        this.currentStaticGain = null;
      }
    }
  }

  // Generate phrase from 7 dynamic conditions
  generateDynamicPhrase() {
    const rand = Math.random();

    if (rand < 0.02) {
      return { type: 'ALIEN', text: ALIEN_PHRASES[Math.floor(Math.random() * ALIEN_PHRASES.length)] };
    }

    if (rand < 0.05) {
      return { type: 'EMERGENCY', text: EMERGENCY_PHRASES[Math.floor(Math.random() * EMERGENCY_PHRASES.length)] };
    }

    const callsign = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)];
    const facility = FACILITIES[Math.floor(Math.random() * FACILITIES.length)];
    const runway = RUNWAYS[Math.floor(Math.random() * RUNWAYS.length)];
    const heading = HEADINGS[Math.floor(Math.random() * HEADINGS.length)];
    const flightLevel = FLIGHT_LEVELS[Math.floor(Math.random() * FLIGHT_LEVELS.length)];
    const altitude = ALTITUDES[Math.floor(Math.random() * ALTITUDES.length)];
    const freq = FREQUENCIES[Math.floor(Math.random() * FREQUENCIES.length)];

    const conditionType = Math.floor(Math.random() * 5);
    let text = '';

    switch (conditionType) {
      case 0:
        text = `${callsign}, ${facility}, wind 2 4 0 at 1 4 knots, cleared for takeoff runway ${runway}.`;
        break;
      case 1:
        text = `${callsign}, turn left heading ${heading}, climb and maintain flight level ${flightLevel}, altimeter 2 9 point 9 2.`;
        break;
      case 2:
        text = `${callsign}, cleared ILS approach runway ${runway}, report 4-mile final.`;
        break;
      case 3:
        text = `${callsign}, traffic 1 2 o'clock, 5 miles, Boeing 7 3 7 at ${altitude}. Caution wake turbulence behind departing Heavy.`;
        break;
      case 4:
      default:
        text = `${callsign}, contact departure on ${freq}, good day.`;
        break;
    }

    return { type: 'NORMAL', text };
  }

  generateAndPlayDynamicTransmission() {
    if (this.muted || !this.chatterActive) return;
    this.init();

    const transmission = this.generateDynamicPhrase();

    if (transmission.type === 'EMERGENCY') {
      this.playEmergencyChime();
    }

    if (this.audioCtx) {
      this.stopActiveTransmissionStatic();
      const now = this.audioCtx.currentTime;
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 4.5);
      const staticBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const sData = staticBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const crackle = Math.random() > 0.96 ? (Math.random() * 2 - 1) * 0.7 : 0;
        sData[i] = (Math.random() * 2 - 1) * 0.28 + crackle;
      }

      this.currentStaticSource = this.audioCtx.createBufferSource();
      this.currentStaticSource.buffer = staticBuffer;
      this.currentStaticSource.loop = true;

      const bandpass = this.audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';

      if (transmission.type === 'ALIEN') {
        bandpass.frequency.setValueAtTime(2400, now);
        bandpass.frequency.exponentialRampToValueAtTime(800, now + 2.0);
        bandpass.Q.setValueAtTime(6.0, now);
      } else {
        bandpass.frequency.setValueAtTime(1400, now);
        bandpass.Q.setValueAtTime(3.2, now);
      }

      this.currentStaticGain = this.audioCtx.createGain();
      this.currentStaticGain.gain.setValueAtTime(0.001, now);
      this.currentStaticGain.gain.linearRampToValueAtTime(this.atcVolume * 0.7, now + 0.05);

      this.currentStaticSource.connect(bandpass);
      bandpass.connect(this.currentStaticGain);
      this.currentStaticGain.connect(this.audioCtx.destination);

      this.currentStaticSource.start(now);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(transmission.text);

      utterance.rate = transmission.type === 'EMERGENCY' ? 1.35 : (1.2 + Math.random() * 0.2);
      utterance.pitch = transmission.type === 'ALIEN' ? 0.55 : (0.75 + Math.random() * 0.3);
      utterance.volume = this.atcVolume;

      if (this.voices.length > 0) {
        const englishVoices = this.voices.filter(v => v.lang.includes('en'));
        if (englishVoices.length > 0) {
          utterance.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
        }
      }

      utterance.onend = () => {
        this.stopActiveTransmissionStatic();
      };

      utterance.onerror = () => {
        this.stopActiveTransmissionStatic();
      };

      window.speechSynthesis.speak(utterance);
    }
  }
}

export const soundEngine = new SoundEngine();
