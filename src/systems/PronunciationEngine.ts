/**
 * PronunciationEngine — Plays pre-generated word pronunciation audio.
 *
 * Uses Howler.js for cross-browser audio playback.
 * Falls back to Web Speech API if pre-generated audio is not available.
 */

import { Howl } from 'howler';

export class PronunciationEngine {
  private static instance: PronunciationEngine;
  private audioCache: Map<string, Howl> = new Map();
  private currentVoice: string = '';
  private isMuted: boolean = false;
  private volume: number = 0.8;

  private constructor() {}

  static getInstance(): PronunciationEngine {
    if (!PronunciationEngine.instance) {
      PronunciationEngine.instance = new PronunciationEngine();
    }
    return PronunciationEngine.instance;
  }

  /**
   * Set the TTS voice for Web Speech API fallback.
   */
  setVoice(voice: string): void {
    this.currentVoice = voice;
  }

  /**
   * Set volume (0.0 to 1.0).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Mute/unmute.
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Play pronunciation of a word.
   * Tries pre-generated audio first, falls back to Web Speech API.
   */
  speak(audioPath: string, text: string, lang?: string): void {
    if (this.isMuted) return;

    if (audioPath && audioPath.length > 0) {
      this.playAudioFile(audioPath);
    } else {
      this.speakViaWebSpeech(text, lang);
    }
  }

  /**
   * Play a pre-generated audio file via Howler.js.
   */
  private playAudioFile(audioPath: string): void {
    let howl = this.audioCache.get(audioPath);

    if (!howl) {
      howl = new Howl({
        src: [audioPath],
        volume: this.volume,
        format: ['mp3'],
        onloaderror: (_id: number, error: unknown) => {
          console.warn(`Failed to load audio: ${audioPath}`, error);
        },
      });
      this.audioCache.set(audioPath, howl);
    }

    howl.volume(this.volume);
    howl.play();
  }

  /**
   * Speak text using the Web Speech API (fallback).
   */
  private speakViaWebSpeech(text: string, lang?: string): void {
    if (!('speechSynthesis' in window)) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language (e.g., "hi-IN" for Hindi)
    if (lang) {
      utterance.lang = lang;
    } else {
      // Extract language code from voice name
      // e.g., "Lekha (Enhanced)" has locale hi_IN
      utterance.lang = 'hi-IN';
    }

    utterance.rate = 0.85; // Slightly slower for learners
    utterance.volume = this.volume;

    // Try to find a matching voice
    if (this.currentVoice) {
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.name.includes(this.currentVoice));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Preload an audio file into cache.
   */
  preload(audioPath: string): void {
    if (this.audioCache.has(audioPath)) return;

    const howl = new Howl({
      src: [audioPath],
      volume: 0, // Silent preload
      preload: true,
      format: ['mp3'],
    });
    this.audioCache.set(audioPath, howl);
  }

  /**
   * Stop all current audio.
   */
  stopAll(): void {
    this.audioCache.forEach((howl) => howl.stop());
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Clear the audio cache (frees memory).
   */
  clearCache(): void {
    this.audioCache.forEach((howl) => howl.unload());
    this.audioCache.clear();
  }
}
