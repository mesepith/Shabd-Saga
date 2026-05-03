import Phaser from 'phaser';

export class WordPuzzleScene extends Phaser.Scene {
  private targetWord: string = '';
  private targetTranslation: string = '';
  private collectedLetters: string[] = [];
  private letterSlots: Phaser.GameObjects.Container[] = [];
  private availableLetters: Phaser.GameObjects.Container[] = [];
  private correctOrder: string[] = [];
  private currentSlots: (string | null)[] = [];
  private attemptCount: number = 0;

  constructor() {
    super({ key: 'WordPuzzleScene' });
  }

  create(data: {
    word: string;
    translation: string;
    letters: string[];
    correctOrder: string[];
  }): void {
    const { width, height } = this.cameras.main;

    this.targetWord = data.word;
    this.targetTranslation = data.translation;
    this.collectedLetters = [...data.letters];
    this.correctOrder = data.correctOrder;
    this.currentSlots = new Array(this.correctOrder.length).fill(null);
    this.attemptCount = 0;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(400);

    // Puzzle panel
    const panel = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a3e, 0.95);
    panel.setStrokeStyle(3, 0x4444AA);
    panel.setDepth(401);

    // Title
    const title = this.add.text(width / 2, height / 2 - 150, 'Spell the Word!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '28px',
      color: '#FFD700',
    });
    title.setOrigin(0.5);
    title.setDepth(402);

    // Translation hint
    const hint = this.add.text(width / 2, height / 2 - 110, this.targetTranslation, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '20px',
      color: '#AAAACC',
      fontStyle: 'italic',
    });
    hint.setOrigin(0.5);
    hint.setDepth(402);

    // Letter slots (where player drops letters)
    this.createLetterSlots(width, height);

    // Available letters (draggable)
    this.createAvailableLetters(width, height);

    // Submit button
    this.createSubmitButton(width, height);

    // Hint button
    this.createHintButton(width, height);
  }

  private createLetterSlots(width: number, height: number): void {
    const slotWidth = 64;
    const slotGap = 10;
    const totalWidth = this.correctOrder.length * (slotWidth + slotGap) - slotGap;
    const startX = width / 2 - totalWidth / 2 + slotWidth / 2;

    this.letterSlots = this.correctOrder.map((_, i) => {
      const x = startX + i * (slotWidth + slotGap);
      const y = height / 2 - 20;

      // Slot background
      const slotBg = this.add.rectangle(x, y, slotWidth, slotWidth, 0x222244, 1);
      slotBg.setStrokeStyle(2, 0x444488);
      slotBg.setDepth(402);

      // Slot number
      const slotNum = this.add.text(x, y + slotWidth / 2 + 12, `${i + 1}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#555588',
      });
      slotNum.setOrigin(0.5);
      slotNum.setDepth(403);

      return this.add.container(0, 0, [slotBg, slotNum]);
    });
  }

  private createAvailableLetters(width: number, height: number): void {
    const letterWidth = 56;
    const gap = 8;
    const totalWidth = this.collectedLetters.length * (letterWidth + gap) - gap;
    const startX = width / 2 - totalWidth / 2 + letterWidth / 2;

    this.availableLetters = this.collectedLetters.map((letter, i) => {
      const x = startX + i * (letterWidth + gap);
      const y = height / 2 + 80;

      const letterBg = this.add.rectangle(0, 0, letterWidth, letterWidth, 0x3D3D6B, 1);
      letterBg.setStrokeStyle(2, 0x6666AA);

      const letterText = this.add.text(0, 0, letter, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '24px',
        color: '#FFFFFF',
      });
      letterText.setOrigin(0.5);

      const container = this.add.container(x, y, [letterBg, letterText]);
      container.setSize(letterWidth, letterWidth);
      container.setDepth(403);
      container.setInteractive({ draggable: true, useHandCursor: true });

      // Store letter data
      (container as any).letterValue = letter;
      (container as any).slotIndex = -1;

      // Drag events
      this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject.setDepth(410);
      });

      this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
        gameObject.setDepth(403);
        this.checkSlotDrop(gameObject);
      });

      return container;
    });
  }

  private checkSlotDrop(letterObj: Phaser.GameObjects.Container): void {
    const letterValue = (letterObj as any).letterValue as string;

    // Check if dropped on a slot
    const slotWidth = 64;
    const slotGap = 10;
    const totalWidth = this.correctOrder.length * (slotWidth + slotGap) - slotGap;
    const startX = this.cameras.main.width / 2 - totalWidth / 2 + slotWidth / 2;
    const slotY = this.cameras.main.height / 2 - 20;

    let droppedInSlot = false;

    this.correctOrder.forEach((_, i) => {
      const slotX = startX + i * (slotWidth + slotGap);
      const dist = Phaser.Math.Distance.Between(letterObj.x, letterObj.y, slotX, slotY);

      if (dist < 40 && this.currentSlots[i] === null) {
        // Snap to slot
        letterObj.x = slotX;
        letterObj.y = slotY;
        this.currentSlots[i] = letterValue;
        (letterObj as any).slotIndex = i;
        droppedInSlot = true;

        // Visual feedback
        this.tweens.add({
          targets: letterObj,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          yoyo: true,
        });
      }
    });

    if (!droppedInSlot) {
      // Return to original position
      const letterIndex = this.collectedLetters.indexOf(letterValue);
      const letterWidth = 56;
      const gap = 8;
      const totalWidth2 = this.collectedLetters.length * (letterWidth + gap) - gap;
      const startX2 = this.cameras.main.width / 2 - totalWidth2 / 2 + letterWidth / 2;
      const origX = startX2 + letterIndex * (letterWidth + gap);
      const origY = this.cameras.main.height / 2 + 80;

      this.tweens.add({
        targets: letterObj,
        x: origX,
        y: origY,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  private createSubmitButton(width: number, height: number): void {
    const btn = this.add.rectangle(width / 2, height / 2 + 150, 160, 44, 0x44AA44, 1);
    btn.setStrokeStyle(2, 0x66DD66);
    btn.setDepth(402);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, height / 2 + 150, '✓ Submit', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(403);

    btn.on('pointerover', () => btn.setFillStyle(0x55CC55));
    btn.on('pointerout', () => btn.setFillStyle(0x44AA44));
    btn.on('pointerdown', () => this.validateWord());
  }

  private createHintButton(width: number, height: number): void {
    const btn = this.add.rectangle(width / 2 + 100, height / 2 + 150, 120, 44, 0x4444AA, 1);
    btn.setStrokeStyle(2, 0x6666CC);
    btn.setDepth(402);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2 + 100, height / 2 + 150, '💡 Hint', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#CCCCFF',
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(403);

    btn.on('pointerdown', () => {
      this.attemptCount++;
      // Show transliteration as hint
      const hintText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 70,
        'Hint: ' + this.correctOrder.join(' '),
        {
          fontFamily: 'Noto Sans, system-ui, sans-serif',
          fontSize: '18px',
          color: '#FFD700',
        }
      );
      hintText.setOrigin(0.5);
      hintText.setDepth(405);

      this.time.delayedCall(3000, () => hintText.destroy());
    });
  }

  private validateWord(): void {
    const hasAllSlots = this.currentSlots.every((s) => s !== null);
    if (!hasAllSlots) {
      // Shake effect — not all slots filled
      this.cameras.main.shake(200, 0.005);
      return;
    }

    const isCorrect = this.currentSlots.every(
      (letter, i) => letter === this.correctOrder[i]
    );

    if (isCorrect) {
      // Success!
      this.showSuccess(() => {
        this.scene.stop('WordPuzzleScene');
        this.scene.resume('GameScene');
        // Emit success event
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('wordSpelled', {
          word: this.targetWord,
          translation: this.targetTranslation,
        });
      });
    } else {
      this.attemptCount++;
      this.cameras.main.shake(300, 0.01);

      // Show transliteration hint after 2nd fail
      if (this.attemptCount >= 2) {
        const hintText = this.add.text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2 - 70,
          'Try: ' + this.correctOrder.join(' '),
          {
            fontFamily: 'Noto Sans, system-ui, sans-serif',
            fontSize: '18px',
            color: '#FFAA00',
          }
        );
        hintText.setOrigin(0.5);
        hintText.setDepth(405);
        this.time.delayedCall(3000, () => hintText.destroy());
      }

      // Reset slots after delay
      this.time.delayedCall(500, () => {
        this.resetSlots();
      });
    }
  }

  private resetSlots(): void {
    this.currentSlots = new Array(this.correctOrder.length).fill(null);

    this.availableLetters.forEach((letterObj) => {
      const letterIndex = this.collectedLetters.indexOf((letterObj as any).letterValue);
      const letterWidth = 56;
      const gap = 8;
      const totalWidth = this.collectedLetters.length * (letterWidth + gap) - gap;
      const startX = this.cameras.main.width / 2 - totalWidth / 2 + letterWidth / 2;
      const origX = startX + letterIndex * (letterWidth + gap);
      const origY = this.cameras.main.height / 2 + 80;

      (letterObj as any).slotIndex = -1;
      this.tweens.add({
        targets: letterObj,
        x: origX,
        y: origY,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });
  }

  private showSuccess(callback: () => void): void {
    const { width, height } = this.cameras.main;

    // Success flash
    this.cameras.main.flash(300, 255, 255, 200);

    // Success text
    const successText = this.add.text(width / 2, height / 2 - 170, '✨ Correct! ✨', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 3,
    });
    successText.setOrigin(0.5);
    successText.setDepth(410);

    // Scale-up animation
    successText.setScale(0);
    this.tweens.add({
      targets: successText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Celebration particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const particle = this.add.circle(width / 2, height / 2, 3, Phaser.Math.Between(0, 1) ? 0xFFD700 : 0xFF6B6B, 1);
      particle.setDepth(411);

      this.tweens.add({
        targets: particle,
        x: width / 2 + Math.cos(angle) * Phaser.Math.Between(80, 200),
        y: height / 2 + Math.sin(angle) * Phaser.Math.Between(80, 200),
        alpha: 0,
        duration: 600,
        delay: i * 30,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    this.time.delayedCall(1200, callback);
  }
}
