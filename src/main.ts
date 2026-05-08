import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { AudioManager } from './systems/AudioManager';

const game = new Phaser.Game(GameConfig);
(window as any).game = game;

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);
const isTouch = isIOS || isAndroid || (navigator.maxTouchPoints > 0);

// ── iOS / touch: Unlock Web Audio on first user gesture ───────────────
// Delegates to AudioManager which handles both Web Audio API context
// and Howler.js context resume.

function unlockAudio(): void {
  AudioManager.getInstance().resume();
}

// Listen on body (not canvas) so Phaser's event handling doesn't interfere
document.body.addEventListener('touchend', unlockAudio, { once: false, passive: true });
document.body.addEventListener('pointerdown', unlockAudio, { once: false, passive: true });
document.body.addEventListener('click', unlockAudio, { once: false, passive: true });

// Also try on visibility return
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) unlockAudio();
});

// ── DOM Fullscreen button (real DOM click = genuine user gesture) ─────

const fsBtn = document.getElementById('fs-btn') as HTMLButtonElement | null;

function showFsTip(msg: string): void {
  const tip = document.getElementById('fs-tip');
  if (!tip) return;
  tip.textContent = msg;
  tip.style.display = 'block';
  setTimeout(() => { tip.style.display = 'none'; }, 2500);
}

const isStandalone = (typeof navigator !== 'undefined' && (navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;

if (fsBtn && isTouch && !isStandalone) {
  fsBtn.style.display = 'block';

  if (isIOS) {
    fsBtn.textContent = '📲 Add to Home Screen';
  }

  fsBtn.addEventListener('click', () => {
    if (isIOS) {
      showFsTip('Add to Home Screen\nfor fullscreen 📲');
      window.scrollTo(0, 1);
      return;
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => { if (fsBtn) fsBtn.style.display = 'none'; })
        .catch(() => { window.scrollTo(0, 1); });
    } else {
      document.exitFullscreen()
        .then(() => { if (fsBtn) fsBtn.style.display = 'block'; })
        .catch(() => {});
    }
  });
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && fsBtn && isTouch && !isStandalone) {
    fsBtn.style.display = 'block';
  }
});

// ── Phaser scale re-measure after page fully settles ──────────────────

window.addEventListener('load', () => {
  setTimeout(() => {
    if ((game.scale as any).refresh) {
      (game.scale as any).refresh();
    }
  }, 100);
});

// ── Orientation / rotate-prompt ──────────────────────────────────────

function checkOrientation(): void {
  const prompt = document.getElementById('rotate-prompt');
  if (!prompt) return;
  const isPortrait = window.innerWidth < window.innerHeight;
  prompt.style.display = isPortrait ? 'flex' : 'none';
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 50);
});
checkOrientation();

// ── iOS Safari: hide address bar on first tap ─────────────────────────

if (isIOS) {
  document.body.addEventListener('touchend', () => {
    setTimeout(() => window.scrollTo(0, 1), 100);
  }, { once: true, passive: true });
}

export default game;
