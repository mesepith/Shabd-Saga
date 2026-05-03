import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';

const game = new Phaser.Game(GameConfig);

// Handle window resize for responsive scaling
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// Handle visibility change — resume audio context on return
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Resume audio context if suspended
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
