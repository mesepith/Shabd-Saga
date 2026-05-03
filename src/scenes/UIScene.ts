import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private healthDisplay!: Phaser.GameObjects.Text;
  private letterDisplay!: Phaser.GameObjects.Text;
  private scoreDisplay!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;

  private collectedLetters: number = 0;
  private totalLetters: number = 0;
  private score: number = 0;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(data?: { gameScene: GameScene }): void {
    this.gameScene = data?.gameScene || this.scene.get('GameScene') as GameScene;

    const { width } = this.cameras.main;
    const padding = 20;

    // Health display (top-left)
    this.healthDisplay = this.add.text(padding, padding, '♥ ♥ ♥', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.healthDisplay.setScrollFactor(0);
    this.healthDisplay.setDepth(200);

    // Letter counter (top-left, below health)
    this.letterDisplay = this.add.text(padding, padding + 40, 'Letters: 0 / 0', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.letterDisplay.setScrollFactor(0);
    this.letterDisplay.setDepth(200);

    // Score (top-right)
    this.scoreDisplay = this.add.text(width - padding, padding, 'Score: 0', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.scoreDisplay.setOrigin(1, 0);
    this.scoreDisplay.setScrollFactor(0);
    this.scoreDisplay.setDepth(200);

    // Pause button (top-right, below score)
    this.pauseButton = this.add.text(width - padding, padding + 35, '⏸ Pause', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#AAAACC',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(200);
    this.pauseButton.setInteractive({ useHandCursor: true });

    this.pauseButton.on('pointerdown', () => {
      this.scene.pause('GameScene');
      this.showPauseMenu();
    });

    // Listen for game events
    this.gameScene.events.on('letterCollected', this.onLetterCollected, this);
  }

  private onLetterCollected(data: { index: number; total: number }): void {
    this.collectedLetters++;
    this.totalLetters = data.total;
    this.score += 100;

    this.letterDisplay.setText(`Letters: ${this.collectedLetters} / ${this.totalLetters}`);
    this.scoreDisplay.setText(`Score: ${this.score}`);

    // Pulse animation on letter count
    this.tweens.add({
      targets: this.letterDisplay,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private showPauseMenu(): void {
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    overlay.setDepth(300);
    overlay.setScrollFactor(0);

    // Pause panel
    const panel = this.add.rectangle(width / 2, height / 2, 360, 340, 0x1a1a3e, 0.95);
    panel.setStrokeStyle(2, 0x4444AA);
    panel.setDepth(301);
    panel.setScrollFactor(0);

    // Title
    const title = this.add.text(width / 2, height / 2 - 120, '⏸ Paused', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '32px',
      color: '#FFFFFF',
    });
    title.setOrigin(0.5);
    title.setDepth(302);
    title.setScrollFactor(0);

    // Resume button
    this.createPauseButton(width / 2, height / 2 - 40, '▶ Resume', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      this.scene.resume('GameScene');
    });

    // Restart button
    this.createPauseButton(width / 2, height / 2 + 20, '↺ Restart Level', () => {
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });

    // Quit button
    this.createPauseButton(width / 2, height / 2 + 80, '🚪 Quit to Menu', () => {
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('LevelSelectScene');
    });
  }

  private createPauseButton(x: number, y: number, text: string, callback: () => void): void {
    const btnWidth = 260;
    const btnHeight = 44;

    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, 0x334466, 1);
    btn.setStrokeStyle(2, 0x556688);
    btn.setDepth(302);
    btn.setScrollFactor(0);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(x, y, text, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#CCCCEE',
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(303);
    btnText.setScrollFactor(0);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x445577);
      btnText.setColor('#FFFFFF');
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(0x334466);
      btnText.setColor('#CCCCEE');
    });

    btn.on('pointerdown', callback);
  }

  update(): void {
    // Update health display from game scene
    if (this.gameScene && this.gameScene.scene.isActive()) {
      const health = this.gameScene.getHealth();
      const hearts = '♥'.repeat(Math.max(0, health)) + '♡'.repeat(Math.max(0, 3 - health));
      this.healthDisplay.setText(hearts);
    }
  }
}
