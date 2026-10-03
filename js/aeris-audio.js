/**
 * AERIS — Atmospheric Procedural Web Audio Engine
 * Real-time synthesis for 4 natural soundscapes with zero external audio assets.
 * Pure Web Audio API: Ocean Waves, Rainforest Mist, Alpine Wind, Zen Singing Bowls.
 */

class AerisAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyzer = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.45;
    this.activeNodes = [];
    this.zenTimer = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyzer = this.ctx.createAnalyser();
      this.analyzer.fftSize = 128;
      this.analyzer.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyzer);
      this.analyzer.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.08);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  createPinkNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  stopCurrent() {
    if (this.zenTimer) {
      clearTimeout(this.zenTimer);
      this.zenTimer = null;
    }

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentTrack = null;
    this.isPlaying = false;
    document.body.removeAttribute('data-soundscape');
  }

  playTrack(trackKey) {
    this.init();

    // Toggle off if clicking the active track
    if (this.currentTrack === trackKey && this.isPlaying) {
      this.stopCurrent();
      return false;
    }

    this.stopCurrent();
    this.currentTrack = trackKey;
    this.isPlaying = true;

    // Apply visual atmosphere tint to the document
    document.body.setAttribute('data-soundscape', trackKey);

    const buffer = this.createPinkNoiseBuffer();

    if (trackKey === 'ocean') {
      this.synthesizeOcean(buffer);
    } else if (trackKey === 'rain') {
      this.synthesizeRain(buffer);
    } else if (trackKey === 'wind') {
      this.synthesizeWind(buffer);
    } else if (trackKey === 'zen') {
      this.synthesizeZenBowls();
    }

    return true;
  }

  synthesizeOcean(buffer) {
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    // Wave swell LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10 second wave swell

    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.setValueAtTime(450, this.ctx.currentTime);

    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
    lfo.start();

    this.activeNodes.push(src, lfo, lfoDepth, filter, gain);
  }

  synthesizeRain(buffer) {
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
    this.activeNodes.push(src, filter, gain);
  }

  synthesizeWind(buffer) {
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.2, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
    lfo.start();

    this.activeNodes.push(src, lfo, lfoGain, filter, gain);
  }

  synthesizeZenBowls() {
    // Warm harmonic drone
    const drone1 = this.ctx.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(196, this.ctx.currentTime); // G3

    const drone2 = this.ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.setValueAtTime(293.66, this.ctx.currentTime); // D4

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    drone1.connect(droneGain);
    drone2.connect(droneGain);
    droneGain.connect(this.masterGain);

    drone1.start();
    drone2.start();

    this.activeNodes.push(drone1, drone2, droneGain);

    // Random harmonic Tibetan chime strikes
    const strikeChime = () => {
      if (!this.isPlaying || this.currentTrack !== 'zen') return;
      const pitches = [587.33, 659.25, 880.00, 987.77, 1174.66];
      const pitch = pitches[Math.floor(Math.random() * pitches.length)];

      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      chimeGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start();
      chimeOsc.stop(this.ctx.currentTime + 3.9);

      this.zenTimer = setTimeout(strikeChime, 3200 + Math.random() * 4000);
    };

    strikeChime();
  }

  playUiTone(type = 'click') {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      const now = this.ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'reveal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (e) {}
  }
}

const aerisAudio = new AerisAudioEngine();
