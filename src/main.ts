import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

const game = new Phaser.Game(GameConfig);

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);
const isTouch = isIOS || isAndroid || (navigator.maxTouchPoints > 0);

// ── DOM Fullscreen button (real DOM click = genuine user gesture) ─────

const fsBtn = document.getElementById('fs-btn') as HTMLButtonElement | null;

function showFsTip(msg: string): void {
  const tip = document.getElementById('fs-tip');
  if (!tip) return;
  tip.textContent = msg;
  tip.style.display = 'block';
  setTimeout(() => { tip.style.display = 'none'; }, 2500);
}

if (fsBtn && isTouch) {
  // Show only on touch devices
  fsBtn.style.display = 'block';

  if (isIOS) {
    fsBtn.textContent = '📲 Add to Home Screen';
  }

  fsBtn.addEventListener('click', () => {
    if (isIOS) {
      // iOS Safari: Fullscreen API not supported outside PWA mode
      showFsTip('Add to Home Screen\nfor fullscreen 📲');
      window.scrollTo(0, 1);
      return;
    }

    // Android / other: Fullscreen API works with real DOM click
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          if (fsBtn) fsBtn.style.display = 'none';
        })
        .catch(() => {
          window.scrollTo(0, 1);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          if (fsBtn) fsBtn.style.display = 'block';
        })
        .catch(() => {});
    }
  });
}

// Re-show button when exiting fullscreen (e.g. swipe-to-exit on Android)
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && fsBtn && isTouch) {
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
  document.addEventListener('pointerdown', () => {
    setTimeout(() => window.scrollTo(0, 1), 100);
  }, { once: true });
}

// ── Visibility — resume audio context on return ──────────────────────

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const gi = game;
    if (gi && gi.sound && (gi.sound as any).context) {
      try {
        const ctx = (gi.sound as any).context;
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { /* ignore */ }
    }
  }
});

export default game;
