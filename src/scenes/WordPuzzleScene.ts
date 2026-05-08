import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

export class WordPuzzleScene extends Phaser.Scene {
  private targetWord: string = '';
  private targetTranslation: string = '';
  private collectedLetters: string[] = [];
  private correctOrder: string[] = [];
  private currentSlots: (string | null)[] = [];
  private attemptCount: number = 0;
  private availableContainers: Phaser.GameObjects.Container[] = [];
  private puzzleObjects: Phaser.GameObjects.GameObject[] = [];
  private callerSceneKey: string = 'GameScene';

  constructor() {
    super({ key: 'WordPuzzleScene' });
  }

  create(data: { word: string; translation: string; letters: string[]; correctOrder: string[]; caller?: string }): void {
    const { width, height } = this.cameras.main;

    this.targetWord = data.word;
    this.targetTranslation = data.translation;
    this.collectedLetters = [...data.letters];
    this.correctOrder = data.correctOrder;
    this.callerSceneKey = data.caller || 'GameScene';
    this.currentSlots = new Array(this.correctOrder.length).fill(null);
    this.attemptCount = 0;
    this.availableContainers = [];
    this.puzzleObjects = [];

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(400);
    this.puzzleObjects.push(overlay);

    // Puzzle panel
    const panel = this.add.rectangle(width / 2, height / 2, 620, 420, 0x1a1a3e, 0.95);
    panel.setStrokeStyle(3, 0x4444AA);
    panel.setDepth(401);
    this.puzzleObjects.push(panel);

    // Close button (X) — top right of panel
    const closeBtn = this.add.text(width / 2 + 290, height / 2 - 195, '✕ Close', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px', color: '#FF6666',
      backgroundColor: '#331111',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setDepth(405).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closePuzzle());
    this.puzzleObjects.push(closeBtn);

    // Title
    const title = this.add.text(width / 2, height / 2 - 160, 'Spell the Word!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '28px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(402);
    this.puzzleObjects.push(title);

    // Target word (Devanagari script shown as visual hint too)
    const wordHint = this.add.text(width / 2, height / 2 - 130, this.targetWord, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '32px', color: '#FFAA44',
    }).setOrigin(0.5).setDepth(402);
    this.puzzleObjects.push(wordHint);

    // Translation hint
    const hint = this.add.text(width / 2, height / 2 - 95, `(${this.targetTranslation})`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px', color: '#AAAACC',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(402);
    this.puzzleObjects.push(hint);

    // Instruction
    const inst = this.add.text(width / 2, height / 2 - 70, 'Drag letters into the correct slots below', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '12px', color: '#666688',
    }).setOrigin(0.5).setDepth(402);
    this.puzzleObjects.push(inst);

    // Letter slots
    this.createLetterSlots(width, height);

    // Available letters (draggable)
    this.createAvailableLetters(width, height);

    // Auto-fill single-letter puzzles
    if (this.collectedLetters.length === 1 && this.correctOrder.length === 1) {
      this.time.delayedCall(200, () => this.autoFillSingleLetter());
    }

    // Play magical puzzle music
    AudioManager.getInstance().startPuzzleMusic();

    // Buttons row
    this.createButtons(width, height);
  }

  private createLetterSlots(width: number, height: number): void {
    const slotSize = 64;
    const gap = 10;
    const totalW = this.correctOrder.length * (slotSize + gap) - gap;
    const startX = width / 2 - totalW / 2 + slotSize / 2;
    const slotY = height / 2 - 5;

    this.correctOrder.forEach((_, i) => {
      const x = startX + i * (slotSize + gap);
      const slotBg = this.add.rectangle(x, slotY, slotSize, slotSize, 0x222244, 1);
      slotBg.setStrokeStyle(2, 0x444488);
      slotBg.setDepth(402).setInteractive();
      this.puzzleObjects.push(slotBg);

      const slotNum = this.add.text(x, slotY + slotSize / 2 + 10, `${i + 1}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px', color: '#555588',
      }).setOrigin(0.5).setDepth(403);
      this.puzzleObjects.push(slotNum);

      // Tap empty slot to do nothing; tap filled slot to remove letter
      slotBg.on('pointerdown', () => {
        if (this.currentSlots[i] !== null) {
          this.removeFromSlot(i);
        }
      });
    });
  }

  private createAvailableLetters(width: number, height: number): void {
    const letterW = 60;
    const gap = 8;
    const totalW = this.collectedLetters.length * (letterW + gap) - gap;
    const startX = width / 2 - totalW / 2 + letterW / 2;
    const rowY = height / 2 + 80;

    this.collectedLetters.forEach((letter, i) => {
      const x = startX + i * (letterW + gap);

      const bg = this.add.rectangle(0, 0, letterW, letterW, 0x3D3D6B, 1);
      bg.setStrokeStyle(3, 0x8888CC);

      const txt = this.add.text(0, 0, letter, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '26px', color: '#FFFFFF',
      }).setOrigin(0.5);

      const container = this.add.container(x, rowY, [bg, txt]);
      container.setSize(letterW, letterW);
      container.setDepth(403);
      container.setInteractive({ draggable: true, useHandCursor: true });

      (container as any).letterValue = letter;
      (container as any).slotIndex = -1;
      (container as any).origIndex = i;

      this.availableContainers.push(container);
      this.puzzleObjects.push(container);
    });

    // Drag handlers
    this.input.on('drag', (_p: any, obj: Phaser.GameObjects.Container, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
      obj.setDepth(410);
    });

    this.input.on('dragend', (_p: any, obj: Phaser.GameObjects.Container) => {
      obj.setDepth(403);
      this.checkSlotDrop(obj);
    });
  }

  private autoFillSingleLetter(): void {
    if (this.availableContainers.length !== 1 || this.correctOrder.length !== 1) return;

    const container = this.availableContainers[0];
    const letterVal = (container as any).letterValue as string;

    // Auto-place at slot position
    const slotSize = 64;
    const gap = 10;
    const totalW = this.correctOrder.length * (slotSize + gap) - gap;
    const startX = this.cameras.main.width / 2 - totalW / 2 + slotSize / 2;
    const slotY = this.cameras.main.height / 2 - 5;

    container.x = startX;
    container.y = slotY;
    this.currentSlots[0] = letterVal;
    (container as any).slotIndex = 0;

    this.tweens.add({
      targets: container, scaleX: 1.15, scaleY: 1.15,
      duration: 150, yoyo: true, repeat: 2,
    });
  }

  private removeFromSlot(slotIndex: number): void {
    const letterVal = this.currentSlots[slotIndex];
    if (!letterVal) return;
    this.currentSlots[slotIndex] = null;

    // Return the letter to its original available position
    const container = this.availableContainers.find(
      (c) => (c as any).letterValue === letterVal && (c as any).slotIndex === slotIndex
    );
    if (container) {
      (container as any).slotIndex = -1;
      const idx = (container as any).origIndex;
      const letterW = 60;
      const gap = 8;
      const totalW = this.collectedLetters.length * (letterW + gap) - gap;
      const startX = this.cameras.main.width / 2 - totalW / 2 + letterW / 2;
      const rowY = this.cameras.main.height / 2 + 80;

      this.tweens.add({
        targets: container,
        x: startX + idx * (letterW + gap),
        y: rowY,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  private checkSlotDrop(obj: Phaser.GameObjects.Container): void {
    const letterVal = (obj as any).letterValue as string;
    if (!letterVal) return;
    const oldSlotIdx = (obj as any).slotIndex;

    // Clear old slot
    if (oldSlotIdx >= 0) {
      this.currentSlots[oldSlotIdx] = null;
      (obj as any).slotIndex = -1;
    }

    const slotSize = 64;
    const gap = 10;
    const totalW = this.correctOrder.length * (slotSize + gap) - gap;
    const startX = this.cameras.main.width / 2 - totalW / 2 + slotSize / 2;
    const slotY = this.cameras.main.height / 2 - 5;

    let dropped = false;

    this.correctOrder.forEach((_, i) => {
      const sx = startX + i * (slotSize + gap);
      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, sx, slotY);
      if (dist < 40 && this.currentSlots[i] === null) {
        obj.x = sx;
        obj.y = slotY;
        this.currentSlots[i] = letterVal;
        (obj as any).slotIndex = i;
        dropped = true;
        this.tweens.add({
          targets: obj, scaleX: 1.1, scaleY: 1.1,
          duration: 100, yoyo: true,
        });
      }
    });

    if (!dropped) {
      const idx = (obj as any).origIndex;
      const letterW = 60;
      const gap2 = 8;
      const totalW2 = this.collectedLetters.length * (letterW + gap2) - gap2;
      const startX2 = this.cameras.main.width / 2 - totalW2 / 2 + letterW / 2;
      const rowY = this.cameras.main.height / 2 + 80;

      this.tweens.add({
        targets: obj,
        x: startX2 + idx * (letterW + gap2),
        y: rowY,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  private createButtons(width: number, height: number): void {
    const btnY = height / 2 + 155;
    const btnW = 140;
    const btnH = 40;

    // Submit button
    const subBtn = this.add.rectangle(width / 2 - 80, btnY, btnW, btnH, 0x44AA44, 1);
    subBtn.setStrokeStyle(2, 0x66DD66).setDepth(402).setInteractive({ useHandCursor: true });
    const subTxt = this.add.text(width / 2 - 80, btnY, '✓ Submit', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(403);

    subBtn.on('pointerover', () => subBtn.setFillStyle(0x55CC55));
    subBtn.on('pointerout', () => subBtn.setFillStyle(0x44AA44));
    subBtn.on('pointerdown', () => this.validateWord());

    // Hint button
    const hintBtn = this.add.rectangle(width / 2 + 80, btnY, btnW, btnH, 0x4444AA, 1);
    hintBtn.setStrokeStyle(2, 0x6666CC).setDepth(402).setInteractive({ useHandCursor: true });
    const hintTxt = this.add.text(width / 2 + 80, btnY, '💡 Hint', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px', color: '#CCCCFF',
    }).setOrigin(0.5).setDepth(403);

    hintBtn.on('pointerdown', () => this.showHint());

    this.puzzleObjects.push(subBtn, subTxt, hintBtn, hintTxt);
  }

  private showHint(): void {
    this.attemptCount++;
    const msgs = [
      `First letter: "${this.correctOrder[0]}"`,
      `Try: ${this.correctOrder.join(' ')}`,
      `Answer: ${this.correctOrder.join('')}`,
    ];
    const msg = msgs[Math.min(this.attemptCount - 1, msgs.length - 1)];

    const t = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 110, msg, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px', color: '#FFD700',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(410);
    this.puzzleObjects.push(t);
    this.time.delayedCall(3000, () => t.destroy());
  }

  private validateWord(): void {
    if (this.currentSlots.some((s) => s === null)) {
      this.shake('Fill all slots!');
      return;
    }

    const isCorrect = this.currentSlots.every((l, i) => l === this.correctOrder[i]);

    if (isCorrect) {
      this.showSuccess();
    } else {
      this.attemptCount++;
      this.shake('Try again!');

      if (this.attemptCount >= 2) {
        this.showHint();
      }
      this.time.delayedCall(600, () => this.resetSlots());
    }
  }

  private shake(msg: string): void {
    this.cameras.main.shake(300, 0.008);
    const t = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 135, msg, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px', color: '#FF6666',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(410);
    this.puzzleObjects.push(t);
    this.time.delayedCall(1500, () => t.destroy());
  }

  private resetSlots(): void {
    this.currentSlots = new Array(this.correctOrder.length).fill(null);
    this.availableContainers.forEach((c) => {
      (c as any).slotIndex = -1;
      const idx = (c as any).origIndex;
      const letterW = 60;
      const gap = 8;
      const totalW = this.collectedLetters.length * (letterW + gap) - gap;
      const startX = this.cameras.main.width / 2 - totalW / 2 + letterW / 2;
      const rowY = this.cameras.main.height / 2 + 80;
      this.tweens.add({
        targets: c,
        x: startX + idx * (letterW + gap),
        y: rowY,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });
  }

  private showSuccess(): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.flash(300, 255, 255, 200);

    const successText = this.add.text(width / 2, height / 2 - 180, `✨ ${this.targetWord} ✨`, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '34px', color: '#FFD700',
      stroke: '#8B6914', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(410).setScale(0);

    this.tweens.add({
      targets: successText,
      scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut',
    });

    // Particles
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const p = this.add.circle(width / 2, height / 2, 3, 0xFFD700, 1).setDepth(411);
      this.tweens.add({
        targets: p,
        x: width / 2 + Math.cos(a) * 120,
        y: height / 2 + Math.sin(a) * 120,
        alpha: 0, duration: 500, delay: i * 20,
        onComplete: () => p.destroy(),
      });
    }

    // Resume caller scene and emit completion
    this.time.delayedCall(1000, () => {
      AudioManager.getInstance().stopMusic();
      const callerScene = this.scene.get(this.callerSceneKey);
      if (callerScene) {
        this.scene.resume(this.callerSceneKey);
        if (this.callerSceneKey === 'GameScene') {
          this.scene.resume('UIScene');
        }
        callerScene.events.emit('wordSpelled', {
          word: this.targetWord,
          translation: this.targetTranslation,
        });
      }
      this.scene.stop('WordPuzzleScene');
    });
  }

  private closePuzzle(): void {
    AudioManager.getInstance().stopMusic();
    this.scene.resume(this.callerSceneKey);
    if (this.callerSceneKey === 'GameScene') {
      this.scene.resume('UIScene');
    }
    this.scene.stop('WordPuzzleScene');
  }
}
