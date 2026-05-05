import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { WordPuzzleScene } from '../scenes/WordPuzzleScene';
import { DialogueScene } from '../scenes/DialogueScene';
import { BossScene } from '../scenes/BossScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    min: { width: 640, height: 360 },
    max: { width: 1920, height: 1080 },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  input: {
    activePointers: 3, // Support multi-touch (joystick + jump + extra)
    keyboard: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    BossScene,
    UIScene,
    WordPuzzleScene,
    DialogueScene,
  ],
};
