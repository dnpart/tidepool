// Synthesized sound effects (Web Audio API, no files). Games call play(name) and never touch audio directly.
// Phase 3 has only the tap bloop for the Settings test button; Phase 4 adds the rest.

export type SoundName = 'tap';

let enabled = true;
let volume = 60;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Keeps the sound module in step with Settings. */
export function configureSound(options: { sfx: boolean; volume: number }): void {
  enabled = options.sfx;
  volume = options.volume;
  if (master && ctx) master.gain.setValueAtTime(masterGain(), ctx.currentTime);
}

const masterGain = () => (volume / 100) * 0.3;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = masterGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

/** Sine sweeping 420 → 900 Hz over 0.12s, faded out by 0.25s. */
function bloop(ctx: AudioContext, out: GainNode) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(1, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + 0.26);
}

export function play(name: SoundName): void {
  if (!enabled || volume <= 0) return;
  const a = audio();
  if (!a) return;
  switch (name) {
    case 'tap':
      bloop(a.ctx, a.out);
      break;
  }
}
