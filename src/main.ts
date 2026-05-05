import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

const game = new Phaser.Game(GameConfig);

// ── Orientation / rotate-prompt ──────────────────────────────────────

function checkOrientation(): void {
  const prompt = document.getElementById('rotate-prompt');
  if (!prompt) return;
  const isPortrait = window.innerWidth < window.innerHeight;
  prompt.style.display = isPortrait ? 'flex' : 'none';
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  // orientationchange fires before resize on some browsers — defer
  setTimeout(checkOrientation, 50);
});
checkOrientation();

// ── Visibility — resume audio context on return ──────────────────────

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const gameInstance = game;
    if (gameInstance && gameInstance.sound && (gameInstance.sound as any).context) {
      try {
        const ctx = (gameInstance.sound as any).context;
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { /* ignore */ }
    }
  }
});

export default game;
