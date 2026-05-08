import { Howl, Howler } from 'howler';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private muted: boolean = false;

  private speechCache: Map<string, Howl> = new Map();
  private lastSpeechTime: Map<string, number> = new Map();

  private musicHowl: Howl | null = null;
  private activeMusicKey: string = '';

  constructor() {
    if (localStorage.getItem('shabd_saga_audio_muted') === 'true') this.muted = true;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  init(): void {
    try {
      this.ctx = new AudioContext();
      this.sfxGain = this.ctx.createGain();
      this.masterGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {}
  }

  resume(): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);
      }
    } catch {}
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch(() => {});
      }
    } catch {}
  }

  // ═════════════ SFX (Web Audio synthesis — kept because these are just blips) ═════════════

  private tone(f: number, e: number, d: number, v: number): void {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, n);
    o.frequency.linearRampToValueAtTime(e, n + d);
    g.gain.setValueAtTime(0, n);
    g.gain.linearRampToValueAtTime(v, n + 0.015);
    g.gain.setValueAtTime(v * 0.7, n + d * 0.5);
    g.gain.linearRampToValueAtTime(0.001, n + d);
    o.connect(g); g.connect(this.sfxGain!);
    o.start(n); o.stop(n + d + 0.05);
  }

  private toneS(f: number, o: number, d: number, v: number): void {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime + o;
    const os = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    os.type = 'sine';
    os.frequency.setValueAtTime(f, n);
    g.gain.setValueAtTime(0, n);
    g.gain.linearRampToValueAtTime(v, n + 0.015);
    g.gain.setValueAtTime(v * 0.7, n + d * 0.5);
    g.gain.linearRampToValueAtTime(0.001, n + d);
    os.connect(g); g.connect(this.sfxGain!);
    os.start(n); os.stop(n + d + 0.05);
  }

  private nz(d: number, v: number): void {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * d);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.5;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(v, n); g.gain.linearRampToValueAtTime(0.001, n + d);
    src.connect(g); g.connect(this.sfxGain!);
    src.start(n); src.stop(n + d + 0.05);
  }

  private sweep(ff: number, fe: number, d: number, v: number, t: OscillatorType = 'sawtooth'): void {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = t;
    o.frequency.setValueAtTime(ff, n);
    o.frequency.exponentialRampToValueAtTime(fe, n + d);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + d);
    o.connect(g); g.connect(this.sfxGain!);
    o.start(n); o.stop(n + d + 0.05);
  }

  private boom(d: number, v: number): void {
    // Heavy blast: low sine thump + layered noise burst
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime;
    // Low thump
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(45, n);
    o.frequency.linearRampToValueAtTime(20, n + d);
    g.gain.setValueAtTime(v * 1.5, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + d);
    o.connect(g); g.connect(this.sfxGain!);
    o.start(n); o.stop(n + d + 0.05);
    // Noise layer
    this.nz(d, v * 0.7);
  }

  private crackle(d: number, v: number): void {
    // Fire crackle: multiple short noise bursts stacked
    if (!this.ctx || this.muted) return;
    const n = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const off = n + i * (d / 6);
      const subDur = d * 0.25;
      const len = Math.floor(this.ctx.sampleRate * subDur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < len; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / len) * (0.3 + Math.random() * 0.7);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(v * (0.4 + Math.random() * 0.3), off);
      g.gain.exponentialRampToValueAtTime(0.001, off + subDur);
      src.connect(g); g.connect(this.sfxGain!);
      src.start(off); src.stop(off + subDur + 0.01);
    }
  }

  playJump(): void       { this.tone(400, 720, 0.16, 0.25); }
  playCollect(): void    { this.toneS(587, 0, 0.28, 0.15); this.toneS(784, 0.09, 0.22, 0.12); }
  playDoorOpen(): void   { this.toneS(493, 0, 0.28, 0.11); this.toneS(622, 0.12, 0.32, 0.11); this.toneS(740, 0.26, 0.35, 0.10); }
  playHurt(): void       { this.tone(150, 80, 0.2, 0.12); this.nz(0.14, 0.07); }
  playCheckpoint(): void { this.toneS(523, 0, 0.16, 0.10); this.toneS(659, 0.13, 0.2, 0.08); }
  playBossAttack(): void {
    // Shadow bolts: fire whoosh — sweeping saw + crackle
    this.sweep(800, 200, 0.4, 0.14, 'sawtooth');
    this.sweep(600, 150, 0.35, 0.10, 'sawtooth');
    this.crackle(0.4, 0.1);
  }
  playBossSlam(): void {
    // Ground slam: heavy collision blast — big boom + noise explosion
    this.boom(0.5, 0.25);
    this.nz(0.55, 0.22);
    this.sweep(200, 30, 0.4, 0.15, 'sawtooth');
  }
  playBossMinion(): void {
    // Shadow minions: magical fire spawn — bright sweep + sparkle crackle
    this.sweep(1200, 400, 0.3, 0.1, 'sine');
    this.sweep(900, 300, 0.25, 0.07, 'triangle');
    this.crackle(0.35, 0.08);
  }
  playBossHit(): void    { this.tone(180, 60, 0.12, 0.12); this.nz(0.08, 0.06); }

  playSuccess(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.toneS(f, i * 0.14, 0.3, 0.10));
  }

  playHealthPickup(): void {
    [440, 554, 659, 880].forEach((f, i) => this.toneS(f, i * 0.1, 0.22, 0.09));
  }

  playGuardSpell(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.toneS(f, i * 0.12, 0.3, 0.08));
  }

  playBossDefeated(): void {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.toneS(f, i * 0.16, 0.35, 0.08));
    this.nz(0.6, 0.04);
  }

  playFanfare(): void {
    [392, 523, 659, 784, 880, 1047, 1175, 1319].forEach((f, i) => this.toneS(f, i * 0.1, 0.35, 0.09));
  }

  // ═════════════ MUSIC (pre-rendered WAV loops via Howler.js) ═════════════

  private musicKey(world: number): string { return `world-${world}-loop`; }

  startMenuMusic(): void    { this.playMusicLoop('menu-loop'); }
  startWorldMusic(w: number): void { this.playMusicLoop(this.musicKey(w)); }
  startPuzzleMusic(): void  { this.playMusicLoop('puzzle-loop'); }
  startVictoryMusic(): void { this.playMusicLoop('victory-loop'); }
  startBossMusic(): void    { this.playMusicLoop('boss-loop'); }

  stopMusic(): void {
    if (this.musicHowl) {
      this.musicHowl.stop();
      this.musicHowl.unload();
      this.musicHowl = null;
      this.activeMusicKey = '';
    }
  }

  fadeOutMusic(ms: number = 600): void {
    if (this.musicHowl) {
      this.musicHowl.fade(this.musicHowl.volume(), 0, ms);
      setTimeout(() => this.stopMusic(), ms + 50);
    }
  }

  private playMusicLoop(key: string): void {
    if (this.muted || key === this.activeMusicKey) return;
    this.stopMusic();
    this.activeMusicKey = key;
    this.musicHowl = new Howl({
      src: [`assets/audio/music/${key}.wav`],
      format: ['wav'],
      loop: true,
      volume: 0.28,
      html5: true,
    });
    this.musicHowl.play();
  }

  // ═════════════ SPEECH ═════════════

  speakWord(language: string, wordId: string): void {
    if (this.muted) return;
    this.playSpeech(`assets/audio/speech/${language}/${wordId}.mp3`);
  }

  speakDialogue(audioPath: string): void {
    if (this.muted || !audioPath) return;
    this.playSpeech(audioPath);
  }

  private playSpeech(path: string): void {
    const now = Date.now();
    if (now - (this.lastSpeechTime.get(path) || 0) < 500) return;
    this.lastSpeechTime.set(path, now);
    let h = this.speechCache.get(path);
    if (h) { h.play(); return; }
    try {
      h = new Howl({ src: [path], format: ['mp3'], volume: this.muted ? 0 : 0.75, html5: true });
      this.speechCache.set(path, h);
      h.play();
    } catch {}
  }

  // ═════════════ CONTROLS ═════════════

  mute(): void {
    this.muted = true;
    localStorage.setItem('shabd_saga_audio_muted', 'true');
    if (this.masterGain) this.masterGain.gain.value = 0;
    this.stopMusic();
  }

  unmute(): void {
    this.muted = false;
    localStorage.setItem('shabd_saga_audio_muted', 'false');
    if (this.masterGain) this.masterGain.gain.value = 1;
  }

  isMuted(): boolean { return this.muted; }

  destroy(): void {
    this.stopMusic();
    this.speechCache.clear();
    this.lastSpeechTime.clear();
    this.masterGain?.disconnect();
    this.sfxGain?.disconnect();
    this.ctx?.close();
    this.ctx = null;
  }
}
