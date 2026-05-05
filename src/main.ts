import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

const game = new Phaser.Game(GameConfig);

// ── Viewport sizing (visualViewport API — correct on all browsers) ─────

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);

function applyViewportSize(): void {
  const container = document.getElementById('game-container');
  if (!container) return;

  // visualViewport gives the ACTUAL visible area (excludes system UI overlays
  // like Android nav bar, iOS Safari toolbars). Widely supported on mobile.
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  container.style.width = vw + 'px';
  container.style.height = vh + 'px';
}

// Resize handlers
window.addEventListener('resize', applyViewportSize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', applyViewportSize);
  window.visualViewport.addEventListener('scroll', applyViewportSize);
}

// Apply ASAP, then again after layout settles
applyViewportSize();
window.addEventListener('load', () => {
  // Re-measure after CSS/fonts loaded
  setTimeout(applyViewportSize, 50);
  setTimeout(applyViewportSize, 250);
  // Force Phaser Scale manager to recalculate from the now-correct parent size
  if ((game.scale as any).refresh) {
    (game.scale as any).refresh();
  }
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

// ── Expose device info for UIScene fullscreen button ──────────────────

(window as any).__shabd_device = { isIOS, isAndroid };

// ── iOS Safari: hide address bar on first tap (Fullscreen API unsupported) ──

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
