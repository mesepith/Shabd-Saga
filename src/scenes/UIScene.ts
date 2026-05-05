import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private healthDisplay!: Phaser.GameObjects.Text;
  private letterCountText!: Phaser.GameObjects.Text;
  private scoreDisplay!: Phaser.GameObjects.Text;
  private gemDisplay!: Phaser.GameObjects.Text;
  private wordBarBg!: Phaser.GameObjects.Graphics;
  private wordBarTiles: Phaser.GameObjects.Container[] = [];
  private score: number = 0;
  private gems: number = 0;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(data?: { gameScene: GameScene }): void {
    // Ensure UIScene camera is transparent so GameScene shows through
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.cameras.main.transparent = true;

    this.gameScene = data?.gameScene || this.scene.get('GameScene') as GameScene;
    this.wordBarTiles = [];

    const { width, height } = this.cameras.main;
    const padding = 20;

    // HUD background bar (top) — ensures text stays readable over any background
    const hudBg = this.add.rectangle(width / 2, 0, width, 54, 0x000000, 0.55);
    hudBg.setOrigin(0.5, 0).setScrollFactor(0).setDepth(199);

    // DEBUG: red bar to verify UIScene renders (remove once confirmed working)
    this.add.rectangle(width / 2, height * 0.15, 200, 10, 0xff0000, 0.9)
      .setScrollFactor(0).setDepth(998);

    // Health (top-left)
    this.healthDisplay = this.add.text(padding, padding, '\u2665 \u2665 \u2665', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '26px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(200);

    // Letter counter
    this.letterCountText = this.add.text(padding, padding + 32, 'Letters: 0', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '15px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(200);

    // Gem counter
    this.gemDisplay = this.add.text(padding + 110, padding + 32, '\uD83D\uDC8E 0', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '15px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(200);

    // Score (top-right)
    this.scoreDisplay = this.add.text(width - padding, padding, 'Score: 0', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);

    // Pause button
    const pauseBtn = this.add.text(width - padding, padding + 32, '\u23F8 Pause', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '15px',
      color: '#AAAACC',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      this.scene.pause('GameScene');
      this.showPauseMenu();
    });

    // Fullscreen button (touch devices — hides browser chrome for app-like feel)
    if (this.sys.game.device.input.touch) {
      const deviceInfo = (window as any).__shabd_device || {};
      const isIOS = deviceInfo.isIOS;
      const isAndroid = deviceInfo.isAndroid;

      const fsX = padding;
      const fsY = padding + 68;
      const btnW = isIOS ? 90 : 68;
      const label = isIOS ? '📲 Add' : '⛶ Full';

      const fsBtn = this.add.rectangle(fsX + btnW / 2, fsY, btnW, 28, 0x334466, 0.8)
        .setStrokeStyle(2, 0x556688).setScrollFactor(0).setDepth(200)
        .setInteractive({ useHandCursor: true });

      const fsTxt = this.add.text(fsX + btnW / 2, fsY, label, {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '12px',
        color: '#CCCCEE',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

      fsBtn.on('pointerdown', () => {
        if (isIOS) {
          // iOS Safari doesn't support Fullscreen API outside PWA mode.
          // Best we can do: show instruction + scroll-to-hide address bar.
          window.scrollTo(0, 1);
          // Brief message (reuse existing showMessage pattern — fallback alert)
          const msg = this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.5,
            'Add to Home Screen\nfor fullscreen 📲',
            {
              fontFamily: 'Noto Sans, system-ui, sans-serif',
              fontSize: '20px', color: '#FFD700',
              backgroundColor: '#000000cc',
              padding: { x: 16, y: 10 },
              align: 'center',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
          this.time.delayedCall(2500, () => msg.destroy());
        } else if (!document.fullscreenElement) {
          // Android Chrome / other browsers: Fullscreen API works
          document.documentElement.requestFullscreen().catch(() => {
            window.scrollTo(0, 1);
          });
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // WordBar background (bottom of screen)
    this.createWordBar();

    // Listen for letter collection, steal, consumption, and gems
    this.gameScene.events.on('letterCollected', this.onLetterCollected, this);
    this.gameScene.events.on('letterStolen', this.onLetterStolen, this);
    this.gameScene.events.on('letterConsumed', this.onLetterConsumed, this);
    this.gameScene.events.on('gemCollected', this.onGemCollected, this);
  }

  private createWordBar(): void {
    const { width, height } = this.cameras.main;
    const barY = height - 12;
    const barWidth = Math.min(900, width - 80);
    const barX = (width - barWidth) / 2;

    this.wordBarBg = this.add.graphics();
    this.wordBarBg.setScrollFactor(0).setDepth(200);
    this.wordBarBg.fillStyle(0x0a0a1e, 0.85);
    this.wordBarBg.fillRoundedRect(barX, barY - 16, barWidth, 32, 8);
    this.wordBarBg.lineStyle(2, 0x334466, 0.6);
    this.wordBarBg.strokeRoundedRect(barX, barY - 16, barWidth, 32, 8);
  }

  private onLetterCollected(data: {
    letter: string;
    wordId: string;
    wordScript: string;
    translation: string;
    totalLetters: number;
  }): void {
    this.score += 100;
    this.letterCountText.setText(`Letters: ${data.totalLetters}`);
    this.scoreDisplay.setText(`Score: ${this.score}`);

    // Add tile to WordBar
    this.addWordBarTile(data.letter, data.wordScript, data.wordId);

    // Pulse
    this.tweens.add({
      targets: this.letterCountText,
      scaleX: 1.3, scaleY: 1.3,
      duration: 100, yoyo: true, ease: 'Quad.easeOut',
    });
  }

  private onLetterStolen(data: {
    letter: string;
    totalLetters: number;
  }): void {
    this.letterCountText.setText(`Letters: ${data.totalLetters}`);

    // Remove last tile from WordBar
    if (this.wordBarTiles.length > 0) {
      const tile = this.wordBarTiles.pop()!;
      this.tweens.add({
        targets: tile,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => tile.destroy(),
      });
    }
  }

  private onLetterConsumed(data: { remaining: number; wordId: string }): void {
    this.letterCountText.setText(`Letters: ${data.remaining}`);

    // Remove tiles for the consumed word from WordBar
    this.wordBarTiles = this.wordBarTiles.filter((tile) => {
      if ((tile as any).wordId === data.wordId) {
        this.tweens.add({
          targets: tile,
          alpha: 0, scaleX: 0, scaleY: 0,
          duration: 300,
          ease: 'Quad.easeIn',
          onComplete: () => tile.destroy(),
        });
        return false;
      }
      return true;
    });

    // Shift remaining tiles to fill gaps
    this.rebuildWordBarLayout();
  }

  private rebuildWordBarLayout(): void {
    const { width, height } = this.cameras.main;
    const barY = height - 12;
    const barWidth = Math.min(900, width - 80);
    const barX = (width - barWidth) / 2;
    const tileSize = 28;
    const gap = 4;

    this.wordBarTiles.forEach((tile, i) => {
      const startX = barX + 16 + i * (tileSize + gap);
      this.tweens.add({
        targets: tile,
        x: startX,
        duration: 200,
        ease: 'Quad.easeOut',
      });
    });
  }

  private onGemCollected(_count: number): void {
    this.gems++;
    this.gemDisplay.setText(`💎 ${this.gems}`);

    this.tweens.add({
      targets: this.gemDisplay,
      scaleX: 1.3, scaleY: 1.3,
      duration: 100, yoyo: true, ease: 'Quad.easeOut',
    });
  }

  private addWordBarTile(letter: string, wordHint: string, wordId?: string): void {
    const { width, height } = this.cameras.main;
    const barY = height - 12;
    const barWidth = Math.min(900, width - 80);
    const barX = (width - barWidth) / 2;
    const tileSize = 28;
    const gap = 4;
    const startX = barX + 16 + this.wordBarTiles.length * (tileSize + gap);

    const tile = this.add.container(startX, barY);

    const bg = this.add.graphics();
    bg.fillStyle(0x3D3D6B, 1);
    bg.fillRoundedRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, 4);
    bg.lineStyle(1, 0x6666AA, 0.8);
    bg.strokeRoundedRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, 4);

    const charText = this.add.text(0, 0, letter, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '15px',
      color: '#FFD700',
    }).setOrigin(0.5);

    tile.add([bg, charText]);
    tile.setScrollFactor(0).setDepth(201);
    tile.setAlpha(0).setScale(0.5);
    (tile as any).wordId = wordId;

    // Pop-in animation
    this.tweens.add({
      targets: tile,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 250, ease: 'Back.easeOut',
    });

    this.wordBarTiles.push(tile);
  }

  private showPauseMenu(): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setDepth(300).setScrollFactor(0);

    const panel = this.add.rectangle(width / 2, height / 2, 360, 340, 0x1a1a3e, 0.95)
      .setStrokeStyle(2, 0x4444AA).setDepth(301).setScrollFactor(0);

    const title = this.add.text(width / 2, height / 2 - 120, '⏸ Paused', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '32px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(302).setScrollFactor(0);

    const cleanup = () => {
      overlay.destroy(); panel.destroy(); title.destroy();
      this.scene.resume('GameScene');
    };

    this.createPauseBtn(width / 2, height / 2 - 40, '▶ Resume', cleanup);
    this.createPauseBtn(width / 2, height / 2 + 20, '↺ Restart', () => {
      cleanup();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });
    this.createPauseBtn(width / 2, height / 2 + 80, '🚪 Quit', () => {
      cleanup();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('LevelSelectScene');
    });
  }

  private createPauseBtn(x: number, y: number, text: string, cb: () => void): void {
    const w = 260, h = 44;
    const btn = this.add.rectangle(x, y, w, h, 0x334466, 1)
      .setStrokeStyle(2, 0x556688).setDepth(302).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, text, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px', color: '#CCCCEE',
    }).setOrigin(0.5).setDepth(303).setScrollFactor(0);

    btn.on('pointerover', () => { btn.setFillStyle(0x445577); txt.setColor('#FFFFFF'); });
    btn.on('pointerout', () => { btn.setFillStyle(0x334466); txt.setColor('#CCCCEE'); });
    btn.on('pointerdown', cb);
  }

  update(): void {
    if (this.gameScene?.scene.isActive()) {
      const health = this.gameScene.getHealth();
      const hearts = '♥'.repeat(Math.max(0, health)) + '♡'.repeat(Math.max(0, 3 - health));
      this.healthDisplay.setText(hearts);
    }
  }
}
