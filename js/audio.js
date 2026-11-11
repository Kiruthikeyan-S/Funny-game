// ============================================================================
// THE CURSED KINGDOM — RETRO PIXEL SYNTH AUDIO ENGINE (Web Audio API)
// ============================================================================

const SoundFX = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  tone(freq, type, duration, vol = 0.14, slideTo = null) {
    if (!SaveSystem.data.settings.sfx) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },

  jump() {
    this.tone(240, "square", 0.14, 0.1, 520);
  },

  sword(comboStep = 1) {
    const base = 180 + comboStep * 65;
    this.tone(base, "sawtooth", 0.11, 0.14, 80);
  },

  block() {
    this.tone(420, "triangle", 0.1, 0.15, 220);
  },

  coin() {
    this.tone(880, "square", 0.08, 0.1);
    setTimeout(() => this.tone(1320, "square", 0.14, 0.1), 65);
  },

  hitEnemy() {
    this.tone(150, "square", 0.1, 0.15, 55);
  },

  hurtPlayer() {
    this.tone(190, "sawtooth", 0.22, 0.18, 45);
  },

  stonePower() {
    this.tone(220, "sawtooth", 0.45, 0.2, 880);
    setTimeout(() => this.tone(660, "square", 0.35, 0.16, 120), 120);
  },

  checkpoint() {
    [523, 659, 784].forEach((f, idx) => {
      setTimeout(() => this.tone(f, "triangle", 0.14, 0.12), idx * 75);
    });
  },

  victory() {
    [523, 659, 784, 1046].forEach((f, idx) => {
      setTimeout(() => this.tone(f, "square", 0.2, 0.13), idx * 110);
    });
  },

  defeat() {
    [330, 293, 246, 196].forEach((f, idx) => {
      setTimeout(() => this.tone(f, "sawtooth", 0.22, 0.14), idx * 120);
    });
  }
};
