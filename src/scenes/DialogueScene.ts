import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  textEnglish: string;
  audioPath?: string;
  choices?: Array<{ text: string; nextNodeId: string }>;
  nextNodeId?: string;
}

export class DialogueScene extends Phaser.Scene {
  private dialogueData: DialogueNode[] = [];
  private currentNode!: DialogueNode;
  private dialogueBox!: Phaser.GameObjects.Container;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private englishText!: Phaser.GameObjects.Text;
  private continueHint!: Phaser.GameObjects.Text;
  private isTyping: boolean = false;
  private fullText: string = '';
  private charIndex: number = 0;
  private onComplete?: (finalNodeId: string) => void;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private showingChoices: boolean = false;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private typewriterTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'DialogueScene' });
  }

  create(data: { dialogue: DialogueNode[]; onComplete?: (finalNodeId: string) => void }): void {
    this.dialogueData = data.dialogue;
    this.onComplete = data.onComplete;

    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setDepth(300);

    this.dialogueBox = this.add.container(width / 2, height - 120);
    this.dialogueBox.setDepth(301);

    const boxWidth = Math.min(900, width - 80);
    const boxHeight = 180;
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x1a1a3e, 0.95);
    boxBg.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    boxBg.lineStyle(2, 0x4444AA, 0.8);
    boxBg.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    this.dialogueBox.add(boxBg);

    this.speakerText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 15, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
    });
    this.dialogueBox.add(this.speakerText);

    this.bodyText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 45, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '18px', color: '#FFFFFF',
      wordWrap: { width: boxWidth - 80 }, lineSpacing: 6,
    });
    this.dialogueBox.add(this.bodyText);

    this.englishText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 105, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px', color: '#8888AA',
      wordWrap: { width: boxWidth - 80 }, fontStyle: 'italic',
    });
    this.dialogueBox.add(this.englishText);

    this.continueHint = this.add.text(boxWidth / 2 - 20, boxHeight / 2 - 25, '▼ Tap to continue', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px', color: '#AAFFAA',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    });
    this.continueHint.setOrigin(1, 0.5);
    this.continueHint.setVisible(false);
    this.dialogueBox.add(this.continueHint);

    // Create persistent keyboard keys (not recreated per frame)
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.showNode(this.dialogueData[0]);

    this.input.on('pointerdown', () => {
      this.advance();
    });
  }

  private showNode(node: DialogueNode): void {
    this.currentNode = node;
    this.speakerText.setText(node.speaker);
    this.englishText.setText(node.textEnglish);

    if ((node as any).audioPath) {
      AudioManager.getInstance().speakDialogue((node as any).audioPath);
    }

    this.destroyChoiceButtons();
    this.showingChoices = false;

    // Cancel any previous typewriter timer
    this.isTyping = true;
    this.fullText = node.text;
    this.charIndex = 0;
    this.bodyText.setText('');
    this.continueHint.setVisible(false);

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    this.typewriterTimer = this.time.addEvent({
      delay: 30,
      callback: this.typeNextChar,
      callbackScope: this,
      repeat: this.fullText.length - 1,
    });
  }

  private typeNextChar(): void {
    if (!this.isTyping) return;
    this.charIndex++;
    this.bodyText.setText(this.fullText.substring(0, this.charIndex));

    if (this.charIndex >= this.fullText.length) {
      this.isTyping = false;
      this.onTypewriterComplete();
    }
  }

  private advance(): void {
    if (this.showingChoices) return;

    if (this.isTyping) {
      this.isTyping = false;
      this.bodyText.setText(this.fullText);
      this.onTypewriterComplete();
      return;
    }

    const nextId = this.currentNode.choices?.[0]?.nextNodeId || this.currentNode.nextNodeId;
    if (nextId) {
      const nextNode = this.dialogueData.find((n) => n.id === nextId);
      if (nextNode) {
        this.showNode(nextNode);
        return;
      }
    }

    this.endDialogue();
  }

  private onTypewriterComplete(): void {
    if (this.currentNode.choices && this.currentNode.choices.length > 1) {
      this.showChoices(this.currentNode.choices);
    } else {
      this.continueHint.setVisible(true);
    }
  }

  private showChoices(choices: Array<{ text: string; nextNodeId: string }>): void {
    this.showingChoices = true;
    this.destroyChoiceButtons();

    const boxWidth = Math.min(900, this.cameras.main.width - 80);
    const boxHeight = 180;
    const count = choices.length;
    const btnWidth = Math.min(160, Math.floor((boxWidth - 80) / count - 12));
    const btnHeight = 48;
    const gap = 16;
    const totalWidth = count * btnWidth + (count - 1) * gap;
    const startX = -totalWidth / 2 + btnWidth / 2;
    const btnY = boxHeight / 2 - 28;

    choices.forEach((choice, i) => {
      const btnX = startX + i * (btnWidth + gap);
      const container = this.add.container(btnX, btnY);

      const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x334466, 0.9);
      bg.setStrokeStyle(2, 0xFFD700, 0.7);
      container.add(bg);

      const label = this.add.text(0, 0, choice.text, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '18px',
        color: '#FFFFFF',
      }).setOrigin(0.5);
      container.add(label);

      container.setSize(btnWidth, btnHeight);
      container.setInteractive();

      container.on('pointerover', () => bg.setFillStyle(0x445577, 0.95));
      container.on('pointerout', () => bg.setFillStyle(0x334466, 0.9));
      container.on('pointerdown', () => this.handleChoice(choice.nextNodeId));

      this.dialogueBox.add(container);
      this.choiceButtons.push(container);
    });
  }

  private handleChoice(nextNodeId: string): void {
    this.destroyChoiceButtons();
    this.showingChoices = false;

    const nextNode = this.dialogueData.find((n) => n.id === nextNodeId);
    if (nextNode) {
      this.showNode(nextNode);
    } else {
      this.endDialogue();
    }
  }

  private destroyChoiceButtons(): void {
    this.choiceButtons.forEach((btn) => btn.destroy());
    this.choiceButtons = [];
  }

  private endDialogue(): void {
    const finalNodeId = this.currentNode.id;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('DialogueScene');
      if (this.onComplete) {
        this.onComplete(finalNodeId);
      }
    });
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.advance();
    }
  }
}
