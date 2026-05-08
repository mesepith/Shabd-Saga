/**
 * Generates game music WAV loops using proper multi-layered synthesis.
 * Based on the joyful-sadb.html approach: bells, kicks, clicks,
 * pitch sweeps, sparkles, and rich harmonics.
 * Run: npx tsx scripts/generate-music.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_RATE = 44100;
const MAX_AMP = 32767;

// ── WAV writer ──
function wav(samples: Float32Array, fp: string): void {
  const n = samples.length;
  const ds = n * 2;
  const buf = Buffer.alloc(44 + ds);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + ds, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SAMPLE_RATE, 24); buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(ds, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * MAX_AMP), 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, buf);
}

// ── Note to frequency ──
const noteOff: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
function freq(note: string): number {
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) return 440;
  return 440 * Math.pow(2, ((12 * (Number(m[2]) + 1) + noteOff[m[1]]) - 69) / 12);
}

// ── Synthesis primitives ──

function tone(buf: Float32Array, f: number, startTime: number, dur: number, vol: number,
  type: string = 'sine', atk = 0.01, rel = 0.08): void {
  const st = Math.floor(startTime * SAMPLE_RATE);
  const len = Math.floor(dur * SAMPLE_RATE);
  const attackSmp = Math.floor(atk * SAMPLE_RATE);
  const releaseSmp = Math.floor(rel * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const idx = st + i;
    if (idx < 0 || idx >= buf.length) continue;
    const t = i / SAMPLE_RATE;
    let wave: number;
    if (type === 'triangle') {
      wave = 2 * Math.asin(Math.sin(2 * Math.PI * f * t)) / Math.PI;
    } else if (type === 'square') {
      wave = Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1;
    } else if (type === 'sawtooth') {
      wave = 2 * (f * t - Math.floor(f * t + 0.5));
    } else {
      wave = Math.sin(2 * Math.PI * f * t);
    }
    let env = 1;
    if (i < attackSmp) env = Math.min(i / Math.max(attackSmp, 1), 1);
    if (i > len - releaseSmp) env = Math.min(env, (len - i) / Math.max(releaseSmp, 1));
    buf[idx] += wave * vol * env;
  }
}

function bell(buf: Float32Array, f: number, st: number, dur: number, vol: number): void {
  tone(buf, f, st, dur, vol, 'sine', 0.002, dur * 0.8);
  tone(buf, f * 2.01, st, dur * 0.7, vol * 0.36, 'sine', 0.002, dur * 0.65);
  tone(buf, f * 3.02, st, dur * 0.45, vol * 0.16, 'sine', 0.002, dur * 0.5);
}

function sparkle(buf: Float32Array, st: number, notes: string[], vol: number): void {
  notes.forEach((n, i) => bell(buf, freq(n), st + i * 0.07, 0.35, vol));
}

function kick(buf: Float32Array, st: number, vol: number): void {
  const start = Math.floor(st * SAMPLE_RATE);
  const len = Math.floor(0.12 * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buf.length) continue;
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-24 * t);
    const f = 95 - 55 * (i / len);
    buf[idx] += Math.sin(2 * Math.PI * f * t) * vol * env;
  }
}

function click(buf: Float32Array, st: number, vol: number): void {
  const start = Math.floor(st * SAMPLE_RATE);
  const len = Math.floor(0.035 * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buf.length) continue;
    const env = Math.exp(-90 * (i / SAMPLE_RATE));
    buf[idx] += (Math.random() * 2 - 1) * env * vol;
  }
}

function pad(buf: Float32Array, notes: string[], st: number, dur: number, vol: number): void {
  notes.forEach((n, i) => {
    tone(buf, freq(n), st + i * 0.04, dur, vol * 0.7, 'sine', 0.12, 0.7);
  });
}

// ── Render helper ──

function render(fp: string, dur: number, fn: (buf: Float32Array) => void): void {
  const buf = new Float32Array(Math.floor(dur * SAMPLE_RATE));
  fn(buf);
  normalize(buf, 0.82);
  fadeEdges(buf, 0.06, 0.12);
  wav(buf, fp);
}

function normalize(buf: Float32Array, max: number): void {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak === 0) return;
  const s = max / peak;
  for (let i = 0; i < buf.length; i++) buf[i] *= s;
}

function fadeEdges(buf: Float32Array, fi: number, fo: number): void {
  const nIn = Math.floor(fi * SAMPLE_RATE);
  const nOut = Math.floor(fo * SAMPLE_RATE);
  for (let i = 0; i < nIn; i++) buf[i] *= i / nIn;
  for (let i = 0; i < nOut; i++) {
    buf[buf.length - nOut + i] *= 1 - i / nOut;
  }
}

// ════════════════ Track composers ════════════════

function composeMenu(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 120;
  const chords = [['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4']];
  for (let t = 0; t < dur; t += 2) {
    const c = chords[Math.floor(t / 2) % chords.length];
    pad(buf, c, t, 1.7, 0.06);
    sparkle(buf, t + 1.1, ['C5','E5','G5','C6'], 0.04);
  }
  for (let t = 0; t < dur; t += BEAT) {
    click(buf, t, 0.014);
  }
}

function composeWorld1(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 130;
  const melody = ['E4','G4','A4','G4','E4','D4','E4','C4'];
  const bass = ['E2','B2','A2','G2'];
  for (let t = 0; t < dur; t += BEAT / 2) {
    const i = Math.floor(t / (BEAT / 2)) % melody.length;
    tone(buf, freq(melody[i]), t, BEAT * 0.35, 0.09, 'triangle', 0.006, 0.06);
    if (i % 6 === 0) bell(buf, freq('E5'), t + 0.1, 0.28, 0.04);
  }
  for (let t = 0; t < dur; t += BEAT) {
    const n = bass[Math.floor(t / BEAT) % bass.length];
    tone(buf, freq(n), t, BEAT * 0.5, 0.07, 'sine', 0.01, 0.1);
    kick(buf, t, 0.06);
    click(buf, t + BEAT / 2, 0.03);
  }
}

function composeWorld2(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 115;
  const melody = ['G4','E4','F4','D4','E4','C4','D4','E4'];
  const bass = ['G2','D3','A2','C3'];
  for (let t = 0; t < dur; t += BEAT / 2) {
    const i = Math.floor(t / (BEAT / 2)) % melody.length;
    tone(buf, freq(melody[i]), t, BEAT * 0.4, 0.08, 'sine', 0.02, 0.1);
  }
  for (let t = 0; t < dur; t += BEAT) {
    const n = bass[Math.floor(t / BEAT) % bass.length];
    tone(buf, freq(n), t, BEAT * 0.55, 0.06, 'sine', 0.01, 0.12);
    kick(buf, t, 0.05);
    click(buf, t + BEAT / 2, 0.025);
  }
}

function composeWorld3(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 100;
  const melody = ['D4','F4','A4','G4','F4','E4','D4','C4'];
  const bass = ['D2','A2','Bb2','G2'];
  const chords = [['D3','F3','A3'], ['A2','C3','E3'], ['Bb2','D3','F3'], ['G2','Bb2','D3']];
  for (let t = 0; t < dur; t += 2) {
    pad(buf, chords[Math.floor(t / 2) % chords.length], t, 1.5, 0.04);
  }
  for (let t = 0; t < dur; t += BEAT / 2) {
    const i = Math.floor(t / (BEAT / 2)) % melody.length;
    bell(buf, freq(melody[i]), t, 0.38, 0.06);
  }
  for (let t = 0; t < dur; t += BEAT) {
    const n = bass[Math.floor(t / BEAT) % bass.length];
    tone(buf, freq(n), t, BEAT * 0.45, 0.07, 'sine', 0.01, 0.1);
    kick(buf, t, 0.05);
    click(buf, t + BEAT / 2, 0.028);
  }
}

function composeVictory(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 140;
  const notes = ['C5','E5','G5','C6','B4','G5','E5','D5','F5','A5','C6','A5','G5','E5','D5','C5'];
  const bass = ['C3','G3','A3','F3'];
  // Bright opening fanfare
  sparkle(buf, 0, ['C5','E5','G5','C6','E6'], 0.06);
  for (let t = 0; t < dur; t += BEAT / 4) {
    const i = Math.floor(t / (BEAT / 4)) % notes.length;
    bell(buf, freq(notes[i]), t, 0.2, 0.06);
    if (i % 8 === 0) sparkle(buf, t + 0.05, ['C6','G5','E5'], 0.04);
  }
  for (let t = 0; t < dur; t += BEAT) {
    const n = bass[Math.floor(t / BEAT) % bass.length];
    tone(buf, freq(n), t, BEAT * 0.5, 0.055, 'sine', 0.01, 0.12);
    kick(buf, t, 0.05);
    click(buf, t + BEAT / 2, 0.03);
  }
  // Reward shines
  for (let t = 1; t < dur; t += 2.5) {
    sparkle(buf, t, ['C7','E7','G7'], 0.05);
  }
}

function composePuzzle(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 108;
  const notes = ['C5','E5','G5','E5','A4','G5','E5','D5','F5','A5','C6','A5','G5','E5','D5','C5'];
  const pads = [['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4']];
  for (let t = 0; t < dur; t += 2) {
    pad(buf, pads[Math.floor(t / 2) % pads.length], t, 1.6, 0.04);
  }
  for (let t = 0; t < dur; t += BEAT / 4) {
    const i = Math.floor(t / (BEAT / 4)) % notes.length;
    bell(buf, freq(notes[i]), t, 0.16, 0.05);
    if (i % 8 === 0) sparkle(buf, t + 0.04, ['C6','G5','E6'], 0.035);
  }
  for (let t = 0; t < dur; t += BEAT) {
    click(buf, t, 0.02);
    click(buf, t + BEAT / 2, 0.015);
  }
}

function composeBoss(buf: Float32Array, dur: number): void {
  const BEAT = 60 / 95;
  const bass = ['D2','D2','F2','E2','D2','A1','F2','E2'];
  const lowPad = [['D3','F3','A3'], ['D3','F3','Bb3'], ['A2','C3','E3'], ['Bb2','D3','F3']];
  // Dark, tense pad bed — slow heavy chords
  for (let t = 0; t < dur; t += 2) {
    const c = lowPad[Math.floor(t / 2) % lowPad.length];
    pad(buf, c, t, 1.8, 0.05);
    // Add a sub-bass rumble layer
    tone(buf, freq(c[0].replace(/\d/, m => String(Number(m) - 1))), t, 1.8, 0.04, 'sine', 0.2, 0.6);
  }
  // Slow, heavy kicks — like a heartbeat
  for (let t = 0; t < dur; t += BEAT) {
    const n = bass[Math.floor(t / BEAT) % bass.length];
    tone(buf, freq(n), t, BEAT * 0.6, 0.08, 'sine', 0.01, 0.1);
    kick(buf, t, 0.08);
    kick(buf, t + BEAT / 2, 0.04);
    // Occasional deep accent on beat 1
    if (Math.floor(t / BEAT) % 4 === 0) {
      kick(buf, t, 0.12);
    }
  }
  // Creeping high bell — sparse, ominous
  const creep = ['D5','F5','A5','G5','F5','E5','D5','C5'];
  for (let t = 0; t < dur; t += BEAT * 2) {
    const i = Math.floor(t / (BEAT * 2)) % creep.length;
    bell(buf, freq(creep[i]), t + 0.15, 1.2, 0.04);
  }
  // Occasional low warning sweep
  for (let t = 2; t < dur; t += 5) {
    tone(buf, freq('D2'), t, 1.0, 0.04, 'sawtooth', 0.08, 0.6);
  }
}

// ════════════════ Main ════════════════

console.log('Generating music loops (44100Hz, rich multi-layered)...');
const dir = 'public/assets/audio/music';
let kb: number;

render(`${dir}/menu-loop.wav`, 10, b => composeMenu(b, 10));
kb = Math.round(fs.statSync(`${dir}/menu-loop.wav`).size / 1024);
console.log('  ✓ menu-loop.wav (%d KB)', kb);

render(`${dir}/world-1-loop.wav`, 10, b => composeWorld1(b, 10));
kb = Math.round(fs.statSync(`${dir}/world-1-loop.wav`).size / 1024);
console.log('  ✓ world-1-loop.wav (%d KB)', kb);

render(`${dir}/world-2-loop.wav`, 10, b => composeWorld2(b, 10));
kb = Math.round(fs.statSync(`${dir}/world-2-loop.wav`).size / 1024);
console.log('  ✓ world-2-loop.wav (%d KB)', kb);

render(`${dir}/world-3-loop.wav`, 10, b => composeWorld3(b, 10));
kb = Math.round(fs.statSync(`${dir}/world-3-loop.wav`).size / 1024);
console.log('  ✓ world-3-loop.wav (%d KB)', kb);

render(`${dir}/victory-loop.wav`, 10, b => composeVictory(b, 10));
kb = Math.round(fs.statSync(`${dir}/victory-loop.wav`).size / 1024);
console.log('  ✓ victory-loop.wav (%d KB)', kb);

render(`${dir}/puzzle-loop.wav`, 10, b => composePuzzle(b, 10));
kb = Math.round(fs.statSync(`${dir}/puzzle-loop.wav`).size / 1024);
console.log('  ✓ puzzle-loop.wav (%d KB)', kb);

render(`${dir}/boss-loop.wav`, 10, b => composeBoss(b, 10));
kb = Math.round(fs.statSync(`${dir}/boss-loop.wav`).size / 1024);
console.log('  ✓ boss-loop.wav (%d KB)', kb);

console.log('Done!');
