import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { TransitionManager } from '../systems/TransitionManager';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private playButton!: Phaser.GameObjects.Container;
  private languageSelector!: Phaser.GameObjects.Container;
  private creditsText!: Phaser.GameObjects.Text;

  private currentLanguage: string = 'hindi';
  private languages: { id: string; name: string }[] = [
    { id: 'hindi', name: 'हिन्दी' },
  ];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(TransitionManager.FADE_DURATION);

    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Animated background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, 0, width, height);

    // Floating particle effect in background
    this.createAmbientParticles();

    // Title
    this.titleText = this.add.text(centerX, height * 0.2, 'शब्द सागा', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '72px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    });
    this.titleText.setOrigin(0.5);

    // Fade in animation
    this.titleText.setAlpha(0);
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: height * 0.2 + 10,
      duration: 1200,
      ease: 'Bounce.easeOut',
    });

    // Subtitle
    this.subtitleText = this.add.text(centerX, height * 0.35, 'Shabd Saga', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '36px',
      color: '#CCAADD',
      fontStyle: 'italic',
    });
    this.subtitleText.setOrigin(0.5);
    this.subtitleText.setAlpha(0);
    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      delay: 600,
      duration: 800,
    });

    // Tagline
    const tagline = this.add.text(centerX, height * 0.43, 'Learn Hindi through Adventure!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#9999CC',
    });
    tagline.setOrigin(0.5);
    tagline.setAlpha(0);
    this.tweens.add({
      targets: tagline,
      alpha: 1,
      delay: 1000,
      duration: 800,
    });

    // How to Play button
    this.createHowToPlayButton(centerX, height * 0.51);

    // Language selector
    this.createLanguageSelector(centerX, height * 0.55);

    // Play button
    this.createPlayButton(centerX, height * 0.68);

    // Credits
    this.creditsText = this.add.text(centerX, height * 0.92, 'Built with ♥ for NRI Kids', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '12px',
      color: '#665588',
    });
    this.creditsText.setOrigin(0.5);

    // Audio will unlock on first user interaction (browser autoplay policy)
    // then start menu music via Web Audio synthesis
    this.input.once('pointerdown', () => {
      AudioManager.getInstance().resume();
      AudioManager.getInstance().startMenuMusic();
    });
  }

  private createHowToPlayButton(x: number, y: number): void {
    const label = this.add.text(x, y, '📖 How to Play', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
    });
    label.setOrigin(0.5);
    label.setInteractive({ useHandCursor: true });

    label.on('pointerover', () => label.setColor('#FFEE88'));
    label.on('pointerout', () => label.setColor('#FFD700'));
    label.on('pointerdown', () => {
      TransitionManager.toScene(this, 'HowToPlayScene');
    });

    // Subtle underline
    const underline = this.add.rectangle(x, y + 16, label.width + 20, 2, 0xFFD700, 0.3);
    this.tweens.add({
      targets: underline,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createLanguageSelector(x: number, y: number): void {
    const label = this.add.text(x, y, 'Language:', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#AAAACC',
    });
    label.setOrigin(0.5);

    this.languageSelector = this.add.container(x, y + 35);

    this.languages.forEach((lang, index) => {
      const offsetX = (index - (this.languages.length - 1) / 2) * 120;

      const btnBg = this.add.graphics();
      const isSelected = lang.id === this.currentLanguage;
      btnBg.fillStyle(isSelected ? 0x4444AA : 0x222244, 1);
      btnBg.fillRoundedRect(-55, -20, 110, 40, 10);
      if (isSelected) {
        btnBg.lineStyle(2, 0x66CCFF, 1);
        btnBg.strokeRoundedRect(-55, -20, 110, 40, 10);
      }

      const btnText = this.add.text(0, 0, lang.name, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '18px',
        color: isSelected ? '#FFFFFF' : '#8888AA',
      });
      btnText.setOrigin(0.5);

      const btn = this.add.container(offsetX, 0, [btnBg, btnText]);
      btn.setSize(110, 40);
      btn.setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (lang.id !== this.currentLanguage) {
          btnBg.clear();
          btnBg.fillStyle(0x333366, 1);
          btnBg.fillRoundedRect(-55, -20, 110, 40, 10);
          btnBg.lineStyle(2, 0x66CCFF, 1);
          btnBg.strokeRoundedRect(-55, -20, 110, 40, 10);
        }
      });

      btn.on('pointerout', () => {
        btnBg.clear();
        const active = lang.id === this.currentLanguage;
        btnBg.fillStyle(active ? 0x4444AA : 0x222244, 1);
        btnBg.fillRoundedRect(-55, -20, 110, 40, 10);
        if (active) {
          btnBg.lineStyle(2, 0x66CCFF, 1);
          btnBg.strokeRoundedRect(-55, -20, 110, 40, 10);
        }
      });

      btn.on('pointerdown', () => {
        this.currentLanguage = lang.id;
        // Refresh selector visuals
        this.languageSelector.destroy();
        this.createLanguageSelector(this.cameras.main.width / 2, this.cameras.main.height * 0.55);
      });

      this.languageSelector.add(btn);
    });
  }

  private createPlayButton(x: number, y: number): void {
    const btnWidth = 220;
    const btnHeight = 60;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x44AA44, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    btnBg.lineStyle(3, 0x66DD66, 1);
    btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);

    const btnText = this.add.text(0, 0, '▶  Play Adventure', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    this.playButton = this.add.container(x, y, [btnBg, btnText]);
    this.playButton.setSize(btnWidth, btnHeight);
    this.playButton.setInteractive({ useHandCursor: true });

    // Pulsing glow effect
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.playButton.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x55CC55, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
      btnBg.lineStyle(3, 0x88FF88, 1);
      btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    });

    this.playButton.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x44AA44, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
      btnBg.lineStyle(3, 0x66DD66, 1);
      btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    });

    this.playButton.on('pointerdown', () => {
      TransitionManager.toScene(this, 'LevelSelectScene', { language: this.currentLanguage } as any);
    });
  }

  private createAmbientParticles(): void {
    // Create floating light motes for atmosphere
    const { width, height } = this.cameras.main;
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 5);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);

      const mote = this.add.circle(x, y, size, 0xFFD700, alpha);

      this.tweens.add({
        targets: mote,
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        onRepeat: () => {
          mote.x = Phaser.Math.Between(0, width);
          mote.y = Phaser.Math.Between(height * 0.5, height);
          mote.setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
        },
      });
    }
  }
}
