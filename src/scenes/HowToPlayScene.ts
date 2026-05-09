import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager';

export class HowToPlayScene extends Phaser.Scene {
  private isMobile: boolean = false;
  private stepIndex: number = 0;
  private stepTexts: string[] = [];
  private stepTitle!: Phaser.GameObjects.Text;
  private stepDesc!: Phaser.GameObjects.Text;
  private stepCounter!: Phaser.GameObjects.Text;
  private prevBtn!: Phaser.GameObjects.Container;
  private nextBtn!: Phaser.GameObjects.Container;
  private backBtn!: Phaser.GameObjects.Container;
  private demoChar!: Phaser.GameObjects.Rectangle;
  private demoLetter!: Phaser.GameObjects.Container;
  private controlIndicators: Phaser.GameObjects.GameObject[] = [];
  private joystickDemo!: Phaser.GameObjects.Container;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private demoMoveDir: number = 0;
  private demoJumping: boolean = false;
  private demoCharX: number = 0;
  private demoCharY: number = 0;
  private groundY: number = 0;
  private demoVelY: number = 0;
  private demoOnGround: boolean = true;
  private arrowGraphics: Phaser.GameObjects.Graphics[] = [];
  private pulseTimers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super({ key: 'HowToPlayScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(TransitionManager.FADE_DURATION);
    const { width, height } = this.cameras.main;
    this.isMobile = this.sys.game.device.input.touch || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

    this.stepIndex = 0;
    this.buildSteps();
    this.controlIndicators = [];
    this.arrowGraphics = [];
    this.pulseTimers = [];

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative border
    const border = this.add.graphics();
    border.lineStyle(2, 0xFFD700, 0.25);
    border.strokeRect(16, 16, width - 32, height - 32);
    border.lineStyle(1, 0xFFD700, 0.1);
    border.strokeRect(20, 20, width - 40, height - 40);

    // Floating particles
    for (let i = 0; i < 20; i++) {
      const mote = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.Between(1, 3), 0xFFD700, Phaser.Math.FloatBetween(0.05, 0.2));
      this.tweens.add({ targets: mote, y: mote.y - Phaser.Math.Between(40, 120), alpha: 0, duration: Phaser.Math.Between(2000, 5000), repeat: -1, delay: Phaser.Math.Between(0, 3000), onRepeat: () => { mote.x = Phaser.Math.Between(0, width); mote.y = Phaser.Math.Between(height * 0.3, height); mote.setAlpha(Phaser.Math.FloatBetween(0.05, 0.2)); } });
    }

    // Header
    const title = this.add.text(width / 2, 36, 'How to Play', {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '36px', color: '#FFD700',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Device badge
    const deviceLabel = this.isMobile ? '📱 Mobile Controls' : '⌨️ Desktop Controls';
    const deviceBadge = this.add.text(width / 2, 72, deviceLabel, {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '16px', color: '#AAAACC',
    }).setOrigin(0.5);

    // Close button
    this.backBtn = this.createButton(width - 90, 36, '✕ Close', 0x553366, () => {
      TransitionManager.toScene(this, 'MenuScene');
    });
    this.backBtn.setScale(0.8);

    // Step section title (center-top area)
    this.stepTitle = this.add.text(width / 2, height * 0.18, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '22px', color: '#FFFFFF',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.stepDesc = this.add.text(width / 2, height * 0.18 + 32, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '14px', color: '#CCCCDD',
      wordWrap: { width: width * 0.7 }, align: 'center',
    }).setOrigin(0.5, 0);

    // Step counter
    this.stepCounter = this.add.text(width / 2, height * 0.18 - 20, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '13px', color: '#888899',
    }).setOrigin(0.5);

    // Navigation buttons
    this.prevBtn = this.createButton(width * 0.25, height * 0.42, '◀ Previous', 0x334455, () => this.goToStep(this.stepIndex - 1));
    this.prevBtn.setVisible(false);

    this.nextBtn = this.createButton(width * 0.75, height * 0.42, 'Next ▶', 0x336644, () => this.goToStep(this.stepIndex + 1));

    // Demo area background
    const demoY = height * 0.62;
    const demoH = height * 0.38;
    const demoBg = this.add.graphics();
    demoBg.fillStyle(0x0d0d24, 0.7);
    demoBg.fillRoundedRect(40, demoY - 40, width - 80, demoH - 30, 16);
    demoBg.lineStyle(2, 0xFFD700, 0.2);
    demoBg.strokeRoundedRect(40, demoY - 40, width - 80, demoH - 30, 16);

    const demoLabel = this.add.text(width / 2, demoY - 25, 'PRACTICE AREA', {
      fontFamily: 'Noto Sans, system-ui, sans-serif', fontSize: '11px', color: '#7777AA', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Practice ground
    this.groundY = demoY + demoH * 0.65;
    const groundRect = this.add.rectangle(width / 2, this.groundY + 15, width - 100, 30, 0x3D6A3D);
    groundRect.setStrokeStyle(1, 0x558855, 0.5);
    // Ground surface line
    const groundLine = this.add.line(0, 0, 60, this.groundY, width - 60, this.groundY, 0x55AA55, 0.4);
    groundLine.setOrigin(0, 0);

    // Practice platform
    const platX = width * 0.65;
    const platY = this.groundY - 70;
    const platform = this.add.rectangle(platX, platY, 120, 18, 0x5A8A5A);
    platform.setStrokeStyle(1, 0x77BB77, 0.4);

    // Practice character
    this.demoCharX = width * 0.15;
    this.demoCharY = this.groundY - 40;
    this.demoChar = this.add.rectangle(this.demoCharX, this.demoCharY, 28, 44, 0x4488CC);
    this.demoChar.setStrokeStyle(2, 0x66AAFF);
    this.demoChar.setDepth(5);
    // Character face
    const charEye1 = this.add.circle(this.demoCharX + 6, this.demoCharY - 10, 2.5, 0xFFFFFF);
    const charEye2 = this.add.circle(this.demoCharX - 6, this.demoCharY - 10, 2.5, 0xFFFFFF);
    charEye1.setDepth(6); charEye2.setDepth(6);
    (this.demoChar as any)._eyes = [charEye1, charEye2];

    // Practice letter
    this.demoLetter = this.add.container(platX, platY - 28);
    const letterBg = this.add.rectangle(0, 0, 26, 26, 0xFFCC44);
    letterBg.setStrokeStyle(2, 0xFFD700);
    const letterText = this.add.text(0, 0, 'क', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif', fontSize: '16px', color: '#000000',
    }).setOrigin(0.5);
    this.demoLetter.add([letterBg, letterText]);
    this.tweens.add({ targets: this.demoLetter, y: platY - 38, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Keyboard setup
    if (this.input.keyboard) {
      this.keys = {
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        e: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        b: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      };
    }

    // Touch demo setup
    if (this.isMobile) {
      this.setupTouchDemo();
    }

    this.renderStep();
  }

  private buildSteps(): void {
    if (this.isMobile) {
      this.stepTexts = [
        'Move Left & Right|Place your finger on the LEFT half of the screen and slide left or right. A joystick ring appears where you touch — drag within it to control movement speed.',
        'Jump|Tap anywhere on the RIGHT half of the screen to jump. Hold your finger down for a higher jump — release to cut the jump short. Use this to reach platforms and letters!',
        'Interact|When you approach an NPC, guard, or boss, a glowing ⚡ Interact button appears on the right. Tap it to talk, spell, or fight!',
        'Collect Letters|Walk into floating Devanagari letters to collect them. They appear in your WordBar at the bottom. Collect all letters for a word, then approach its door!',
        'Spell Words|Walk into orange doors to open the word puzzle. Drag letters into slots to spell the word. Correct spellings open the door — complete all doors to finish the level!',
      ];
    } else {
      this.stepTexts = [
        'Move Left & Right|Use A / D keys or ← → Arrow keys to move. Press and hold to keep moving. The character runs smoothly — release to stop.',
        'Jump|Press W, ↑ Arrow, or SPACE to jump. Hold the key for a higher jump — release early to cut the jump short. Use platforms and stairs to reach high letters!',
        'Interact|When you see a 💬 or 🛡️ prompt near an NPC or guard, press E to interact. Talk to friends, challenge guards to spelling duels, or engage bosses!',
        'Collect Letters|Walk into floating Devanagari letters to collect them. Each one makes a sound! Collected letters appear in your WordBar. Collect full sets for doors.',
        'Spell Words|Walk into orange 🚪 doors to open the word puzzle. Drag letters into slots to spell Hindi words. Complete all doors in a level to progress. Press B on boss levels to skip to the boss fight!',
      ];
    }
  }

  private renderStep(): void {
    const total = this.stepTexts.length;
    const [title, desc] = this.stepTexts[this.stepIndex].split('|');

    this.stepCounter.setText(`Step ${this.stepIndex + 1} of ${total}`);
    this.stepTitle.setText(title);
    this.stepDesc.setText(desc || '');

    this.prevBtn.setVisible(this.stepIndex > 0);
    if (this.stepIndex >= total - 1) {
      (this.nextBtn.getAt(1) as Phaser.GameObjects.Text).setText('Done ✓');
    } else {
      (this.nextBtn.getAt(1) as Phaser.GameObjects.Text).setText('Next ▶');
    }

    this.clearIndicators();
    this.drawIndicators();
  }

  private goToStep(index: number): void {
    if (index < 0 || index >= this.stepTexts.length) {
      TransitionManager.toScene(this, 'MenuScene');
      return;
    }
    this.stepIndex = index;
    this.renderStep();
  }

  private clearIndicators(): void {
    this.controlIndicators.forEach((o) => o.destroy());
    this.controlIndicators = [];
    this.arrowGraphics.forEach((g) => g.destroy());
    this.arrowGraphics = [];
    this.pulseTimers.forEach((t) => t.remove());
    this.pulseTimers = [];
  }

  private drawIndicators(): void {
    const { width, height } = this.cameras.main;
    const demoY = height * 0.62;
    const demoH = height * 0.38;

    if (this.isMobile) {
      this.drawMobileIndicators(width, height, demoY, demoH);
    } else {
      this.drawDesktopIndicators(width, height, demoY, demoH);
    }

    // Animate demo character based on step
    this.animateDemoChar();
  }

  private drawMobileIndicators(width: number, height: number, demoY: number, demoH: number): void {
    const midX = width / 2;

    if (this.stepIndex === 0) {
      // Left half joystick zone
      const zoneX = width * 0.22;
      const zoneY = demoY + demoH * 0.4;
      const g = this.add.graphics();
      g.lineStyle(3, 0x4488FF, 0.5);
      g.strokeCircle(zoneX, zoneY, 48);
      g.fillStyle(0x4488FF, 0.08);
      g.fillCircle(zoneX, zoneY, 48);
      this.controlIndicators.push(g);

      const knob = this.add.circle(zoneX + 20, zoneY, 18, 0x4488FF, 0.6);
      this.controlIndicators.push(knob);
      this.tweens.add({ targets: knob, x: zoneX - 25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const label = this.add.text(zoneX, zoneY + 65, 'Touch & Slide', {
        fontSize: '12px', color: '#88AAFF', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(label);

      // Arrow left
      const la = this.drawArrow(zoneX - 40, zoneY, -30, 0, 0xFF8844);
      this.controlIndicators.push(la);
      // Arrow right
      const ra = this.drawArrow(zoneX + 40, zoneY, 30, 0, 0xFF8844);
      this.controlIndicators.push(ra);

      // Zone label
      const zl = this.add.text(zoneX, zoneY - 70, 'LEFT HALF', {
        fontSize: '11px', color: '#FFCC44', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.controlIndicators.push(zl);
    }

    if (this.stepIndex === 1) {
      // Right half jump zone
      const zx = width * 0.78;
      const zy = demoY + demoH * 0.4;
      const g = this.add.graphics();
      g.lineStyle(3, 0x44CC44, 0.5);
      g.strokeCircle(zx, zy, 48);
      g.fillStyle(0x44CC44, 0.08);
      g.fillCircle(zx, zy, 48);
      this.controlIndicators.push(g);

      const upArrow = this.add.text(zx, zy - 28, '▲', { fontSize: '24px', color: '#44DD44' }).setOrigin(0.5);
      this.controlIndicators.push(upArrow);
      this.tweens.add({ targets: upArrow, y: zy - 48, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });

      const label = this.add.text(zx, zy + 65, 'Tap to Jump', {
        fontSize: '12px', color: '#88CC88', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(label);

      const zl = this.add.text(zx, zy - 70, 'RIGHT HALF', {
        fontSize: '11px', color: '#FFCC44', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.controlIndicators.push(zl);
    }

    if (this.stepIndex === 2) {
      // Interact button demo
      const bx = width * 0.78;
      const by = demoY - 15;
      const btn = this.add.rectangle(bx, by, 130, 50, 0x333333, 0.85);
      btn.setStrokeStyle(3, 0xFFCC44, 0.9);
      this.controlIndicators.push(btn);
      const btnTxt = this.add.text(bx, by, '⚡ Interact', {
        fontSize: '18px', color: '#FFCC44', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.controlIndicators.push(btnTxt);
      this.tweens.add({ targets: [btn, btnTxt], alpha: 0.6, duration: 800, yoyo: true, repeat: -1 });
    }
  }

  private drawDesktopIndicators(width: number, height: number, demoY: number, demoH: number): void {
    const keyY = demoY + demoH * 0.4;

    if (this.stepIndex === 0) {
      // Movement keys
      const keysX = width * 0.22;
      this.drawKeyCap(keysX - 38, keyY, 'A', 0x4488FF);
      this.drawKeyCap(keysX + 0, keyY - 30, 'W', 0x4488FF);
      this.drawKeyCap(keysX + 38, keyY, 'D', 0x4488FF);
      this.drawKeyCap(keysX + 70, keyY, '→', 0x4488FF);
      this.drawKeyCap(keysX - 76, keyY, '←', 0x4488FF);

      const label = this.add.text(keysX, keyY + 55, 'A/D or Arrow Keys', {
        fontSize: '12px', color: '#88AAFF', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(label);
    }

    if (this.stepIndex === 1) {
      // Jump keys
      const jx = width * 0.48;
      this.drawKeyCap(jx - 48, keyY, 'W ↑', 0x44CC44, 56, 36);
      this.drawKeyCap(jx + 48, keyY, 'SPACE', 0x44CC44, 64, 36);

      const label = this.add.text(jx, keyY + 55, 'W / Arrow Up / Space', {
        fontSize: '12px', color: '#88CC88', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(label);

      // Hold hint
      const hint = this.add.text(jx, keyY + 75, 'Hold for higher jump!', {
        fontSize: '11px', color: '#FFCC44', fontFamily: 'system-ui, sans-serif', fontStyle: 'italic',
      }).setOrigin(0.5);
      this.controlIndicators.push(hint);
    }

    if (this.stepIndex === 2) {
      // E key
      const ex = width * 0.48;
      this.drawKeyCap(ex, keyY, 'E', 0xFF8844);
      const label = this.add.text(ex, keyY + 55, 'Interact with NPCs / Guards / Bosses', {
        fontSize: '12px', color: '#FFAA66', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(label);

      // B key
      this.drawKeyCap(ex + 90, keyY, 'B', 0xAA44CC);
      const bl = this.add.text(ex + 90, keyY + 55, 'Skip to Boss (boss levels)', {
        fontSize: '11px', color: '#CC88EE', fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
      this.controlIndicators.push(bl);
    }
  }

  private drawKeyCap(x: number, y: number, label: string, color: number, w: number = 36, h: number = 36): void {
    const cap = this.add.graphics();
    cap.fillStyle(color, 0.85);
    cap.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    cap.fillStyle(0xFFFFFF, 0.15);
    cap.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h / 2 - 2, { tl: 4, tr: 4, bl: 0, br: 0 });
    cap.lineStyle(1, 0xFFFFFF, 0.2);
    cap.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    cap.setPosition(x, y);
    this.controlIndicators.push(cap);

    const txt = this.add.text(x, y, label, {
      fontSize: label.length > 2 ? '11px' : '14px', color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.controlIndicators.push(txt);

    // Subtle pulse
    const t = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        this.tweens.add({ targets: [cap, txt], scaleX: 1.08, scaleY: 1.08, duration: 200, yoyo: true });
      },
    });
    this.pulseTimers.push(t);
  }

  private drawArrow(x: number, y: number, dx: number, dy: number, color: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.lineStyle(3, color, 0.7);
    const len = Math.abs(dx) > 0 ? Math.abs(dx) : Math.abs(dy);
    const endX = x + dx;
    const endY = y + dy;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(endX, endY);
    g.strokePath();
    // Arrowhead
    const angle = Math.atan2(dy, dx);
    const headLen = 10;
    g.fillStyle(color, 0.7);
    g.fillTriangle(
      endX, endY,
      endX - headLen * Math.cos(angle - 0.5), endY - headLen * Math.sin(angle - 0.5),
      endX - headLen * Math.cos(angle + 0.5), endY - headLen * Math.sin(angle + 0.5),
    );
    this.tweens.add({ targets: g, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    return g;
  }

  private animateDemoChar(): void {
    this.tweens.killTweensOf(this.demoChar);
    const { width, height } = this.cameras.main;

    // Reset position
    this.demoCharX = width * 0.15;
    this.demoCharY = this.groundY - 40;
    this.demoChar.setPosition(this.demoCharX, this.demoCharY);
    this.demoJumping = false;
    this.demoOnGround = true;
    this.demoVelY = 0;

    const eyes = (this.demoChar as any)._eyes || [];
    eyes.forEach((e: Phaser.GameObjects.Arc) => { e.x = this.demoCharX + 6; e.y = this.demoCharY - 10; e.setPosition(e.x, e.y); });
    const e2 = eyes[1];
    if (e2) { e2.x = this.demoCharX - 6; e2.y = this.demoCharY - 10; }

    if (this.stepIndex === 0) {
      // Move right then left
      this.tweens.add({
        targets: this.demoChar,
        x: width * 0.35,
        duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        onUpdate: () => { this.demoCharX = this.demoChar.x; this.syncEyes(); },
      });
    } else if (this.stepIndex === 1) {
      // Jump in place
      this.tweens.add({
        targets: this.demoChar,
        y: this.groundY - 130,
        yoyo: true, repeat: -1, duration: 700, ease: 'Quad.easeOut',
        hold: 400,
        onUpdate: () => { this.demoCharY = this.demoChar.y; this.syncEyes(); },
      });
    } else if (this.stepIndex === 2) {
      // Walk to letter area then stop
      this.tweens.add({
        targets: this.demoChar,
        x: width * 0.55,
        duration: 2500, ease: 'Sine.easeInOut',
        onComplete: () => {
          // Flash interact prompt
          const prompt = this.add.text(this.demoChar.x, this.demoChar.y - 55, '💬 Press E', {
            fontSize: '14px', color: '#FFCC44', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5);
          this.controlIndicators.push(prompt);
          this.tweens.add({ targets: prompt, alpha: 0.5, y: prompt.y - 10, duration: 600, yoyo: true, repeat: 2, onComplete: () => prompt.destroy() });
        },
        onUpdate: () => { this.demoCharX = this.demoChar.x; this.syncEyes(); },
      });
    } else if (this.stepIndex === 3) {
      // Move to letter
      const platX = width * 0.65;
      const platY = this.groundY - 70;
      this.tweens.add({
        targets: this.demoChar,
        x: platX, y: platY - 60,
        duration: 2000, ease: 'Quad.easeInOut',
        onComplete: () => {
          // Collect effect
          this.demoLetter.setVisible(false);
          const spark = this.add.text(platX, platY - 60, '✦ Collected!', {
            fontSize: '14px', color: '#FFD700', fontFamily: 'system-ui, sans-serif',
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5);
          this.controlIndicators.push(spark);
          this.tweens.add({ targets: spark, y: spark.y - 40, alpha: 0, duration: 1500, onComplete: () => { spark.destroy(); this.demoLetter.setVisible(true); } });
        },
        onUpdate: () => { this.demoCharX = this.demoChar.x; this.demoCharY = this.demoChar.y; this.syncEyes(); },
      });
    } else if (this.stepIndex === 4) {
      // Walk toward door area
      this.tweens.add({
        targets: this.demoChar,
        x: width * 0.85,
        duration: 3000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        onUpdate: () => { this.demoCharX = this.demoChar.x; this.syncEyes(); },
      });
    }
  }

  private syncEyes(): void {
    const eyes = (this.demoChar as any)._eyes || [];
    if (eyes[0]) { eyes[0].setPosition(this.demoCharX + 6, this.demoCharY - 10); }
    if (eyes[1]) { eyes[1].setPosition(this.demoCharX - 6, this.demoCharY - 10); }
  }

  private setupTouchDemo(): void {
    // Touch events for practice area
    const { width } = this.cameras.main;
    const midX = width / 2;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < midX) {
        // Left half — move
        const dir = pointer.x < midX / 2 ? -1 : 1;
        this.demoMoveDir = dir;
      } else {
        // Right half — jump
        if (this.demoOnGround) {
          this.demoVelY = -350;
          this.demoOnGround = false;
          this.demoJumping = true;
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < midX && pointer.isDown) {
        this.demoMoveDir = pointer.x < midX / 2 ? -1 : 1;
      }
    });

    this.input.on('pointerup', () => {
      this.demoMoveDir = 0;
    });
  }

  private createButton(x: number, y: number, label: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const w = 120;
    const h = 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, 0xFFFFFF, 0.3);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const txt = this.add.text(0, 0, label, {
      fontSize: '15px', color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    const btn = this.add.container(x, y, [bg, txt]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { bg.clear(); bg.fillStyle(color, 1); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10); bg.lineStyle(2, 0xFFFFFF, 0.5); bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10); });
    btn.on('pointerout', () => { bg.clear(); bg.fillStyle(color, 0.9); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10); bg.lineStyle(2, 0xFFFFFF, 0.3); bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10); });
    btn.on('pointerdown', callback);
    btn.setDepth(50);
    return btn;
  }

  update(): void {
    // Practice character movement
    const speed = 3;
    const { width } = this.cameras.main;
    const minX = 55;
    const maxX = width - 55;

    if (this.demoMoveDir !== 0) {
      this.demoCharX += this.demoMoveDir * speed;
      this.demoCharX = Phaser.Math.Clamp(this.demoCharX, minX, maxX);
      this.demoChar.setPosition(this.demoCharX, this.demoCharY);
      this.syncEyes();
    }

    // Practice jump physics
    if (!this.demoOnGround) {
      this.demoVelY += 12; // gravity
      this.demoCharY += this.demoVelY / 60;
      if (this.demoCharY >= this.groundY - 40) {
        this.demoCharY = this.groundY - 40;
        this.demoVelY = 0;
        this.demoOnGround = true;
        this.demoJumping = false;
      }
      this.demoChar.setPosition(this.demoCharX, this.demoCharY);
      this.syncEyes();
    }
  }
}
