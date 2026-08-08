// Web Audio API Sound Engine: Independent Volume Controls for Cockpit Cabin Hum & ATC Radio Chatter

const CALLSIGNS = [
  "Aero 4 1 2", "United 9 5 4", "Delta 8 1 9", "American 3 0 7",
  "Air Canada 7 4 2", "FedEx 1 1 4 Heavy", "Speedbird 1 1 7",
  "Lufthansa 4 5 0", "KLM 6 8 2", "Qantas 1 2", "Cathay 8 3 1",
  "Emirates 2 0 1 Heavy", "Southwest 1 4 9 2", "Alaska 5 3 0",
  "Cessna November 4 2 2 Bravo", "Skyhawk 9 1 Charlie", "Cherokee 3 8 Kilo",
  "CargoJet 9 0 4 Heavy", "Air Force One", "Navy Alpha-Foxtrot 7 1"
];

const FACILITIES = [
  "Kennedy Tower", "Boston Center", "Seattle Approach",
  "Chicago O'Hare Tower", "Heathrow Control", "Tokyo Radar",
  "Atlanta Center", "Frankfurt Radar", "Sydney Departure",
  "LaGuardia Ground", "Hong Kong Tower", "Anchorage Center",
  "San Francisco Tower", "Paris Control", "Dubai Departure"
];

const RUNWAYS = [
  "2 2 Right", "2 8 Left", "0 4 Right", "1 8 Left",
  "3 6 Right", "0 9 Left", "2 7 Right", "1 3 Center", "3 1 Left"
];

const HEADINGS = [
  "0 4 0", "0 9 0", "1 4 0", "1 8 0", "2 1 0", "2 7 0", "3 1 0", "3 6 0"
];

const FLIGHT_LEVELS = [
  "1 8 0", "2 4 0", "2 8 0", "3 2 0", "3 5 0", "3 7 0", "3 9 0", "4 1 0"
];

const ALTITUDES = [
  "2 thousand 5 hundred", "3 thousand", "4 thousand", "5 thousand",
  "8 thousand", "1 0 thousand", "1 2 thousand", "1 4 thousand"
];

const FREQUENCIES = [
  "1 2 4 point 7 5", "1 1 8 point 3", "1 3 3 point 4 5", "1 2 1 point 9",
  "1 2 8 point 1 5", "1 1 9 point 7", "1 3 4 point 0 5", "1 2 0 point 5"
];

const WAYPOINTS = [
  "KENNEDY", "BEXOS", "NAROW", "MERIT", "ROD32", "PAXTON", "SOLBERG", "GREKI"
];

const SQUAWKS = [
  "4 7 1 2", "2 1 0 5", "7 0 0 0", "1 2 0 0", "5 3 4 1", "3 6 2 0"
];

const ATIS_LETTERS = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India"
];

const AIRCRAFT_TYPES = [
  "Boeing 7 3 7", "Airbus A 3 2 0", "Boeing 7 7 7 Heavy",
  "Airbus A 3 5 0", "Embraer 1 9 0", "Bombardier CRJ 9 hundred"
];

const ALIEN_PHRASES = [
  "Tower, Aero 7 3 7, we have an unidentified contact 12 o'clock high, velocity Mach 1 4, no transponder.",
  "Center, radar contact moving across sector 4 at flight level 8 0 0, trajectory non-ballistic.",
  "Unknown contact, state your callsign and intention on 1 2 1 point 5.",
  "Approach, Skyhawk 9 1 Charlie, we have a fast moving glowing contact orbiting 3 miles north of the field."
];

const EMERGENCY_PHRASES = [
  "MAYDAY MAYDAY MAYDAY, Aero 4 1 2, engine failure number 2, requesting immediate vector back to the field!",
  "PAN-PAN PAN-PAN PAN-PAN, Delta 8 1 9, hydraulic pressure loss, requesting priority handling.",
  "Aero 4 1 2, Mayday acknowledged, turn heading 0 9 0, cleared ILS approach runway 2 2 Right, crash rescue dispatched.",
  "PAN-PAN, FedEx 1 1 4 Heavy, bird strike on departure, requesting immediate altitude hold at 4 thousand.",
  "MAYDAY MAYDAY MAYDAY, Speedbird 1 1 7, cabin depressurization, emergency descent to 1 0 thousand, turning left heading 1 8 0!"
];

const FUNNY_PHRASES = [
  {
    speaker1: "Center, Aspen 2 0, request ground speed readout.",
    speaker2: "Aspen 2 0, Boston Center, showing you at 1 thousand 9 hundred 42 knots across the ground.",
    isPilotFirst: true
  },
  {
    speaker1: "Meow.",
    speaker2: "Aircraft meowing on 1 2 1 point 5, yer on Guard! Keep it off the emergency frequency!",
    isPilotFirst: true
  },
  {
    speaker1: "Approach, Aero 4 1 2, requesting priority descent to 3 thousand.",
    speaker2: "Aero 4 1 2, say reason for priority descent?",
    isPilotFirst: true
  },
  {
    speaker1: "Speedbird 1 1 7, hold short runway 2 2 Right, airport operations is currently chasing a goat off the centerline.",
    speaker2: "Holding short 2 2 Right, Speedbird 1 1 7. Advise if the goat has right of way.",
    isPilotFirst: false
  },
  {
    speaker1: "Tower, Skyhawk 9 1 Charlie, I am somewhere near a big lake and a red barn, requesting vector to anywhere with pizza.",
    speaker2: "Skyhawk 9 1 Charlie, radar contact 5 miles north of the barn, turn heading 1 8 0 for runway 2 8.",
    isPilotFirst: true
  },
  {
    speaker1: "Tower, check frequency, someone left their microphone keyed while heavy snoring.",
    speaker2: "Attention aircraft broadcasting on 1 2 4 point 7 5, check your mic button, heavy snoring on frequency!",
    isPilotFirst: true
  },
  {
    speaker1: "All aircraft sector 4, be advised, fast moving contact at flight level 6 0 0, 9-reindeer power, red nose beacon.",
    speaker2: "Roger Center, tell him we left cookies in the flight deck.",
    isPilotFirst: false
  }
];

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGainNode = null;
    this.muted = false;
    this.activeHtmlAudio = new Set();

    // Cabin Hum
    this.noisePlaying = false;
    this.resumeNoiseOnUnmute = false;
    this.noiseNode = null;
    this.gainNode = null;
    this.filterNode = null;
    this.cabinVolume = 0.25; // 0.0 to 1.0

    // ATC Radio Engine
    this.chatterActive = false;
    this.resumeChatterOnUnmute = false;
    this.chatterFrequency = 2; // 1: LOW, 2: MED, 3: HIGH, 4: RAPID
    this.chatterTimer = null;
    this.chatterGeneration = 0;
    this.currentStaticSource = null;
    this.currentStaticGain = null;
    this.currentStaticFilter = null;
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

    // TTS Engine Config & Voice Rolepools
    this.ttsProvider = 'PIPER'; // 'PIPER' or 'WEBSPEECH'
    this.controllerVoice = 'en_GB-vctk-medium';
    this.pilotVoices = [
      'en_GB-alan-medium',
      'en_US-arctic-medium',
      'en_US-danny-low',
      'en_US-l2arctic-medium'
    ];
    this.currentVoiceNode = null;
    this.currentVoiceOwner = null;
    this.isTransmitting = false;
    this.isPanicActive = false;
    this.panicGeneration = 0;
    this.panicAlarmInterval = null;
    this.resumePanicOnUnmute = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && !this.masterGainNode) {
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.muted ? 0 : 1, this.audioCtx.currentTime);
      this.masterGainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  getOutputNode() {
    return this.masterGainNode || this.audioCtx?.destination;
  }

  setMasterGain() {
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(this.muted ? 0 : 1, this.audioCtx.currentTime);
    }
  }

  stopActiveHtmlAudio() {
    for (const audio of this.activeHtmlAudio) {
      try {
        audio.muted = true;
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
      this.activeHtmlAudio.delete(audio);
    }
  }

  stopActiveVoiceTransmission(owner = null) {
    if (!this.currentVoiceNode || (owner && this.currentVoiceOwner !== owner)) return;
    try { this.currentVoiceNode.stop(); } catch (e) {}
    try { this.currentVoiceNode.disconnect(); } catch (e) {}
    this.currentVoiceNode = null;
    this.currentVoiceOwner = null;
  }

  isChatterSessionActive(sessionId) {
    return sessionId === this.chatterGeneration && this.chatterActive && !this.muted && !this.isPanicActive;
  }

  isPanicSessionActive(sessionId) {
    return sessionId === this.panicGeneration && this.isPanicActive;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.setMasterGain();
    if (this.muted) {
      this.resumeNoiseOnUnmute = this.noisePlaying;
      this.resumeChatterOnUnmute = this.chatterActive;
      this.resumePanicOnUnmute = this.isPanicActive;
      if (this.noisePlaying) this.stopCockpitNoise(true);
      if (this.chatterActive) this.stopATCChatter(true);
      if (this.isPanicActive) this.stopPanicEmergencySequence(true);
      this.stopActiveHtmlAudio();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      const resumeNoise = this.resumeNoiseOnUnmute;
      const resumeChatter = this.resumeChatterOnUnmute;
      const resumePanic = this.resumePanicOnUnmute;
      this.resumeNoiseOnUnmute = false;
      this.resumeChatterOnUnmute = false;
      this.resumePanicOnUnmute = false;
      if (resumeNoise) this.startCockpitNoise();
      if (resumeChatter) this.startATCChatter();
      if (resumePanic) this.playPanicEmergencySequence();
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
    for (const audio of this.activeHtmlAudio) {
      audio.volume = this.atcVolume;
    }
  }

  // Aviation VHF Push-To-Talk (PTT) Mic Squelch Click (Disabled per user preference)
  playPTTClick(isStart = true) {
    return;
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
    gain.connect(this.getOutputNode());

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
    gain.connect(this.getOutputNode());

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
    gain.connect(this.getOutputNode());

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  }

  // Procedural Cockpit Cabin White Noise
  toggleCockpitNoise() {
    if (this.muted) return false;
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
    if (this.muted || !this.audioCtx || this.noisePlaying) return;

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
    this.gainNode.connect(this.getOutputNode());

    whiteNoise.start();
    this.noiseNode = whiteNoise;
    this.noisePlaying = true;
  }

  stopCockpitNoise(preserveForUnmute = false) {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    try { this.filterNode?.disconnect(); } catch (e) {}
    try { this.gainNode?.disconnect(); } catch (e) {}
    this.filterNode = null;
    this.gainNode = null;
    this.noisePlaying = false;
    if (!preserveForUnmute) this.resumeNoiseOnUnmute = false;
  }

  // Dynamic ATC Transmission Engine
  toggleATCChatter() {
    if (this.muted) return false;
    if (this.chatterActive) {
      this.stopATCChatter();
      return false;
    } else {
      this.startATCChatter();
      return true;
    }
  }

  startATCChatter() {
    if (this.muted || this.chatterActive) return;
    this.init();
    this.chatterActive = true;
    const sessionId = ++this.chatterGeneration;
    this.runTransmissionCycle(sessionId);
  }

  stopATCChatter(preserveForUnmute = false) {
    this.chatterGeneration += 1;
    this.chatterActive = false;
    this.isTransmitting = false;
    if (this.chatterTimer) {
      clearTimeout(this.chatterTimer);
      this.chatterTimer = null;
    }
    this.stopActiveTransmissionStatic();
    this.stopActiveVoiceTransmission('CHATTER');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (!preserveForUnmute) this.resumeChatterOnUnmute = false;
  }

  setATCChatterFrequency(level) {
    this.chatterFrequency = level;
    if (this.chatterActive && !this.isTransmitting) {
      if (this.chatterTimer) {
        clearTimeout(this.chatterTimer);
        this.chatterTimer = null;
      }
      this.runTransmissionCycle(this.chatterGeneration);
    }
  }

  async runTransmissionCycle(sessionId = this.chatterGeneration) {
    if (!this.isChatterSessionActive(sessionId) || this.isTransmitting) return;

    this.isTransmitting = true;
    try {
      await this.generateAndPlayDynamicTransmission(sessionId);
    } catch (err) {
      // Ignore transmission error and proceed to next cycle
    } finally {
      if (sessionId === this.chatterGeneration) this.isTransmitting = false;
    }

    if (!this.isChatterSessionActive(sessionId)) return;

    // Calculate silence gap AFTER previous transmission completes
    let minGap = 5000;
    let maxGap = 10000;

    switch (this.chatterFrequency) {
      case 1: // LOW (12s - 22s silent gap)
        minGap = 12000;
        maxGap = 22000;
        break;
      case 2: // MED (5s - 10s silent gap)
        minGap = 5000;
        maxGap = 10000;
        break;
      case 3: // HIGH (2s - 5s silent gap)
        minGap = 2000;
        maxGap = 5000;
        break;
      case 4: // RAPID (0.5s - 2s silent gap)
        minGap = 500;
        maxGap = 2000;
        break;
      default:
        minGap = 5000;
        maxGap = 10000;
        break;
    }

    const gap = Math.floor(Math.random() * (maxGap - minGap)) + minGap;
    this.chatterTimer = setTimeout(() => {
      if (sessionId !== this.chatterGeneration) return;
      this.chatterTimer = null;
      this.runTransmissionCycle(sessionId);
    }, gap);
  }

  stopActiveTransmissionStatic() {
    const source = this.currentStaticSource;
    const gain = this.currentStaticGain;
    const filter = this.currentStaticFilter;
    if (!source) return;

    this.currentStaticSource = null;
    this.currentStaticGain = null;
    this.currentStaticFilter = null;

    try {
      if (gain && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      }
      setTimeout(() => {
        try { source.stop(); } catch (e) {}
        try { source.disconnect(); } catch (e) {}
        try { filter?.disconnect(); } catch (e) {}
        try { gain?.disconnect(); } catch (e) {}
      }, 60);
    } catch (e) {
      try { source.disconnect(); } catch (ignored) {}
      try { filter?.disconnect(); } catch (ignored) {}
      try { gain?.disconnect(); } catch (ignored) {}
    }
  }

  // Generate 2-way paired aviation dialogue (Controller instruction + Pilot readback)
  generateDynamicPhrase() {
    const rand = Math.random();

    if (rand < 0.03) {
      return {
        type: 'ALIEN',
        isDialogue: false,
        text: ALIEN_PHRASES[Math.floor(Math.random() * ALIEN_PHRASES.length)],
        voice: this.controllerVoice
      };
    }

    if (rand < 0.07) {
      return {
        type: 'EMERGENCY',
        isDialogue: false,
        text: EMERGENCY_PHRASES[Math.floor(Math.random() * EMERGENCY_PHRASES.length)],
        voice: this.pilotVoices[Math.floor(Math.random() * this.pilotVoices.length)]
      };
    }

    if (rand < 0.12) {
      const funnyObj = FUNNY_PHRASES[Math.floor(Math.random() * FUNNY_PHRASES.length)];
      const pilotVoice = this.pilotVoices[Math.floor(Math.random() * this.pilotVoices.length)];
      return {
        type: 'NORMAL',
        isDialogue: true,
        firstSpeaker: {
          text: funnyObj.speaker1,
          voice: funnyObj.isPilotFirst ? pilotVoice : this.controllerVoice
        },
        secondSpeaker: {
          text: funnyObj.speaker2,
          voice: funnyObj.isPilotFirst ? this.controllerVoice : pilotVoice
        }
      };
    }

    const callsign = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)];
    const facility = FACILITIES[Math.floor(Math.random() * FACILITIES.length)];
    const runway = RUNWAYS[Math.floor(Math.random() * RUNWAYS.length)];
    const heading = HEADINGS[Math.floor(Math.random() * HEADINGS.length)];
    const flightLevel = FLIGHT_LEVELS[Math.floor(Math.random() * FLIGHT_LEVELS.length)];
    const altitude = ALTITUDES[Math.floor(Math.random() * ALTITUDES.length)];
    const freq = FREQUENCIES[Math.floor(Math.random() * FREQUENCIES.length)];
    const waypoint = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)];
    const squawk = SQUAWKS[Math.floor(Math.random() * SQUAWKS.length)];
    const atis = ATIS_LETTERS[Math.floor(Math.random() * ATIS_LETTERS.length)];
    const aircraft = AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];

    // Controller always uses en_GB-vctk-medium
    const controllerVoice = this.controllerVoice;
    // Pilot uses one of the remaining voices (alan, arctic, danny, l2arctic)
    const pilotVoice = this.pilotVoices[Math.floor(Math.random() * this.pilotVoices.length)];

    // Randomly select dialogue initiation direction (Controller-initiated vs Pilot-initiated)
    const initiatedBy = Math.random() > 0.45 ? 'CONTROLLER' : 'PILOT';
    const conditionType = Math.floor(Math.random() * 12);
    let speaker1Text = '';
    let speaker2Text = '';
    let speaker1Voice = '';
    let speaker2Voice = '';

    if (initiatedBy === 'CONTROLLER') {
      speaker1Voice = controllerVoice;
      speaker2Voice = pilotVoice;
      switch (conditionType) {
        case 0:
          speaker1Text = `${callsign}, ${facility}, wind 2 4 0 at 1 4 knots gusting 2 2, cleared for takeoff runway ${runway}.`;
          speaker2Text = `Cleared for takeoff runway ${runway}, ${callsign}.`;
          break;
        case 1:
          speaker1Text = `${callsign}, turn left heading ${heading}, climb and maintain flight level ${flightLevel}.`;
          speaker2Text = `Left heading ${heading}, climb and maintain flight level ${flightLevel}, ${callsign}.`;
          break;
        case 2:
          speaker1Text = `${callsign}, cleared ILS approach runway ${runway}, report 4-mile final.`;
          speaker2Text = `Cleared ILS approach runway ${runway}, wilco, ${callsign}.`;
          break;
        case 3:
          speaker1Text = `${callsign}, traffic 1 2 o'clock, 5 miles, opposite direction, ${aircraft} at ${altitude}.`;
          speaker2Text = `Traffic in sight, ${callsign}.`;
          break;
        case 4:
          speaker1Text = `${callsign}, pushback and engine start approved, face south, advise ready to taxi.`;
          speaker2Text = `Pushback and start approved, facing south, ${callsign}.`;
          break;
        case 5:
          speaker1Text = `${callsign}, taxi to runway ${runway} via Alpha, Bravo, hold short ${runway}.`;
          speaker2Text = `Taxi to ${runway} via Alpha, Bravo, hold short ${runway}, ${callsign}.`;
          break;
        case 6:
          speaker1Text = `${callsign}, direct to ${waypoint}, resume own navigation, maintain flight level ${flightLevel}.`;
          speaker2Text = `Direct ${waypoint}, climbing flight level ${flightLevel}, ${callsign}.`;
          break;
        case 7:
          speaker1Text = `${callsign}, squawk ${squawk}, radar contact 2 0 miles southwest of ${waypoint}.`;
          speaker2Text = `Squawking ${squawk}, ${callsign}.`;
          break;
        case 8:
          speaker1Text = `${callsign}, Information ${atis} is current, expect visual approach runway ${runway}.`;
          speaker2Text = `Wilco, Information ${atis}, ${callsign}.`;
          break;
        case 9:
          speaker1Text = `${callsign}, slow to 2 1 0 knots for traffic sequencing.`;
          speaker2Text = `Slowing to 2 1 0 knots, ${callsign}.`;
          break;
        case 10:
          speaker1Text = `${callsign}, Go around! Windshear alert, climb heading ${heading}, maintain ${altitude}.`;
          speaker2Text = `Going around, climbing heading ${heading} to ${altitude}, ${callsign}!`;
          break;
        case 11:
        default:
          speaker1Text = `${callsign}, contact ${facility} on ${freq}, good day.`;
          speaker2Text = `Contact ${facility} on ${freq}, good day, ${callsign}.`;
          break;
      }
    } else {
      // Pilot-initiated communications (Pilot -> Controller)
      speaker1Voice = pilotVoice;
      speaker2Voice = controllerVoice;
      switch (conditionType) {
        case 0:
          speaker1Text = `${facility}, ${callsign}, gate 1 4, with Information ${atis}, request pushback and engine start.`;
          speaker2Text = `${callsign}, ${facility}, pushback and engine start approved, face south.`;
          break;
        case 1:
          speaker1Text = `${facility}, ${callsign}, request flight level ${flightLevel}.`;
          speaker2Text = `${callsign}, ${facility}, climb and maintain flight level ${flightLevel}.`;
          break;
        case 2:
          speaker1Text = `${facility}, ${callsign}, 1 2 miles out, with Information ${atis}, field in sight.`;
          speaker2Text = `${callsign}, cleared visual approach runway ${runway}, contact tower on 1 1 8 point 3.`;
          break;
        case 3:
          speaker1Text = `${facility}, ${callsign}, moderate turbulence reported at flight level ${flightLevel}.`;
          speaker2Text = `${callsign}, roger, maintain flight level ${flightLevel}, report clear of turbulence.`;
          break;
        case 4:
          speaker1Text = `${facility}, ${callsign}, request direct to ${waypoint}.`;
          speaker2Text = `${callsign}, direct ${waypoint}, resume own navigation.`;
          break;
        case 5:
          speaker1Text = `${facility}, ${callsign}, 4-mile final runway ${runway}.`;
          speaker2Text = `${callsign}, ${facility}, wind 2 7 0 at 1 2 knots, cleared to land runway ${runway}.`;
          break;
        case 6:
          speaker1Text = `${facility}, ${callsign}, ready for departure runway ${runway}.`;
          speaker2Text = `${callsign}, ${facility}, hold short runway ${runway}, traffic on 2-mile final.`;
          break;
        case 7:
          speaker1Text = `${facility}, ${callsign}, passing 5 thousand for flight level 2 4 0.`;
          speaker2Text = `${callsign}, ${facility}, radar contact, climb and maintain flight level 2 4 0.`;
          break;
        case 8:
          speaker1Text = `${facility}, ${callsign}, request deviation 1 0 miles right of track for weather.`;
          speaker2Text = `${callsign}, deviation right of track approved, advise when clear of weather.`;
          break;
        case 9:
          speaker1Text = `${facility}, ${callsign}, established ILS runway ${runway}.`;
          speaker2Text = `${callsign}, ${facility}, wind 2 4 0 at 1 0 knots, cleared to land runway ${runway}.`;
          break;
        case 10:
          speaker1Text = `${facility}, ${callsign}, requesting higher altitude if available.`;
          speaker2Text = `${callsign}, climb and maintain flight level 3 9 0.`;
          break;
        case 11:
        default:
          speaker1Text = `${facility}, ${callsign}, checking in at ${altitude}.`;
          speaker2Text = `${callsign}, ${facility}, roger, altimeter 2 9 point 9 2.`;
          break;
      }
    }

    return {
      type: 'NORMAL',
      isDialogue: true,
      firstSpeaker: { text: speaker1Text, voice: speaker1Voice },
      secondSpeaker: { text: speaker2Text, voice: speaker2Voice }
    };
  }

  setTTSProvider(provider) {
    if (provider === 'PIPER' || provider === 'WEBSPEECH') {
      this.ttsProvider = provider;
    }
  }

  async fetchPiperAudioBuffer(text, voiceName) {
    const url = `/api/tts/generate?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voiceName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    if (!this.audioCtx) return null;
    return await this.audioCtx.decodeAudioData(arrayBuffer);
  }

  playAudioBufferWithRadioFX(audioBuffer, transmissionType = 'NORMAL', owner = null, sessionId = null) {
    return new Promise((resolve) => {
      const sessionActive = owner === 'CHATTER'
        ? this.isChatterSessionActive(sessionId)
        : owner === 'PANIC'
          ? this.isPanicSessionActive(sessionId) && !this.muted
          : !this.muted && (this.chatterActive || this.isPanicActive);
      if (!this.audioCtx || !sessionActive || !audioBuffer) return resolve();

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const bandpass = this.audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';

      if (transmissionType === 'ALIEN') {
        bandpass.frequency.setValueAtTime(2400, this.audioCtx.currentTime);
        bandpass.Q.setValueAtTime(5.0, this.audioCtx.currentTime);
      } else {
        bandpass.frequency.setValueAtTime(1600, this.audioCtx.currentTime);
        bandpass.Q.setValueAtTime(2.5, this.audioCtx.currentTime);
      }

      const voiceGain = this.audioCtx.createGain();
      voiceGain.gain.setValueAtTime(this.atcVolume * 1.2, this.audioCtx.currentTime);

      source.connect(bandpass);
      bandpass.connect(voiceGain);
      voiceGain.connect(this.getOutputNode());

      this.currentVoiceNode = source;
      this.currentVoiceOwner = owner;

      source.onended = () => {
        if (this.currentVoiceNode === source) {
          this.currentVoiceNode = null;
          this.currentVoiceOwner = null;
        }
        try { source.disconnect(); } catch (e) {}
        try { bandpass.disconnect(); } catch (e) {}
        try { voiceGain.disconnect(); } catch (e) {}
        resolve();
      };

      source.start();
    });
  }

  // Independent, randomized static burst per speaker
  startSpeakerStatic(transmissionType = 'NORMAL') {
    this.stopActiveTransmissionStatic();
    if (!this.audioCtx || this.muted || (!this.chatterActive && !this.isPanicActive)) return;

    const now = this.audioCtx.currentTime;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * 5.0);
    const staticBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const sData = staticBuffer.getChannelData(0);

    // Random soft static & crackle profile for this specific speaker
    const baseNoiseLevel = 0.04 + Math.random() * 0.08;
    const crackleLevel = 0.12 + Math.random() * 0.16;

    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() > 0.975 ? (Math.random() * 2 - 1) * crackleLevel : 0;
      sData[i] = (Math.random() * 2 - 1) * baseNoiseLevel + crackle;
    }

    this.currentStaticSource = this.audioCtx.createBufferSource();
    this.currentStaticSource.buffer = staticBuffer;
    this.currentStaticSource.loop = true;

    const bandpass = this.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    this.currentStaticFilter = bandpass;

    if (transmissionType === 'ALIEN') {
      bandpass.frequency.setValueAtTime(2400, now);
      bandpass.frequency.exponentialRampToValueAtTime(800, now + 2.0);
      bandpass.Q.setValueAtTime(6.0, now);
    } else {
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(3.0, now);
    }

    this.currentStaticGain = this.audioCtx.createGain();
    // Soft, randomized radio static level (0.06 to 0.18 * atcVolume)
    const randomStaticVol = (0.06 + Math.random() * 0.12) * this.atcVolume;
    this.currentStaticGain.gain.setValueAtTime(0.001, now);
    this.currentStaticGain.gain.linearRampToValueAtTime(randomStaticVol, now + 0.04);

    this.currentStaticSource.connect(bandpass);
    bandpass.connect(this.currentStaticGain);
    this.currentStaticGain.connect(this.getOutputNode());

    this.currentStaticSource.start(now);
  }

  async playSingleUtterance(text, voiceName, transmissionType = 'NORMAL', sessionId) {
    const isActive = () => this.isChatterSessionActive(sessionId);
    if (!isActive()) return;
    this.playPTTClick(true);
    this.startSpeakerStatic(transmissionType);
    try {
      if (this.ttsProvider === 'PIPER') {
        const audioBuffer = await this.fetchPiperAudioBuffer(text, voiceName);
        if (isActive()) await this.playAudioBufferWithRadioFX(audioBuffer, transmissionType, 'CHATTER', sessionId);
      } else {
        await this.playWebSpeech(text, transmissionType, 'CHATTER', sessionId);
      }
    } catch (err) {
      if (isActive()) await this.playWebSpeech(text, transmissionType, 'CHATTER', sessionId);
    } finally {
      this.playPTTClick(false);
      this.stopActiveTransmissionStatic();
    }
  }

  async playDialogueSequence(transmission, sessionId) {
    const isActive = () => this.isChatterSessionActive(sessionId);
    if (!isActive()) return;
    // 1. First Transmission (Independent static burst for Speaker 1)
    this.playPTTClick(true);
    this.startSpeakerStatic('NORMAL');
    try {
      if (this.ttsProvider === 'PIPER') {
        const firstBuf = await this.fetchPiperAudioBuffer(transmission.firstSpeaker.text, transmission.firstSpeaker.voice);
        if (isActive()) await this.playAudioBufferWithRadioFX(firstBuf, 'NORMAL', 'CHATTER', sessionId);
      } else {
        await this.playWebSpeech(transmission.firstSpeaker.text, 'NORMAL', 'CHATTER', sessionId);
      }
    } catch (e) {
      if (isActive()) await this.playWebSpeech(transmission.firstSpeaker.text, 'NORMAL', 'CHATTER', sessionId);
    }
    this.playPTTClick(false);
    // Stop static immediately when Speaker 1 finishes
    this.stopActiveTransmissionStatic();

    if (!isActive()) return;

    // Inter-speaker pause (1.0s to 5.0s) - Complete radio silence / cabin hum
    const pauseMs = 1000 + Math.floor(Math.random() * 4000);
    await new Promise(r => setTimeout(r, pauseMs));

    if (!isActive()) return;

    // 2. Second Transmission (Independent static burst for Speaker 2)
    this.playPTTClick(true);
    this.startSpeakerStatic('NORMAL');
    try {
      if (this.ttsProvider === 'PIPER') {
        const secondBuf = await this.fetchPiperAudioBuffer(transmission.secondSpeaker.text, transmission.secondSpeaker.voice);
        if (isActive()) await this.playAudioBufferWithRadioFX(secondBuf, 'NORMAL', 'CHATTER', sessionId);
      } else {
        await this.playWebSpeech(transmission.secondSpeaker.text, 'NORMAL', 'CHATTER', sessionId);
      }
    } catch (e) {
      if (isActive()) await this.playWebSpeech(transmission.secondSpeaker.text, 'NORMAL', 'CHATTER', sessionId);
    }
    this.playPTTClick(false);
    // Stop static immediately when Speaker 2 finishes
    this.stopActiveTransmissionStatic();
  }

  playWebSpeech(text, transmissionType, owner = null, sessionId = null) {
    return new Promise((resolve) => {
      const sessionActive = owner === 'CHATTER'
        ? this.isChatterSessionActive(sessionId)
        : owner === 'PANIC'
          ? this.isPanicSessionActive(sessionId) && !this.muted
          : !this.muted;
      if (!sessionActive) {
        resolve();
        return;
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = transmissionType === 'EMERGENCY' ? 1.35 : (1.2 + Math.random() * 0.2);
        utterance.pitch = transmissionType === 'ALIEN' ? 0.55 : (0.75 + Math.random() * 0.3);
        utterance.volume = this.atcVolume;

        if (this.voices.length > 0) {
          const englishVoices = this.voices.filter(v => v.lang.includes('en'));
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
          }
        }

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = () => {
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }

  async generateAndPlayDynamicTransmission(sessionId) {
    if (!this.isChatterSessionActive(sessionId)) return;
    this.init();

    const transmission = this.generateDynamicPhrase();

    if (transmission.type === 'EMERGENCY') {
      this.playEmergencyChime();
    }

    if (transmission.isDialogue) {
      await this.playDialogueSequence(transmission, sessionId);
    } else {
      await this.playSingleUtterance(transmission.text, transmission.voice, transmission.type, sessionId);
    }
  }
  // Helper method to play audio files from /sounds/ with Web Audio synth fallback
  playCockpitSound(soundPath, fallbackFn) {
    if (this.muted) return;
    this.init();

    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1.0, this.atcVolume));
    audio.muted = this.muted;
    this.activeHtmlAudio.add(audio);
    const cleanup = () => this.activeHtmlAudio.delete(audio);
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.play().catch(() => {
      cleanup();
      // Fallback to Web Audio synthesizer if file play is blocked
      if (fallbackFn && !this.muted) fallbackFn.call(this);
    });
  }

  playAltitudeChime() {
    this.playCockpitSound('/sounds/altitude_chime.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);
      gain.gain.setValueAtTime(this.atcVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.getOutputNode());
      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  playMasterCaution() {
    this.playCockpitSound('/sounds/master_caution.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      [0, 0.22].forEach((delay) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now + delay);
        gain.gain.setValueAtTime(this.atcVolume * 0.5, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
        osc.connect(gain);
        gain.connect(this.getOutputNode());
        osc.start(now + delay);
        osc.stop(now + delay + 0.35);
      });
    });
  }

  playTCASWarning() {
    this.playCockpitSound('/sounds/tcas_warning.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.25;
        const freq = i % 2 === 0 ? 1000 : 800;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(this.atcVolume * 0.6, now + delay);
        gain.gain.linearRampToValueAtTime(0.001, now + delay + 0.2);
        osc.connect(gain);
        gain.connect(this.getOutputNode());
        osc.start(now + delay);
        osc.stop(now + delay + 0.22);
      }
    });
  }

  playGearClunk() {
    this.playCockpitSound('/sounds/gear_clunk.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(this.atcVolume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.getOutputNode());
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  playTouchdownChirp() {
    this.playCockpitSound('/sounds/touchdown_chirp.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
      gain.gain.setValueAtTime(this.atcVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.getOutputNode());
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playOverspeedWarning() {
    this.playCockpitSound('/sounds/overspeed_warn.wav', () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(950, now);
      gain.gain.setValueAtTime(this.atcVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.getOutputNode());
      osc.start(now);
      osc.stop(now + 0.55);
    });
  }

  startPanicAlarmLoop() {
    if (this.panicAlarmInterval) clearInterval(this.panicAlarmInterval);
    this.playOverspeedWarning();
    this.panicAlarmInterval = setInterval(() => {
      if (this.isPanicActive && !this.muted) {
        this.playOverspeedWarning();
      } else {
        clearInterval(this.panicAlarmInterval);
        this.panicAlarmInterval = null;
      }
    }, 2200);
  }

  stopPanicAlarmLoop() {
    if (this.panicAlarmInterval) {
      clearInterval(this.panicAlarmInterval);
      this.panicAlarmInterval = null;
    }
  }

  async playPanicEmergencySequence() {
    if (this.isPanicActive) return;
    this.init();
    this.isPanicActive = true;
    const sessionId = ++this.panicGeneration;

    if (this.chatterActive) {
      this.chatterGeneration += 1;
      this.isTransmitting = false;
      if (this.chatterTimer) {
        clearTimeout(this.chatterTimer);
        this.chatterTimer = null;
      }
    }

    // Immediately stop ongoing background ambient speech or static to prevent overlap
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.stopActiveTransmissionStatic();
    this.stopActiveVoiceTransmission();

    // Start repeating emergency alert sound alarm loop
    this.startPanicAlarmLoop();

    const panicTurns = [
      { speaker: 'PILOT', text: "MAYDAY, MAYDAY, MAYDAY! Aero Flight 492, engine number 1 failure, experiencing severe vibration!", voice: "en_US-danny-low" },
      { speaker: 'ATC', text: "Aero 492, New York Center, MAYDAY acknowledged. Squawk 7700. Maintain current altitude if able, state intentions.", voice: "en_GB-vctk-medium" },
      { speaker: 'PILOT', text: "Squawking 7700, Aero 492. We are unable to maintain altitude, initiating emergency descent to 10,000 feet.", voice: "en_US-danny-low" },
      { speaker: 'ATC', text: "Aero 492, roger. Cleared emergency descent to 10,000 feet, heading 180, emergency equipment on standby.", voice: "en_GB-vctk-medium" },
      { speaker: 'PILOT', text: "Leaving FL350 for 10,000 feet, heading 180. Engine 1 secured, running emergency checklist, Aero 492.", voice: "en_US-danny-low" },
      { speaker: 'ATC', text: "Aero 492, JFK radar contact 25 miles north. Runway 22 Left is cleared for your arrival.", voice: "en_GB-vctk-medium" },
      { speaker: 'PILOT', text: "Request vector for ILS approach runway 22 Left. We have 142 souls on board and 4 hours fuel remaining, Aero 492.", voice: "en_US-danny-low" },
      { speaker: 'ATC', text: "Aero 492, turn left heading 140, vector for ILS 22 Left, altimeter 29.92. You are priority number 1.", voice: "en_GB-vctk-medium" },
      { speaker: 'PILOT', text: "Left heading 140, descending to 3,000 feet, Aero 492.", voice: "en_US-danny-low" },
      { speaker: 'ATC', text: "Aero 492, wind 210 at 12 knots. Emergency ground equipment in position, cleared to land runway 22 Left.", voice: "en_GB-vctk-medium" }
    ];

    for (let i = 0; i < panicTurns.length; i++) {
      if (!this.isPanicSessionActive(sessionId)) break;
      const turn = panicTurns[i];

      this.playPTTClick(true);
      this.startSpeakerStatic('NORMAL');

      try {
        if (this.ttsProvider === 'PIPER') {
          try {
            const audioBuf = await this.fetchPiperAudioBuffer(turn.text, turn.voice);
            if (audioBuf && this.isPanicSessionActive(sessionId) && !this.muted) {
              await this.playAudioBufferWithRadioFX(audioBuf, 'EMERGENCY', 'PANIC', sessionId);
            } else if (this.isPanicSessionActive(sessionId) && !this.muted) {
              await this.playWebSpeech(turn.text, 'EMERGENCY', 'PANIC', sessionId);
            }
          } catch (err) {
            if (this.isPanicSessionActive(sessionId) && !this.muted) {
              await this.playWebSpeech(turn.text, 'EMERGENCY', 'PANIC', sessionId);
            }
          }
        } else if (this.isPanicSessionActive(sessionId) && !this.muted) {
          await this.playWebSpeech(turn.text, 'EMERGENCY', 'PANIC', sessionId);
        }
      } catch (e) {
        console.error('[SoundEngine] Panic turn dialogue error:', e);
      }

      this.playPTTClick(false);
      this.stopActiveTransmissionStatic();

      if (!this.isPanicSessionActive(sessionId)) break;
      const pauseMs = 1000 + Math.floor(Math.random() * 800);
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }

  stopPanicEmergencySequence(preserveForUnmute = false) {
    this.panicGeneration += 1;
    this.isPanicActive = false;
    this.stopPanicAlarmLoop();
    this.stopActiveTransmissionStatic();
    this.stopActiveVoiceTransmission('PANIC');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (!preserveForUnmute) this.resumePanicOnUnmute = false;

    if (!preserveForUnmute && !this.muted && this.chatterActive) {
      this.isTransmitting = false;
      const sessionId = ++this.chatterGeneration;
      this.runTransmissionCycle(sessionId);
    }
  }
}

export const soundEngine = new SoundEngine();
