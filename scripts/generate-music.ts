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

function toneSweep(buf: Float32Array, fStart: number, fEnd: number, st: number, dur: number, vol: number, type: string = 'sawtooth'): void {
  const start = Math.floor(st * SAMPLE_RATE);
  const len = Math.floor(dur * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buf.length) continue;
    const progress = i / len;
    const f = fStart + (fEnd - fStart) * progress;
    phase += 2 * Math.PI * f / SAMPLE_RATE;
    let wave: number;
    if (type === 'triangle') wave = 2 * Math.asin(Math.sin(phase)) / Math.PI;
    else if (type === 'sawtooth') wave = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
    else wave = Math.sin(phase);
    const env = Math.sin(Math.PI * progress);
    buf[idx] += wave * vol * env;
  }
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
  // Grand, slow celebration — distinctly different from world music
  const BEAT = 60 / 100;
  const key = ['C4','E4','G4','C5','E5','G5','C6'];
  const bass = ['C3','G3','C3','F3','C3','G3','C3','G3'];

  // Layer 1: Big opening fanfare (first 2 seconds)
  sparkle(buf, 0.1, ['C5','E5','G5','C6','E6','G6'], 0.08);
  bell(buf, freq('C6'), 0.1, 1.5, 0.08);
  bell(buf, freq('E6'), 0.4, 1.3, 0.07);
  bell(buf, freq('G6'), 0.7, 1.5, 0.07);

  // Layer 2: Warm, rich chord pads — slow, majestic
  const chords: [string, string, string][] = [
    ['C4','E4','G4'], ['C4','F4','A4'], ['C4','E4','G4'], ['G3','B3','D4'],
    ['F3','A3','C4'], ['C4','E4','G4'], ['G3','B3','D4'], ['C4','E4','G4'],
  ];
  for (let t = 0; t < dur; t += 2.5) {
    const c = chords[Math.floor(t / 2.5) % chords.length];
    pad(buf, c, t, 2.3, 0.06);
  }

  // Layer 3: Bold, slow bell melody — "ta-da!" feel
  const melody = ['C5','E5','G5','C6','G5','E5','C5','D5','F5','A5','C6','A5','G5','E5','C5','G5'];
  for (let t = 0; t < dur; t += BEAT) {
    const i = Math.floor(t / BEAT) % melody.length;
    bell(buf, freq(melody[i]), t, 0.7, 0.07);
    // Triple sparkle accent every 4th beat
    if (i % 4 === 0) {
      sparkle(buf, t + 0.3, ['C7','E7','G7'], 0.06);
    }
  }

  // Layer 4: Gentle bass with warm sustain
  for (let t = 0; t < dur; t += BEAT * 2) {
    const n = bass[Math.floor(t / (BEAT * 2)) % bass.length];
    tone(buf, freq(n), t, BEAT * 1.5, 0.06, 'sine', 0.05, 0.5);
  }

  // Layer 5: Soft clicks for gentle pulse
  for (let t = 0; t < dur; t += BEAT * 2) {
    click(buf, t, 0.02);
  }

  // Repeat fanfare at loop point (makes seamless loop feel fresh)
  if (dur > 9) {
    sparkle(buf, 9.0, ['C5','E5','G5','C6','E6'], 0.06);
    bell(buf, freq('C6'), 9.0, 1.2, 0.06);
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

// ── Boss tracks — escalating tension per world ──

function composeBossJungle(buf: Float32Array, dur: number): void {
  const B = 60 / 120;
  const pads: [string,string,string][] = [
    ['D3','F3','A3'],['Bb2','D3','F3'],['G2','Bb2','D3'],['A2','C#3','G3'],
    ['D3','F3','Ab3'],['Bb2','Db3','F3'],['G2','Bb2','Db3'],['A2','C3','E3'],
  ];
  const bass = ['D2','D2','Bb1','Bb1','G1','G1','A1','A1','D2','D2','F2','F2','G1','G1','A1','A1'];
  // Dark pads
  for (let t = 0; t < dur; t += 1) {
    const c = pads[Math.floor(t/1) % pads.length];
    pad(buf, c, t, 0.9, 0.06);
    tone(buf, freq(c[0].replace(/\d/,m=>String(Number(m)-2))), t, 0.9, 0.04, 'sine', 0.15, 0.5);
  }
  // Percussion
  for (let t = 0; t < dur; t += B) {
    const n = bass[Math.floor(t/B) % bass.length];
    tone(buf, freq(n), t, B*0.45, 0.1, 'sawtooth', 0.003, 0.1);
    kick(buf, t, 0.12); kick(buf, t+0.08, 0.09);
    click(buf, t+B/2, 0.04); click(buf, t+B/4, 0.03); click(buf, t+B*3/4, 0.03);
    if (Math.floor(t/B)%4===0) { kick(buf, t, 0.18); tone(buf, freq('D1'), t, 0.3, 0.15, 'sine', 0.002, 0.2); }
  }
  // Melody
  const mel = ['D5','F5','A5','F5','D5','A4','G5','F5','D5','Bb4','F5','D5','G5','D5','A5','G5'];
  for (let t = 0; t < dur; t += B/3) {
    bell(buf, freq(mel[Math.floor(t/(B/3)) % mel.length]), t, 0.23, 0.055);
  }
  // Dissonant bells
  const dis = ['D6','Ab5','G6','Db6','F6','A5','E6','Bb5'];
  for (let t = 0; t < dur; t += B*2) {
    bell(buf, freq(dis[Math.floor(t/(B*2)) % dis.length]), t, 0.5, 0.04);
  }
  // Sweeps
  for (let t = 1; t < dur; t += 4) {
    toneSweep(buf, freq('D2'), freq('D3'), t, 1.8, 0.04, 'sawtooth');
  }
}

function composeBossVillage(buf: Float32Array, dur: number): void {
  const B = 60 / 140;
  const pads: [string,string,string][] = [
    ['C#3','E3','G#3'],['A2','C#3','E3'],['F#2','A2','C#3'],['G#2','C3','D#3'],
    ['C#3','E3','G3'],['A2','C3','E3'],['F#2','A2','C3'],['G#2','C#3','D#3'],
  ];
  const bass = ['C#2','C#2','A1','A1','F#1','F#1','G#1','G#1','C#2','C#2','E2','E2','F#1','F#1','G#1','G#1'];
  for (let t = 0; t < dur; t += 0.8) {
    const c = pads[Math.floor(t/0.8) % pads.length];
    pad(buf, c, t, 0.72, 0.07);
    tone(buf, freq(c[0].replace(/\d/,m=>String(Number(m)-2))), t, 0.72, 0.05, 'sawtooth', 0.08, 0.4);
  }
  for (let t = 0; t < dur; t += B) {
    tone(buf, freq(bass[Math.floor(t/B)%bass.length]), t, B*0.38, 0.12, 'sawtooth', 0.002, 0.08);
    kick(buf, t, 0.15); kick(buf, t+0.06, 0.11); kick(buf, t+0.12, 0.08);
    click(buf, t+B/3, 0.05); click(buf, t+B*2/3, 0.05);
    if (Math.floor(t/B)%2===0) { kick(buf, t, 0.2); tone(buf, freq('C#1'), t, 0.25, 0.18, 'square', 0.001, 0.15); }
  }
  const mel = ['C#5','E5','G#5','E5','C#5','G#4','F#5','E5','C#5','A4','E5','C#5','F#5','C#5','G#5','F#5'];
  for (let t = 0; t < dur; t += B/4) {
    bell(buf, freq(mel[Math.floor(t/(B/4))%mel.length]), t, 0.18, 0.06);
  }
  const dis = ['C#6','G5','F#6','C6','E6','G#5','D#6','A5'];
  for (let t = 0; t < dur; t += B*1.5) {
    bell(buf, freq(dis[Math.floor(t/(B*1.5))%dis.length]), t, 0.4, 0.045);
  }
  for (let t = 0.5; t < dur; t += 2.8) {
    toneSweep(buf, freq('C#2'), freq('C#3'), t, 1.4, 0.05, 'sawtooth');
  }
}

function composeBossPalace(buf: Float32Array, dur: number): void {
  const B = 60 / 160;
  const pads: [string,string,string][] = [
    ['E3','G3','B3'],['C3','E3','G3'],['A2','C3','E3'],['B2','D#3','F#3'],
    ['E3','G3','Bb3'],['C3','Eb3','G3'],['A2','C3','Eb3'],['B2','D3','F#3'],
  ];
  const bass = ['E2','E2','C2','C2','A1','A1','B1','B1','E2','E2','G2','G2','A1','A1','B1','B1'];
  for (let t = 0; t < dur; t += 0.6) {
    const c = pads[Math.floor(t/0.6) % pads.length];
    pad(buf, c, t, 0.55, 0.08);
    tone(buf, freq(c[0].replace(/\d/,m=>String(Number(m)-3))), t, 0.55, 0.06, 'sawtooth', 0.03, 0.3);
  }
  for (let t = 0; t < dur; t += B) {
    tone(buf, freq(bass[Math.floor(t/B)%bass.length]), t, B*0.32, 0.14, 'square', 0.001, 0.06);
    kick(buf, t, 0.18); kick(buf, t+0.05, 0.14); kick(buf, t+0.1, 0.1); kick(buf, t+0.15, 0.07);
    click(buf, t+B/4, 0.06); click(buf, t+B/2, 0.06); click(buf, t+B*3/4, 0.06);
    if (Math.floor(t/B)%1===0) { kick(buf, t, 0.24); tone(buf, freq('E1'), t, 0.22, 0.2, 'square', 0.001, 0.12); }
  }
  const mel = ['E5','G5','B5','G5','E5','B4','A5','G5','E5','C5','G5','E5','A5','E5','B5','A5'];
  for (let t = 0; t < dur; t += B/6) {
    bell(buf, freq(mel[Math.floor(t/(B/6))%mel.length]), t, 0.13, 0.065);
  }
  const dis = ['E6','Bb5','A6','C#6','G6','B5','F#6','C6'];
  for (let t = 0; t < dur; t += B) {
    bell(buf, freq(dis[Math.floor(t/B)%dis.length]), t, 0.3, 0.05);
  }
  for (let t = 0.3; t < dur; t += 2.2) {
    toneSweep(buf, freq('E2'), freq('E3'), t, 1.1, 0.06, 'sawtooth');
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

render(`${dir}/boss-jungle-loop.wav`, 10, b => composeBossJungle(b, 10));
kb = Math.round(fs.statSync(`${dir}/boss-jungle-loop.wav`).size / 1024);
console.log('  ✓ boss-jungle-loop.wav (%d KB)', kb);

render(`${dir}/boss-village-loop.wav`, 10, b => composeBossVillage(b, 10));
kb = Math.round(fs.statSync(`${dir}/boss-village-loop.wav`).size / 1024);
console.log('  ✓ boss-village-loop.wav (%d KB)', kb);

render(`${dir}/boss-palace-loop.wav`, 10, b => composeBossPalace(b, 10));
kb = Math.round(fs.statSync(`${dir}/boss-palace-loop.wav`).size / 1024);
console.log('  ✓ boss-palace-loop.wav (%d KB)', kb);

console.log('Done!');
