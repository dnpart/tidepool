// Synthesized sound effects (Web Audio API, no files). Games call play(name) and never touch audio directly.
// Every sound is short (under 0.4s), soft and rounded: sine or triangle waves and filtered noise.

export type SoundName =
  | 'tap' | 'flip' | 'land' | 'invalid' | 'foundation' | 'win' | 'speedFast' | 'whoosh' | 'splash' | 'boop' | 'blub';

export const SOUND_NAMES: readonly SoundName[] = [
  'tap', 'flip', 'land', 'invalid', 'foundation', 'win', 'speedFast', 'whoosh', 'splash', 'boop', 'blub',
];

let enabled = true;
let volume = 60;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Master gain from the volume setting (0..100). */
export const masterGain = (vol: number): number => (vol / 100) * 0.3;

/** Sound plays only when the switch is on and volume is above 0. */
export const shouldPlay = (options: { sfx: boolean; volume: number }): boolean => options.sfx && options.volume > 0;

/** Keeps the sound module in step with Settings. */
export function configureSound(options: { sfx: boolean; volume: number }): void {
  enabled = options.sfx;
  volume = options.volume;
  if (master && ctx) master.gain.setValueAtTime(masterGain(volume), ctx.currentTime);
}

/** Creates (or wakes) the AudioContext. Browsers only allow this during a user gesture. */
export function unlockAudio(): { ctx: AudioContext; out: GainNode } | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = masterGain(volume);
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

// --- building blocks ---

type Wave = 'sine' | 'triangle';

interface ToneOptions {
  wave: Wave;
  freq: number;
  /** Glide to this frequency over `glide` seconds. */
  freqEnd?: number;
  glide?: number;
  start: number;
  /** Time until the fade-out ends. */
  dur: number;
  peak: number;
  attack?: number;
}

function tone(ac: BaseAudioContext, out: AudioNode, o: ToneOptions) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const attack = o.attack ?? 0.012;
  osc.type = o.wave;
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, o.start + (o.glide ?? o.dur));
  gain.gain.setValueAtTime(0.0001, o.start);
  gain.gain.exponentialRampToValueAtTime(o.peak, o.start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, o.start + o.dur);
  osc.connect(gain).connect(out);
  osc.start(o.start);
  osc.stop(o.start + o.dur + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;

function noise(ac: BaseAudioContext): AudioBufferSourceNode {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ac.sampleRate) {
    noiseBuffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

// --- the sounds; each schedules itself starting at time t ---

type Recipe = (ac: BaseAudioContext, out: AudioNode, t: number) => void;

export const RECIPES: Record<SoundName, Recipe> = {
  // Bloop: sine sweeping 420 → 900 Hz over 0.12s, faded out by 0.25s
  tap: (ac, out, t) => tone(ac, out, { wave: 'sine', freq: 420, freqEnd: 900, glide: 0.12, start: t, dur: 0.25, peak: 0.9 }),

  // Soft tick: band-passed noise burst, 0.05s
  flip: (ac, out, t) => {
    const src = noise(ac);
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 2600;
    filter.Q.value = 1.2;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.3, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(filter).connect(gain).connect(out);
    src.start(t);
    src.stop(t + 0.06);
  },

  // Low pluck: triangle around 330 Hz, 0.15s
  land: (ac, out, t) =>
    tone(ac, out, { wave: 'triangle', freq: 340, freqEnd: 320, start: t, dur: 0.15, peak: 0.85, attack: 0.005 }),

  // Gentle double low note, quieter than the rest
  invalid: (ac, out, t) => {
    tone(ac, out, { wave: 'sine', freq: 220, start: t, dur: 0.1, peak: 0.4 });
    tone(ac, out, { wave: 'sine', freq: 196, start: t + 0.13, dur: 0.12, peak: 0.35 });
  },

  // Rising two-note chime
  foundation: (ac, out, t) => {
    tone(ac, out, { wave: 'sine', freq: 659.3, start: t, dur: 0.22, peak: 0.6 });
    tone(ac, out, { wave: 'sine', freq: 880, start: t + 0.09, dur: 0.28, peak: 0.6 });
    tone(ac, out, { wave: 'sine', freq: 1760, start: t + 0.09, dur: 0.2, peak: 0.08 });
  },

  // Four-note rising arpeggio plus a sparkle shimmer
  win: (ac, out, t) => {
    [523.3, 659.3, 784, 1046.5].forEach((freq, i) =>
      tone(ac, out, { wave: 'triangle', freq, start: t + i * 0.07, dur: 0.17, peak: 0.6 }),
    );
    [2093, 2637, 3136, 2794, 3520].forEach((freq, i) =>
      tone(ac, out, { wave: 'sine', freq, start: t + 0.14 + i * 0.04, dur: 0.12, peak: 0.07, attack: 0.008 }),
    );
  },

  // Quick bright bloop
  speedFast: (ac, out, t) =>
    tone(ac, out, { wave: 'sine', freq: 700, freqEnd: 1400, glide: 0.07, start: t, dur: 0.14, peak: 0.75 }),

  // Whoosh: noise swept through a band-pass filter, 0.3s
  whoosh: (ac, out, t) => {
    const src = noise(ac);
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(2.2, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(filter).connect(gain).connect(out);
    src.start(t);
    src.stop(t + 0.32);
  },

  // Little splash for a lily pad hop: a water plip, then noise falling through a low-pass filter, 0.3s
  splash: (ac, out, t) => {
    tone(ac, out, { wave: 'sine', freq: 520, freqEnd: 1250, glide: 0.06, start: t, dur: 0.1, peak: 0.55, attack: 0.004 });
    const src = noise(ac);
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    filter.type = 'lowpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(2600, t + 0.05);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    gain.gain.setValueAtTime(0.0001, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(1.1, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(filter).connect(gain).connect(out);
    src.start(t + 0.05);
    src.stop(t + 0.32);
  },

  // Gentle boop when a marble is sent home: a soft sine sliding down, 0.24s
  boop: (ac, out, t) =>
    tone(ac, out, { wave: 'sine', freq: 560, freqEnd: 300, glide: 0.18, start: t, dur: 0.24, peak: 0.7 }),

  // Soft "blub" for a Fishy! call: two little bubbles rising, 0.26s
  blub: (ac, out, t) => {
    tone(ac, out, { wave: 'sine', freq: 260, freqEnd: 620, glide: 0.07, start: t, dur: 0.11, peak: 0.6, attack: 0.006 });
    tone(ac, out, { wave: 'sine', freq: 340, freqEnd: 860, glide: 0.08, start: t + 0.12, dur: 0.14, peak: 0.5, attack: 0.006 });
  },
};

export function play(name: SoundName): void {
  if (!shouldPlay({ sfx: enabled, volume })) return;
  const audio = unlockAudio();
  if (!audio) return;
  RECIPES[name](audio.ctx, audio.out, audio.ctx.currentTime + 0.005);
}
