import Phaser from 'phaser';
import { LanguageManager } from '../systems/LanguageManager';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private tipText!: Phaser.GameObjects.Text;

  private tips: string[] = [
    'Collect letters to unlock doors!',
    'Talk to friendly animals — they teach new words!',
    'Watch out for shadow creatures — they steal letters!',
    'Spell the word correctly and the door opens!',
    'Hidden gems give bonus stars!',
  ];

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222244, 0.8);
    this.progressBox.fillRoundedRect(centerX - 200, centerY - 25, 400, 50, 12);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 60, 'Loading Shabd Saga...', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    // Random tip
    const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
    this.tipText = this.add.text(centerX, centerY + 60, randomTip, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#aaaaee',
      wordWrap: { width: 500 },
      align: 'center',
    });
    this.tipText.setOrigin(0.5);

    // Progress events
    this.load.on('progress', this.updateProgressBar, this);
    this.load.on('complete', this.onLoadComplete, this);

    // Load core assets
    this.loadAssets();
  }

  private loadAssets(): void {
    // Load language configurations
    // This will be dynamic once LanguageManager is implemented
    // For now, load placeholder assets for the menu

    // UI assets
    this.load.image('button-play', 'assets/ui/button-play.png');
    this.load.image('button-settings', 'assets/ui/button-settings.png');
    this.load.image('panel-bg', 'assets/ui/panel-bg.png');
    this.load.image('star-gold', 'assets/ui/star-gold.png');
    this.load.image('star-empty', 'assets/ui/star-empty.png');
    this.load.image('heart-full', 'assets/ui/heart-full.png');
    this.load.image('heart-empty', 'assets/ui/heart-empty.png');
    this.load.image('gem-icon', 'assets/ui/gem-icon.png');

    // World map assets (for level select)
    this.load.image('map-node', 'assets/ui/map-node.png');
    this.load.image('map-node-locked', 'assets/ui/map-node-locked.png');
    this.load.image('map-connector', 'assets/ui/map-connector.png');

    // Sprites
    this.load.image('bg-placeholder', 'assets/backgrounds/world-1/sky.png');
    this.load.image('player-placeholder', 'assets/sprites/player/idle.png');
    this.load.image('platform-placeholder', 'assets/tilesets/platform-grass.png');
    this.load.image('letter-placeholder', 'assets/sprites/letters/placeholder.png');
    this.load.image('door-placeholder', 'assets/sprites/props/door.png');
    this.load.image('npc-placeholder', 'assets/sprites/npcs/owl.png');

    // Player spritesheets
    this.load.spritesheet('player-idle-sheet', 'assets/sprites/player/idle-sheet.png', {
      frameWidth: 64, frameHeight: 64,
    });
    this.load.spritesheet('player-run-sheet', 'assets/sprites/player/run-sheet.png', {
      frameWidth: 64, frameHeight: 64,
    });

    // Enemy sprites
    this.load.image('shadow-creeper', 'assets/sprites/enemies/shadow-creeper.png');
    this.load.image('enemy-placeholder', 'assets/sprites/enemies/shadow-creeper.png');

    // Boss spritesheets (128x128 per frame)
    this.load.spritesheet('boss-jungle-sheet', 'assets/sprites/boss/boss-jungle-sheet.png', {
      frameWidth: 128, frameHeight: 128,
    });
    this.load.spritesheet('boss-village-sheet', 'assets/sprites/boss/boss-village-sheet.png', {
      frameWidth: 128, frameHeight: 128,
    });
    this.load.spritesheet('boss-palace-sheet', 'assets/sprites/boss/boss-palace-sheet.png', {
      frameWidth: 128, frameHeight: 128,
    });

    // NPC sprites
    this.load.image('npc-owl', 'assets/sprites/npcs/owl.png');
    this.load.image('npc-monkey', 'assets/sprites/npcs/monkey.png');
    this.load.image('npc-deer', 'assets/sprites/npcs/deer.png');

    // Checkpoint flag
    this.load.image('gem-icon', 'assets/ui/gem-icon.png');

    // Audio: SFX and music are generated at runtime via Web Audio API (AudioManager).
    // No MP3 files to load — zero download, instant, consistent across all browsers.
  }

  private updateProgressBar(value: number): void {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x66ccff, 1);
    this.progressBar.fillRoundedRect(
      centerX - 195,
      this.cameras.main.height / 2 - 20,
      390 * value,
      40,
      10
    );

    this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
  }

  private onLoadComplete(): void {
    // Initialize the language manager
    // LanguageManager.getInstance().loadLanguage('hindi');

    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }
}
