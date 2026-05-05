import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { Howler } from 'howler';

const game = new Phaser.Game(GameConfig);

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = /android/i.test(navigator.userAgent);
const isTouch = isIOS || isAndroid || (navigator.maxTouchPoints > 0);

// ── iOS / touch: Unlock Web Audio on first user gesture ───────────────
// iOS Safari suspends AudioContext until user gesture. Phaser's
// WebAudioSoundManager and Howler.js each have their own context.
// Just resume() is NOT enough — some iOS versions require playing
// a silent buffer through the context to truly unlock it.

let silentBufferPlayed = false;

function unlockAudio(): void {
  // 1) Phaser's audio context
  const sm = game.sound;
  if (sm && (sm as any).context) {
    const ctx = (sm as any).context as AudioContext;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (silentBufferPlayed) return;
        silentBufferPlayed = true;
        // Play silent buffer — required on iOS to fully unlock
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
        } catch (_) {}
      }).catch(() => {});
    }
  }

  // 2) Howler.js audio context (separate from Phaser's)
  try {
    if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch(() => {});
    }
  } catch (_) {}
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

if (fsBtn && isTouch) {
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
  document.body.addEventListener('touchend', () => {
    setTimeout(() => window.scrollTo(0, 1), 100);
  }, { once: true, passive: true });
}

export default game;
