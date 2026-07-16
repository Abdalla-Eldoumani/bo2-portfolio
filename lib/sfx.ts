/*
  Interface SFX — tiny synthesized cues (WebAudio, zero assets, no music).
  Every sound is built from oscillators and filtered noise at very low
  gain: menu ticks, selection punches, back-outs, the field-sim deploy
  sting. The AudioContext is created lazily inside the first user gesture
  (autoplay policies allow that), and the whole system is a no-op on the
  server, when WebAudio is unavailable, or when the visitor switches SFX
  off (persisted in localStorage; the switch lives in the top bar).
*/

const STORE = 'bo2-sfx';

// Fired on window whenever the enabled state flips (detail: boolean).
export const SFX_CHANGE_EVENT = 'bo2-sfx-change';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastMove = 0;
let lastScore = 0;
let lastNear = 0;

function on(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORE) !== '0';
  } catch {
    return true;
  }
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  delay = 0,
) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, f0), t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur: number, freq: number, peak: number, delay = 0) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** Selection moved (menu rows, op cards, screen cycling). Rate-limited so
    fast key repeats and mouse sweeps read as a tick, not a buzz. */
export function sfxMove() {
  if (!on()) return;
  const now = performance.now();
  if (now - lastMove < 45) return;
  lastMove = now;
  tone(950, 720, 0.05, 'square', 0.045);
}

/** Committed a selection (navigate, launch, confirm). */
export function sfxSelect() {
  if (!on()) return;
  tone(620, 620, 0.055, 'square', 0.055);
  tone(930, 930, 0.07, 'square', 0.05, 0.045);
}

/** Backed out (ESC to lobby, close the overlay). */
export function sfxBack() {
  if (!on()) return;
  tone(520, 300, 0.08, 'square', 0.05);
}

/** Something heavier opened (field sim, nav overlay). */
export function sfxOpen() {
  if (!on()) return;
  noiseBurst(0.12, 1400, 0.045);
  tone(180, 95, 0.16, 'sawtooth', 0.055);
}

/** The heavier thing closed again. */
export function sfxClose() {
  if (!on()) return;
  tone(420, 230, 0.07, 'square', 0.045);
}

/** Small acknowledgement (address copied, data resync). */
export function sfxTick() {
  if (!on()) return;
  tone(1350, 1350, 0.035, 'sine', 0.04);
}

/** In-sim score blip. Own rate limit so streaks stay musical. */
export function sfxScore() {
  if (!on()) return;
  const now = performance.now();
  if (now - lastScore < 70) return;
  lastScore = now;
  tone(1500, 1800, 0.04, 'sine', 0.03);
}

/** Round over — two-step debrief sting. */
export function sfxEnd() {
  if (!on()) return;
  tone(660, 660, 0.09, 'square', 0.05);
  tone(440, 440, 0.12, 'square', 0.045, 0.09);
}

/** Dead-center action ("PERFECT") — bright ascending pair. */
export function sfxPerfect() {
  if (!on()) return;
  tone(1180, 1180, 0.05, 'sine', 0.04);
  tone(1760, 1760, 0.07, 'sine', 0.038, 0.05);
}

/** Grazed a hazard and lived — one soft shimmer. Own rate limit. */
export function sfxNear() {
  if (!on()) return;
  const now = performance.now();
  if (now - lastNear < 120) return;
  lastNear = now;
  tone(2100, 1500, 0.06, 'sine', 0.022);
}

/** Hazard tripped or survived — low warning thud. */
export function sfxHazard() {
  if (!on()) return;
  tone(220, 130, 0.11, 'sawtooth', 0.05);
  noiseBurst(0.07, 700, 0.03);
}

/** Streak lost — short falling chirp. */
export function sfxComboBreak() {
  if (!on()) return;
  tone(760, 340, 0.1, 'square', 0.045);
}

/** Escalation beat (wave shift, overclock, scale-out) — announce sting. */
export function sfxMilestone() {
  if (!on()) return;
  tone(520, 520, 0.06, 'square', 0.05);
  tone(780, 780, 0.06, 'square', 0.048, 0.06);
  tone(1040, 1040, 0.09, 'square', 0.04, 0.12);
}

/** Medal earned — short bright fanfare over a low thump. */
export function sfxMedal() {
  if (!on()) return;
  noiseBurst(0.09, 900, 0.03);
  tone(880, 880, 0.07, 'triangle', 0.05);
  tone(1175, 1175, 0.07, 'triangle', 0.048, 0.07);
  tone(1760, 1760, 0.11, 'triangle', 0.045, 0.14);
}

/** Career rank up — the full promotion beat. */
export function sfxRankUp() {
  if (!on()) return;
  tone(392, 392, 0.09, 'square', 0.05);
  tone(523, 523, 0.09, 'square', 0.05, 0.09);
  tone(659, 659, 0.09, 'square', 0.05, 0.18);
  tone(784, 784, 0.16, 'square', 0.055, 0.27);
  noiseBurst(0.14, 1600, 0.035, 0.27);
}

export function sfxEnabled(): boolean {
  return on();
}

/** Flip SFX on/off, persist, notify listeners. Returns the new state. */
export function sfxToggle(): boolean {
  const next = !on();
  try {
    window.localStorage.setItem(STORE, next ? '1' : '0');
  } catch {
    // Storage unavailable: the toggle still works for this page life.
  }
  window.dispatchEvent(new CustomEvent(SFX_CHANGE_EVENT, { detail: next }));
  if (next) sfxSelect();
  return next;
}
