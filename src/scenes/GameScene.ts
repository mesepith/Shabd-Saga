import Phaser from 'phaser';
import { Howl } from 'howler';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceBar!: Phaser.Input.Keyboard.Key;

  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;

  private playerSpeed: number = 280;
  private jumpForce: number = -460;
  private canJump: boolean = true;
  private health: number = 3;

  // Level data
  private levelId: string = 'world-1-level-1';
  private languageId: string = 'hindi';
  private levelWords: any[] = [];
  private collectedLetters: Array<{ letter: string; wordId: string }> = [];
  private activeDoors: Array<{ wordId: string; door: Phaser.Physics.Arcade.Sprite }> = [];
  private lettersGroup!: Phaser.Physics.Arcade.Group;
  private doorsGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Door interaction
  private nearDoor: string | null = null;
  private doorPrompt!: Phaser.GameObjects.Text;
  private doorsOverlapRegistered: boolean = false;
  private lettersOverlapRegistered: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { worldId: string; levelId: string; language: string }): void {
    const { width, height } = this.cameras.main;
    this.levelId = data?.levelId || 'world-1-level-1';
    this.languageId = data?.language || 'hindi';
    this.collectedLetters = [];

    this.cameras.main.fadeIn(500);

    this.createParallaxBackground();
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.rectangle(width / 2, height - 40, width * 3, 80, 0x2D5A27);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    // Staircase platforms
    this.createFloatingPlatform(250, 540, 180, 20);
    this.createFloatingPlatform(480, 460, 180, 20);
    this.createFloatingPlatform(710, 380, 180, 20);
    this.createFloatingPlatform(940, 300, 180, 20);
    this.createFloatingPlatform(1170, 240, 180, 20);
    this.createFloatingPlatform(600, 560, 120, 20);

    // Player
    this.player = this.physics.add.sprite(100, height - 150, 'player-placeholder');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(32, 48);
    playerBody.setOffset(16, 16);

    // Camera
    this.cameras.main.setBounds(0, 0, 1600, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(50, 50);

    this.physics.add.collider(this.player, this.platforms);

    // Groups
    this.lettersGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.doorsGroup = this.physics.add.staticGroup();

    this.setupInput();
    this.scene.launch('UIScene', { gameScene: this });

    // Init door prompt as hidden (populated later by spawnDoors)
    this.doorPrompt = this.add.text(0, 0, '🔑 Press E to unlock!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      backgroundColor: '#000000cc',
      padding: { x: 12, y: 6 },
      stroke: '#FF6600',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(150).setVisible(false);

    // Permanent instruction at bottom
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 110, 'Collect letters → Walk into doors to unlock!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px', color: '#FFD700',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Spawn letters from level data (try async, fall back to placeholders)
    this.spawnFallbackLetters();
    this.loadLevelData();
  }

  private async loadLevelData(): Promise<void> {
    try {
      console.log('[GameScene] Loading level data...');
      const { LanguageManager } = await import('../systems/LanguageManager');
      const lm = LanguageManager.getInstance();
      if (!lm.getCurrentLanguage()) {
        console.log('[GameScene] Loading language from /data/hindi.json');
        await lm.loadLanguage(this.languageId);
      }
      const level = lm.getLevel(this.levelId);
      console.log('[GameScene] Level found:', level?.name, 'words:', level?.words?.length);
      if (level && level.words && level.words.length > 0) {
        // Remove fallback letters and their visuals
        this.lettersGroup.getChildren().forEach((child: any) => {
          if (child.charText) child.charText.destroy();
          if (child.glow) child.glow.destroy();
          if (child.floatTween) child.floatTween.stop();
        });
        this.lettersGroup.clear(true, true);
        this.levelWords = level.words;
        this.spawnLetters(level.words);
        this.spawnDoors(level.words);
        this.spawnNPCs(level.npcs || []);
        console.log('[GameScene] Doors spawned:', this.activeDoors.length);
        this.showMessage(`World: ${level.name} — ${level.words.length} words to learn!`);
      }
    } catch (err) {
      console.error('[GameScene] loadLevelData failed:', err);
    }
  }

  private spawnLetters(words: any[]): void {
    const positions = [
      { x: 250, y: 520 }, { x: 350, y: 480 }, { x: 480, y: 400 },
      { x: 580, y: 360 }, { x: 710, y: 320 }, { x: 810, y: 280 },
      { x: 940, y: 240 }, { x: 600, y: 500 }, { x: 420, y: 550 },
      { x: 750, y: 440 }, { x: 880, y: 380 }, { x: 1020, y: 340 },
    ];

    let letterIndex = 0;
    words.forEach((word) => {
      (word.splitLetters || []).forEach((char: string) => {
        if (letterIndex >= positions.length) return;
        const pos = positions[letterIndex];

        // Use placeholder sprite + render Devanagari text on top
        const letter = this.physics.add.sprite(pos.x, pos.y, 'letter-placeholder');
        letter.setScale(1.1);
        letter.setDepth(8);
        this.lettersGroup.add(letter);

        // Render the Devanagari character as text on top
        const charText = this.add.text(pos.x, pos.y, char, {
          fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
          fontSize: '18px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9);

        // Store data on the sprite
        (letter as any).charValue = char;
        (letter as any).wordId = word.id;
        (letter as any).audioPath = `assets/audio/speech/${this.languageId}/${word.id}.mp3`;
        (letter as any).wordScript = word.script;
        (letter as any).wordTranslation = word.translation;
        (letter as any).charText = charText;

        // Glow
        const glow = this.add.circle(pos.x, pos.y, 22, 0xFFD700, 0.15);
        glow.setDepth(5);

        // Float animation
        const tween = this.tweens.add({
          targets: [letter, charText, glow],
          y: pos.y - 12,
          duration: 1500 + letterIndex * 200,
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
        (letter as any).floatTween = tween;
        (letter as any).glow = glow;

        letterIndex++;
      });
    });

    // Overlap detection (register once)
    if (!this.lettersOverlapRegistered) {
      this.lettersOverlapRegistered = true;
      this.physics.add.overlap(
        this.player, this.lettersGroup,
        (_, letterObj) => {
          const l = letterObj as Phaser.Physics.Arcade.Sprite & {
          charValue: string; wordId: string; audioPath: string;
          wordScript: string; wordTranslation: string;
          charText: Phaser.GameObjects.Text; glow: Phaser.GameObjects.Arc;
          floatTween: Phaser.Tweens.Tween;
        };
        if (!l.active) return;

        l.floatTween?.stop();
        l.glow?.destroy();
        l.charText?.destroy();

        this.collectLetter(l.charValue, l.wordId, l.audioPath, l.wordScript, l.wordTranslation);
        l.destroy();
      },
      undefined, this
    );
    }
  }

  private spawnDoors(words: any[]): void {
    console.log('[spawnDoors] Creating doors for', words.length, 'words');
    const { height } = this.cameras.main;

    const doorPositions = [
      { x: 420, y: height - 95 },
      { x: 550, y: height - 95 },
      { x: 680, y: height - 95 },
    ];

    words.forEach((word, i) => {
      if (i >= doorPositions.length) return;
      const pos = doorPositions[i];

      const door = this.physics.add.sprite(pos.x, pos.y, 'door-placeholder');
      door.setDisplaySize(56, 84);
      door.setTint(0xFFAA44);
      (door.body as Phaser.Physics.Arcade.Body).setSize(56, 84);
      (door.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      (door.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.doorsGroup.add(door);

      (door as any).wordId = word.id;
      (door as any).wordScript = word.script;
      (door as any).wordTranslation = word.translation;
      (door as any).wordLetters = word.splitLetters;
      (door as any)._lastTrigger = 0;

      const label = this.add.text(pos.x, pos.y - 55, `🚪 ${word.translation}`, {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '12px', color: '#FFD700',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(90);

      this.activeDoors.push({ wordId: word.id, door });

      // Auto-trigger word puzzle on overlap with cooldown
      this.physics.add.overlap(this.player, door, () => {
        const d = door as any;
        const now = this.time.now;
        if (now - d._lastTrigger < 2000) return; // 2s cooldown
        d._lastTrigger = now;
        console.log('[door overlap] Player touched door:', d.wordId);

        // Check required letters
        const wordLetters = this.collectedLetters
          .filter((l: any) => l.wordId === d.wordId)
          .map((l: any) => l.letter);

        if (wordLetters.length < (d.wordLetters?.length || 0)) {
          this.showMessage(`Need more letters for "${d.wordTranslation}"! (${wordLetters.length}/${d.wordLetters.length})`);
          return;
        }

        d._lastTrigger = now + 10000; // Long cooldown while puzzle is open
        this.openDoor(d.wordId);
      });
    });
  }

  private spawnNPCs(npcs: any[]): void {
    npcs.forEach((npc) => {
      const { x, y } = npc.position;
      const npcSprite = this.physics.add.sprite(x, y, npc.spriteKey || 'npc-placeholder');
      npcSprite.setDisplaySize(48, 48);
      (npcSprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      (npcSprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      npcSprite.setDepth(9);

      // Store NPC data
      (npcSprite as any).npcData = npc;

      // Interaction via overlap
      this.physics.add.overlap(this.player, npcSprite, () => {
        // Show interaction prompt
        // In the real version, this launches DialogueScene
      });
    });
  }

  private spawnFallbackLetters(): void {
    const positions = [
      { x: 250, y: 520 }, { x: 350, y: 480 }, { x: 480, y: 400 },
      { x: 580, y: 360 }, { x: 710, y: 320 }, { x: 810, y: 280 },
      { x: 940, y: 240 }, { x: 600, y: 500 }, { x: 420, y: 550 },
      { x: 750, y: 440 }, { x: 880, y: 380 }, { x: 1020, y: 340 },
    ];

    positions.forEach((pos, i) => {
      const letter = this.physics.add.sprite(pos.x, pos.y, 'letter-placeholder');
      letter.setScale(1.1);
      this.lettersGroup.add(letter);

      // Render label text
      const charText = this.add.text(pos.x, pos.y, 'अ', {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '18px', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9);

      (letter as any).charValue = 'अ';
      (letter as any).wordId = 'fallback';
      (letter as any).charText = charText;

      const glow = this.add.circle(pos.x, pos.y, 22, 0xFFD700, 0.15).setDepth(5);

      const tween = this.tweens.add({
        targets: [letter, charText, glow],
        y: pos.y - 12,
        duration: 1500 + i * 200, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      });
      (letter as any).floatTween = tween;
      (letter as any).glow = glow;
    });

    if (!this.lettersOverlapRegistered) {
      this.lettersOverlapRegistered = true;
      this.physics.add.overlap(this.player, this.lettersGroup, (_, letterObj) => {
        const l = letterObj as any;
        if (!l.active) return;
        l.floatTween?.stop();
        l.glow?.destroy();
        l.charText?.destroy();
        this.collectLetter(
          l.charValue || '?', l.wordId || 'fallback',
          l.audioPath || '', l.wordScript || '', l.wordTranslation || ''
        );
        l.destroy();
      });
    }
  }

  private collectLetter(
    char: string, wordId: string, audioPath: string,
    wordScript: string, translation: string
  ): void {
    this.collectedLetters.push({ letter: char, wordId });

    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit('letterCollected', {
        letter: char, wordId, wordScript, translation,
        totalLetters: this.collectedLetters.length,
      });
    }

    // Play pronunciation audio via Howler
    if (audioPath) {
      try {
        new Howl({ src: [audioPath], format: ['mp3'], volume: 0.7 }).play();
      } catch {}
    }

    this.createCollectEffect(this.player.x, this.player.y - 20);
  }

  private createCollectEffect(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.add.circle(x, y, 3, 0xFFD700, 1);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  update(): void {
    if (!this.player || !this.player.body) return;
    this.handleMovement();
    // Doors now auto-trigger on overlap (no E key needed)
  }

  private checkDoorInteraction(): void {
    const eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    const interactPressed = Phaser.Input.Keyboard.JustDown(eKey);

    if (!this.nearDoor) {
      if (this.doorPrompt) this.doorPrompt.setVisible(false);
      return;
    }

    if (interactPressed && this.nearDoor) {
      console.log('[GameScene] Opening door for word:', this.nearDoor);
      this.openDoor(this.nearDoor);
    }
  }

  private openDoor(wordId: string): void {
    console.log('[openDoor] wordId:', wordId, 'levelWords:', this.levelWords?.length);
    const word = this.levelWords.find((w) => w.id === wordId);
    if (!word) {
      console.warn('[openDoor] Word not found:', wordId);
      return;
    }

    // Get collected letters for this word
    const wordLetters = this.collectedLetters
      .filter((l) => l.wordId === wordId)
      .map((l) => l.letter);

    if (wordLetters.length < (word.splitLetters || []).length) {
      // Not enough letters — flash a hint
      this.showMessage('Collect more letters!');
      return;
    }

    // Launch word puzzle — GameScene listens for completion on its own events
    this.events.once('wordSpelled', (data: any) => {
      const doorEntry = this.activeDoors.find((d) => d.wordId === wordId);
      if (doorEntry) {
        doorEntry.door.destroy();
        this.activeDoors = this.activeDoors.filter((d) => d.wordId !== wordId);
      }

      this.showMessage(`Correct! "${data.word}" means "${data.translation}"`);

      if (this.activeDoors.length === 0) {
        this.time.delayedCall(2000, () => this.levelComplete());
      }
    });

    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    this.scene.launch('WordPuzzleScene', {
      word: word.script,
      translation: word.translation,
      letters: wordLetters,
      correctOrder: word.splitLetters,
    });
  }

  private showMessage(text: string): void {
    const msg = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.3,
      text,
      {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '20px',
        color: '#FFD700',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 },
      }
    );
    msg.setOrigin(0.5);
    msg.setDepth(150);
    msg.setScrollFactor(0);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 40,
      duration: 2500,
      delay: 500,
      onComplete: () => msg.destroy(),
    });
  }

  private levelComplete(): void {
    // Save progress
    import('../systems/SaveManager').then(({ SaveManager }) => {
      SaveManager.getInstance().completeLevel(
        this.languageId,
        this.levelId,
        3, // stars
        this.collectedLetters.map((l) => l.wordId),
        0, // gems
        0  // time
      );
    });

    this.scene.pause('UIScene');

    const { width, height } = this.cameras.main;

    this.cameras.main.flash(500, 255, 215, 0);

    const completeText = this.add.text(width / 2, height / 2, 'Level Complete! 🎉', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '42px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 4,
    });
    completeText.setOrigin(0.5);
    completeText.setDepth(500);
    completeText.setScrollFactor(0);

    this.time.delayedCall(2000, () => {
      this.scene.stop('UIScene');
      this.scene.start('LevelSelectScene');
    });
  }

  // ── Rendering helpers ──

  private createParallaxBackground(): void {
    const { width, height } = this.cameras.main;
    const colors = [
      { color: 0x0D1B2A, scrollFactor: 0 },
      { color: 0x1B2838, scrollFactor: 0.05 },
      { color: 0x2C3E50, scrollFactor: 0.1 },
      { color: 0x1A472A, scrollFactor: 0.2 },
      { color: 0x1E5631, scrollFactor: 0.4 },
      { color: 0x2D5A27, scrollFactor: 0.7 },
    ];

    colors.forEach((layer) => {
      const bg = this.add.rectangle(0, 0, width * 2, height, layer.color);
      bg.setOrigin(0, 0);
      bg.setScrollFactor(layer.scrollFactor);
      bg.setDepth(-10 + layer.scrollFactor * 10);
    });

    const mountains = this.add.graphics();
    mountains.fillStyle(0x1B3A2A, 1);
    mountains.setScrollFactor(0.15);
    mountains.setDepth(-8);
    const peakY = height * 0.6;
    for (let x = 0; x < width * 3; x += 100) {
      const h = Math.sin(x * 0.01) * 80 + Math.cos(x * 0.03) * 40;
      mountains.fillTriangle(x, peakY, x + 50, peakY - h - 20, x + 100, peakY);
    }

    const sunGlow = this.add.circle(900, 150, 200, 0xFFE4B5, 0.08);
    sunGlow.setScrollFactor(0.02);
    sunGlow.setDepth(-9);
    const sun = this.add.circle(900, 150, 40, 0xFFD700, 0.4);
    sun.setScrollFactor(0.02);
    sun.setDepth(-8);
  }

  private createFloatingPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, 0x8B4513);
    platform.setStrokeStyle(2, 0xA0522D);
    const grassTop = this.add.rectangle(x, y - height / 2 - 3, width, 6, 0x228B22);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createTouchControls();
  }

  private createTouchControls(): void {
    const { width, height } = this.cameras.main;
    const btnStyle = { fontSize: '36px', color: '#FFFFFF' };

    const makeBtn = (x: number, label: string, onDown: () => void, onUp: () => void) => {
      const bg = this.add.rectangle(x, height - 80, 100, 100, 0x000000, 0.3);
      bg.setScrollFactor(0).setDepth(100).setInteractive();
      bg.on('pointerdown', onDown);
      bg.on('pointerup', onUp);
      bg.on('pointerout', onUp);
      const txt = this.add.text(x, height - 80, label, btnStyle);
      txt.setOrigin(0.5).setScrollFactor(0).setDepth(101);
    };

    makeBtn(80, '◀', () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    makeBtn(200, '▶', () => { this.touchRight = true; }, () => { this.touchRight = false; });
    makeBtn(width - 80, '▲', () => { this.touchJump = true; }, () => { this.touchJump = false; });
  }

  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.canJump = true;

    const left = this.cursors.left?.isDown || this.wasd.A.isDown || this.touchLeft;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown || this.touchRight;

    if (left) { this.player.setVelocityX(-this.playerSpeed); this.player.setFlipX(true); }
    else if (right) { this.player.setVelocityX(this.playerSpeed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    const jump = this.cursors.up?.isDown || this.wasd.W.isDown || this.spaceBar.isDown || this.touchJump;
    if (jump && onGround && this.canJump) {
      body.velocity.y = this.jumpForce;
      this.canJump = false;
    }
    if (!jump && body.velocity.y < -150) body.velocity.y *= 0.5;
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite { return this.player; }
  getHealth(): number { return this.health; }
  getCollectedLetters(): Array<{ letter: string; wordId: string }> { return this.collectedLetters; }
  getLevelWords(): any[] { return this.levelWords; }
}
