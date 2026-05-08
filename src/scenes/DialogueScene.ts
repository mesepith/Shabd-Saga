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
  private onComplete?: () => void;

  constructor() {
    super({ key: 'DialogueScene' });
  }

  create(data: { dialogue: DialogueNode[]; onComplete?: () => void }): void {
    this.dialogueData = data.dialogue;
    this.onComplete = data.onComplete;

    const { width, height } = this.cameras.main;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setDepth(300);

    // Dialogue box container
    this.dialogueBox = this.add.container(width / 2, height - 120);
    this.dialogueBox.setDepth(301);

    // Box background
    const boxWidth = Math.min(900, width - 80);
    const boxHeight = 180;
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x1a1a3e, 0.95);
    boxBg.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    boxBg.lineStyle(2, 0x4444AA, 0.8);
    boxBg.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    this.dialogueBox.add(boxBg);

    // Speaker name
    this.speakerText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 15, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    this.dialogueBox.add(this.speakerText);

    // Body text (Hindi)
    this.bodyText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 45, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
      wordWrap: { width: boxWidth - 80 },
      lineSpacing: 6,
    });
    this.dialogueBox.add(this.bodyText);

    // English translation
    this.englishText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 105, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px',
      color: '#8888AA',
      wordWrap: { width: boxWidth - 80 },
      fontStyle: 'italic',
    });
    this.dialogueBox.add(this.englishText);

    // Continue hint
    this.continueHint = this.add.text(boxWidth / 2 - 20, boxHeight / 2 - 25, '▼ Tap to continue', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '12px',
      color: '#666688',
    });
    this.continueHint.setOrigin(1, 0.5);
    this.continueHint.setVisible(false);
    this.dialogueBox.add(this.continueHint);

    // Start first dialogue
    this.showNode(this.dialogueData[0]);

    // Click/tap anywhere to advance dialogue
    this.input.on('pointerdown', () => {
      this.advance();
    });
  }

  private showNode(node: DialogueNode): void {
    this.currentNode = node;
    this.speakerText.setText(node.speaker);
    this.englishText.setText(node.textEnglish);

    // Play dialogue audio via AudioManager (cached Howler.js)
    if ((node as any).audioPath) {
      AudioManager.getInstance().speakDialogue((node as any).audioPath);
    }

    // Typewriter effect for body text
    this.fullText = node.text;
    this.charIndex = 0;
    this.bodyText.setText('');
    this.continueHint.setVisible(false);
    this.isTyping = true;

    this.time.addEvent({
      delay: 30, // ms per character
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
      this.continueHint.setVisible(true);
    }
  }

  private advance(): void {
    // If still typing, skip to full text
    if (this.isTyping) {
      this.isTyping = false;
      this.bodyText.setText(this.fullText);
      this.continueHint.setVisible(true);
      return;
    }

    const nextId = this.currentNode.nextNodeId;
    if (nextId) {
      const nextNode = this.dialogueData.find((n) => n.id === nextId);
      if (nextNode) {
        this.showNode(nextNode);
        return;
      }
    }

    // End of dialogue
    this.endDialogue();
  }

  private endDialogue(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('DialogueScene');
      if (this.onComplete) {
        this.onComplete();
      }
    });
  }

  update(): void {
    // Space/Enter to advance
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
        Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER))) {
      this.advance();
    }
  }
}
