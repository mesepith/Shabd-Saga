import Phaser from 'phaser';
import { Howl } from 'howler';
import { BossData } from '../systems/LanguageManager';
import { TouchControls } from '../systems/TouchControls';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceBar!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;

  private touchControls?: TouchControls;

  private playerSpeed: number = 280;
  private jumpForce: number = -460;
  private canJump: boolean = true;
  private canDoubleJump: boolean = false;
  private health: number = 3;
  private isInvincible: boolean = false;

  // Level data
  private levelId: string = 'world-1-level-1';
  private languageId: string = 'hindi';
  private levelMusicKey: string = 'music-world-1';
  private levelWords: any[] = [];
  private collectedLetters: Array<{ letter: string; wordId: string; wordScript: string; audioPath: string }> = [];
  private activeDoors: Array<{ wordId: string; door: Phaser.Physics.Arcade.Sprite }> = [];
  private lettersGroup!: Phaser.Physics.Arcade.Group;
  private doorsGroup!: Phaser.Physics.Arcade.StaticGroup;

  // NPC interaction
  private nearNPC: any = null;
  private npcPrompt!: Phaser.GameObjects.Text;
  private currentDialogue: Phaser.Scene | null = null;
  private levelBoss: BossData | null = null;

  // Enemy system
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private enemyPatrolZones: Map<string, { left: number; right: number }> = new Map();

  // Checkpoint system
  private checkpointsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private lastCheckpoint: { x: number; y: number } = { x: 100, y: 450 };
  private checkpointActive: Map<string, boolean> = new Map();

  // Health pickups & gems
  private healthPickupsGroup!: Phaser.Physics.Arcade.Group;
  private gemsGroup!: Phaser.Physics.Arcade.Group;

  // Door interaction
  private nearDoor: string | null = null;
  private doorPrompt!: Phaser.GameObjects.Text;
  private doorsOverlapRegistered: boolean = false;
  private lettersOverlapRegistered: boolean = false;

  // Letter Guard system
  private nearGuard: any = null;
  private guardPrompt!: Phaser.GameObjects.Text;
  private activeGuards: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private defeatedGuards: Set<string> = new Set();

  // Player animations
  private currentAnim: string = '';

  private gemsCollected: number = 0;
  private deathsThisLevel: number = 0;
  private levelCompleteGuard: boolean = false;
  private levelCompleteTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { worldId: string; levelId: string; language: string }): void {
    const { width, height } = this.cameras.main;
    this.levelId = data?.levelId || 'world-1-level-1';
    this.languageId = data?.language || 'hindi';
    this.collectedLetters = [];
    this.activeDoors = [];
    this.health = 3;
    this.isInvincible = false;
    this.lettersOverlapRegistered = false;
    this.doorsOverlapRegistered = false;
    this.nearDoor = null;
    this.nearNPC = null;
    this.nearGuard = null;
    this.activeGuards.clear();
    this.defeatedGuards.clear();
    this.currentAnim = '';
    this.currentDialogue = null;
    this.gemsCollected = 0;
    this.deathsThisLevel = 0;
    this.levelBoss = null;
    this.levelCompleteGuard = false;
    if (this.levelCompleteTimer) this.levelCompleteTimer.remove();
    this.levelCompleteTimer = undefined;

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
    this.physics.add.collider(this.lettersGroup, this.platforms);
    this.doorsGroup = this.physics.add.staticGroup();
    this.enemiesGroup = this.physics.add.group({ allowGravity: false });
    this.checkpointsGroup = this.physics.add.staticGroup();
    this.healthPickupsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.gemsGroup = this.physics.add.group({ allowGravity: false, immovable: true });

    this.setupInput();
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.scene.launch('UIScene', { gameScene: this });

    this.events.on('shutdown', () => {
      this.touchControls?.destroy();
    });

    // Create player animations
    this.createPlayerAnimations();

    // Play level music
    this.playLevelMusic();

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

    // NPC interaction prompt
    this.npcPrompt = this.add.text(0, 0, '💬 Press E to talk', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 5 },
      stroke: '#4488FF',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(150).setVisible(false);

    // Letter Guard prompt
    this.guardPrompt = this.add.text(0, 0, '🛡️ Spell to break the barrier! Press E', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '17px',
      color: '#FF8844',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 5 },
      stroke: '#FF4400',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(150).setVisible(false);

    // Permanent instruction at bottom
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 110, 'Collect letters → Walk into doors to unlock!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px', color: '#FFD700',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Spawn letters from level data
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
        this.levelBoss = level.boss || null;
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
        this.spawnEnemies(level.enemies || []);
        this.spawnCheckpoints(level.checkpoints || []);
        this.spawnHealthPickups();
        this.spawnGems();
        this.levelMusicKey = level.musicTrack
          ? level.musicTrack.replace('assets/audio/music/', '').replace('.mp3', '')
          : 'music-world-1';
        this.playLevelMusic();
        console.log('[GameScene] Doors spawned:', this.activeDoors.length);
        this.showMessage(`World: ${level.name} — ${level.words.length} words to learn!`);
      }
    } catch (err) {
      console.error('[GameScene] loadLevelData failed:', err);
      this.spawnFallbackLetters();
    }
  }

  private spawnLetters(words: any[]): void {
    const positions = [
      { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
      { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
      { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
      { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
      { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
      { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
      { x: 250, y: 450 }, { x: 550, y: 560 },
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

    // Overlap detection — register fresh each time
    this.physics.add.overlap(
      this.player, this.lettersGroup,
      (_, letterObj) => {
        const l = letterObj as Phaser.Physics.Arcade.Sprite & {
          charValue: string; wordId: string; audioPath: string;
          wordScript: string; wordTranslation: string;
          charText: Phaser.GameObjects.Text; glow: Phaser.GameObjects.Arc;
          floatTween: Phaser.Tweens.Tween;
          _stolenAt?: number;
        };
        if (!l.active) return;
        if (l._stolenAt && this.time.now - l._stolenAt < 600) return;

        l.floatTween?.stop();
        l.glow?.destroy();
        l.charText?.destroy();

        this.collectLetter(l.charValue, l.wordId, l.audioPath, l.wordScript, l.wordTranslation);
        l.destroy();
      },
      undefined, this
    );
  }

  private spawnDoors(words: any[]): void {
    console.log('[spawnDoors] Creating doors for', words.length, 'words');
    const { height } = this.cameras.main;

    const doorPositions = [
      { x: 350, y: height - 95 },
      { x: 470, y: height - 95 },
      { x: 590, y: height - 95 },
      { x: 710, y: height - 95 },
      { x: 830, y: height - 95 },
      { x: 950, y: height - 95 },
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

      console.log('[spawnDoors] Door', i, 'wordId:', word.id, 'translation:', word.translation, 'at x:', pos.x);

      this.activeDoors.push({ wordId: word.id, door });

      // Auto-trigger word puzzle on overlap with cooldown
      this.physics.add.overlap(this.player, door, () => {
        const d = door as any;
        const now = this.time.now;

        if (now - d._lastTrigger < 2000) return; // 2s cooldown
        d._lastTrigger = now;
        console.log('[door overlap] Player touched door:', d.wordId);
        console.log('[door overlap] collectedLetters total:', this.collectedLetters.length,
          'wordIds:', this.collectedLetters.map((l: any) => l.wordId),
          'letters:', this.collectedLetters.map((l: any) => l.letter));

        // Check if a guard is blocking this specific door
        let guarded = false;
        this.activeGuards.forEach((g: any) => {
          if (g.guardWordId === d.wordId && !this.defeatedGuards.has(g.enemyData?.id)) {
            guarded = true;
          }
        });
        if (guarded) {
          this.showMessage(`A Letter Guard blocks this door! Defeat the guard first!`);
          return;
        }

        const wordLetters = this.collectedLetters
        .filter((l: any) => l.wordId === d.wordId)
        .map((l: any) => l.letter);

      console.log('[door overlap] wordLetters for', d.wordId, ':', wordLetters, 'need:', d.wordLetters?.length);

        if (wordLetters.length < (d.wordLetters?.length || 0)) {
          // Check if these letters are still on the ground somewhere
          let groundCount = 0;
          this.lettersGroup.getChildren().forEach((letter: any) => {
            if (letter.active && letter.wordId === d.wordId && !letter.isStolenDrop) groundCount++;
            if (letter.stolen && letter.wordId === d.wordId) groundCount++;
          });
          if (groundCount > 0) {
            this.showMessage(`Your "${d.wordTranslation}" letters were stolen! Find the red/blue glow! (${wordLetters.length}/${d.wordLetters.length})`);
          } else {
            this.showMessage(`Need more letters for "${d.wordTranslation}"! (${wordLetters.length}/${d.wordLetters.length})`);
          }
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
      const spriteKey = npc.spriteKey === 'npc-placeholder'
        ? this.getNPCKey(npc.id)
        : npc.spriteKey;
      const npcSprite = this.physics.add.sprite(x, y, spriteKey);
      npcSprite.setDisplaySize(48, 48);
      (npcSprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      (npcSprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      npcSprite.setDepth(9);

      (npcSprite as any).npcData = npc;

      // Name label above NPC
      const nameLabel = this.add.text(x, y - 34, npc.name, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '12px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9);

      // Show prompt + allow dialogue on overlap
      this.physics.add.overlap(this.player, npcSprite, () => {
        if (this.currentDialogue) return;
        const d = npcSprite as any;
        this.nearNPC = d.npcData;
        this.npcPrompt.setPosition(d.x, d.y - 54);
        this.npcPrompt.setVisible(true);
      });
    });
  }

  private getNPCKey(npcId: string): string {
    if (npcId.includes('owl')) return 'npc-owl';
    if (npcId.includes('monkey')) return 'npc-monkey';
    if (npcId.includes('deer')) return 'npc-deer';
    return 'npc-owl';
  }

  private spawnFallbackLetters(): void {
    const positions = [
      { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
      { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
      { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
      { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
      { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
      { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
      { x: 250, y: 450 }, { x: 550, y: 560 },
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
        if (l._stolenAt && this.time.now - l._stolenAt < 600) return;
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
    console.log('[collectLetter] char:', char, 'wordId:', wordId, 'total before:', this.collectedLetters.length);

    // Defensive: recover correct wordId if missing or fallback
    if (!wordId || wordId === 'fallback') {
      for (const w of this.levelWords) {
        if ((w.splitLetters || []).includes(char)) {
          wordId = w.id;
          wordScript = w.script;
          audioPath = audioPath || `assets/audio/speech/${this.languageId}/${w.id}.mp3`;
          break;
        }
      }
    }
    if (!wordId) wordId = 'unknown';

    this.collectedLetters.push({ letter: char, wordId, wordScript, audioPath });

    this.events.emit('letterCollected', {
      letter: char, wordId, wordScript, translation,
      totalLetters: this.collectedLetters.length,
    });

    this.playSFX('sfx-collect');

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
    this.updateGuards();
    this.handleNPCInteraction();
    this.updateEnemies();
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

      // Remove consumed letters so enemy steals can't target already-used letters
      this.collectedLetters = this.collectedLetters.filter((l) => l.wordId !== wordId);
      this.events.emit('letterConsumed', { remaining: this.collectedLetters.length, wordId });

      this.playSFX('sfx-door-open');
      this.showMessage(`Correct! "${data.word}" means "${data.translation}"`);

      if (this.activeDoors.length === 0) {
        this.levelCompleteTimer = this.time.delayedCall(2000, () => this.levelComplete());
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
    if (this.levelCompleteGuard) {
      console.warn('[GameScene] levelComplete suppressed: already called');
      return;
    }
    this.levelCompleteGuard = true;

    // Check if level has a boss fight
    if (this.levelBoss && this.activeDoors.length === 0) {
      console.log('[GameScene] Launching BossScene for level:', this.levelId);
      this.scene.pause('UIScene');
      this.scene.pause('GameScene');

      // Listen for resume — fired when BossScene stops and resumes us
      this.events.once('resume', () => {
        this.time.delayedCall(200, () => {
          this.completeLevelAndProgress();
        });
      });

      // Pre-resolve word data for boss sentences
      import('../systems/LanguageManager').then(({ LanguageManager }) => {
        const lm = LanguageManager.getInstance();
        const wordMap: Record<string, { script: string; translation: string; splitLetters: string[] }> = {};

        // Look up all required words from boss sentences
        for (const sentence of this.levelBoss!.sentences) {
          for (const wid of sentence.requiredWords) {
            if (!wordMap[wid]) {
              const word = lm.getWord(wid);
              if (word) {
                wordMap[wid] = { script: word.script, translation: word.translation, splitLetters: word.splitLetters };
              }
            }
          }
        }

        this.scene.launch('BossScene', {
          bossConfig: this.levelBoss,
          resolvedWords: wordMap,
          onBossDefeated: () => {
            this.scene.stop('BossScene');
            this.scene.resume('GameScene');
          },
        });
      });
      return;
    }

    this.completeLevelAndProgress();
  }

  private completeLevelAndProgress(): void {
    this.playSFX('sfx-success');

    const stars = this.calculateStars();

    import('../systems/SaveManager').then(({ SaveManager }) => {
      SaveManager.getInstance().completeLevel(
        this.languageId,
        this.levelId,
        stars,
        this.collectedLetters.map((l) => l.wordId),
        this.gemsCollected,
        0  // time
      );
    });

    this.scene.pause('UIScene');

    const { width, height } = this.cameras.main;

    this.cameras.main.flash(500, 255, 215, 0);

    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const completeText = this.add.text(width / 2, height / 2, `Level Complete!\n${starStr}`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '42px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 4,
      align: 'center',
    });
    completeText.setOrigin(0.5);
    completeText.setDepth(500);
    completeText.setScrollFactor(0);

    // Check if next level exists in same world
    const nextLevelId = this.getNextLevelId();
    const hasNextLevel = !!nextLevelId;

    this.time.delayedCall(2500, () => {
      const { width: w, height: h } = this.cameras.main;

      if (hasNextLevel) {
        // Next Level button
        const nextBtn = this.add.text(w / 2, h / 2 + 80, 'Next Level →', {
          fontFamily: 'Noto Sans, system-ui, sans-serif',
          fontSize: '24px',
          color: '#44FF44',
          backgroundColor: '#00000088',
          padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setDepth(500).setScrollFactor(0).setInteractive({ useHandCursor: true });

        nextBtn.on('pointerdown', () => {
          this.scene.stop('UIScene');
          this.scene.restart({ worldId: `world-${this.getWorldNum()}`, levelId: nextLevelId, language: this.languageId });
        });
        nextBtn.on('pointerover', () => nextBtn.setColor('#88FF88'));
        nextBtn.on('pointerout', () => nextBtn.setColor('#44FF44'));
      }

      // Back to menu button
      const menuBtn = this.add.text(w / 2, h / 2 + (hasNextLevel ? 130 : 60), '← Level Select', {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '20px',
        color: '#AAAACC',
        backgroundColor: '#00000088',
        padding: { x: 15, y: 8 },
      }).setOrigin(0.5).setDepth(500).setScrollFactor(0).setInteractive({ useHandCursor: true });

      menuBtn.on('pointerdown', () => {
        this.scene.stop('UIScene');
        this.scene.start('LevelSelectScene');
      });
      menuBtn.on('pointerover', () => menuBtn.setColor('#FFFFFF'));
      menuBtn.on('pointerout', () => menuBtn.setColor('#AAAACC'));
    });
  }

  private calculateStars(): number {
    let stars = 1; // base: all doors completed
    if (this.deathsThisLevel === 0) stars++;
    if (this.gemsCollected >= 3) stars++;
    return Math.min(stars, 3);
  }

  private getWorldNum(): number {
    const match = this.levelId.match(/world-(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  private getNextLevelId(): string | null {
    const match = this.levelId.match(/world-(\d+)-level-(\d+)/);
    if (!match) return null;
    const worldNum = parseInt(match[1]);
    const levelNum = parseInt(match[2]);
    const nextId = `world-${worldNum}-level-${levelNum + 1}`;
    return nextId;
  }

  // ── Rendering helpers ──

  private createParallaxBackground(): void {
    const { width, height } = this.cameras.main;
    const worldNum = this.getWorldNum();

    // World-specific color palettes
    const palettes: Record<number, Array<{ color: number; scrollFactor: number }>> = {
      1: [ // Jungle
        { color: 0x0D1B2A, scrollFactor: 0 },
        { color: 0x1B2838, scrollFactor: 0.05 },
        { color: 0x2C3E50, scrollFactor: 0.1 },
        { color: 0x1A472A, scrollFactor: 0.2 },
        { color: 0x1E5631, scrollFactor: 0.4 },
        { color: 0x2D5A27, scrollFactor: 0.7 },
      ],
      2: [ // Village
        { color: 0x1A1428, scrollFactor: 0 },
        { color: 0x2A1F3D, scrollFactor: 0.05 },
        { color: 0x3D2E52, scrollFactor: 0.1 },
        { color: 0x4A3F3A, scrollFactor: 0.2 },
        { color: 0x5C4A3A, scrollFactor: 0.4 },
        { color: 0x6B5540, scrollFactor: 0.7 },
      ],
      3: [ // Palace
        { color: 0x0A0A1E, scrollFactor: 0 },
        { color: 0x141438, scrollFactor: 0.05 },
        { color: 0x1E1E4A, scrollFactor: 0.1 },
        { color: 0x2A2A5C, scrollFactor: 0.2 },
        { color: 0x35356E, scrollFactor: 0.4 },
        { color: 0x404080, scrollFactor: 0.7 },
      ],
    };

    const colors = palettes[worldNum] || palettes[1];

    colors.forEach((layer) => {
      const bg = this.add.rectangle(0, 0, width * 2, height, layer.color);
      bg.setOrigin(0, 0);
      bg.setScrollFactor(layer.scrollFactor);
      bg.setDepth(-10 + layer.scrollFactor * 10);
    });

    // Decorative elements vary by world
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0.15);
    gfx.setDepth(-8);

    if (worldNum === 1) {
      // Jungle mountains
      gfx.fillStyle(0x1B3A2A, 1);
      const peakY = height * 0.6;
      for (let x = 0; x < width * 3; x += 100) {
        const h = Math.sin(x * 0.01) * 80 + Math.cos(x * 0.03) * 40;
        gfx.fillTriangle(x, peakY, x + 50, peakY - h - 20, x + 100, peakY);
      }
    } else if (worldNum === 2) {
      // Village houses
      gfx.fillStyle(0x4A3F3A, 1);
      const houseY = height * 0.55;
      for (let x = 50; x < width * 3; x += 160) {
        gfx.fillRect(x, houseY, 60, 50);
        gfx.fillStyle(0x3D2E52, 1);
        gfx.fillTriangle(x - 5, houseY, x + 30, houseY - 35, x + 65, houseY);
        gfx.fillStyle(0x4A3F3A, 1);
        // Window
        gfx.fillStyle(0xFFD700, 0.4);
        gfx.fillRect(x + 15, houseY + 12, 10, 10);
        gfx.fillRect(x + 35, houseY + 12, 10, 10);
        gfx.fillStyle(0x4A3F3A, 1);
      }
    } else if (worldNum === 3) {
      // Palace pillars
      const pillarY = height * 0.5;
      for (let x = 20; x < width * 3; x += 200) {
        gfx.fillStyle(0x4A4A7A, 0.6);
        gfx.fillRect(x, pillarY, 20, 120);
        gfx.fillStyle(0xFFD700, 0.3);
        gfx.fillRect(x - 4, pillarY, 28, 8);
        gfx.fillRect(x - 4, pillarY + 112, 28, 8);
      }
    }

    if (worldNum <= 2) {
      const sunGlow = this.add.circle(900, 150, 200, 0xFFE4B5, 0.08);
      sunGlow.setScrollFactor(0.02);
      sunGlow.setDepth(-9);
      const sun = this.add.circle(900, 150, 40, 0xFFD700, 0.4);
      sun.setScrollFactor(0.02);
      sun.setDepth(-8);
    } else {
      // Moon for palace world
      const moonGlow = this.add.circle(900, 150, 200, 0x8888CC, 0.08);
      moonGlow.setScrollFactor(0.02);
      moonGlow.setDepth(-9);
      const moon = this.add.circle(900, 150, 35, 0xCCCCFF, 0.3);
      moon.setScrollFactor(0.02);
      moon.setDepth(-8);
      const moonShadow = this.add.circle(915, 140, 30, 0x0A0A1E, 0.8);
      moonShadow.setScrollFactor(0.018);
      moonShadow.setDepth(-7);
    }
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
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    if (TouchControls.isTouchDevice(this)) {
      this.touchControls = new TouchControls(this);
    }
  }

  handleMovement(custom?: { left: boolean; right: boolean; jump: boolean }): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.canJump = true;

    const left = custom?.left ?? (this.cursors.left?.isDown || this.wasd.A.isDown || (this.touchControls?.movementForce.x ?? 0) < -0.3);
    const right = custom?.right ?? (this.cursors.right?.isDown || this.wasd.D.isDown || (this.touchControls?.movementForce.x ?? 0) > 0.3);

    if (left) { this.player.setVelocityX(-this.playerSpeed); this.player.setFlipX(true); }
    else if (right) { this.player.setVelocityX(this.playerSpeed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    const jump = custom?.jump ?? (this.cursors.up?.isDown || this.wasd.W.isDown || this.spaceBar.isDown || (this.touchControls?.jumpHeld ?? false));
    if (jump && onGround && this.canJump) {
      body.velocity.y = this.jumpForce;
      this.canJump = false;
      this.playSFX('sfx-jump');
    }
    if (!jump && body.velocity.y < -150) body.velocity.y *= 0.5;

    this.updatePlayerAnimation(onGround, left || right);
  }

  // ── Enemy System ──

  private spawnEnemies(enemies: any[]): void {
    const { height } = this.cameras.main;
    if (!enemies || enemies.length === 0) {
      if (this.levelId === 'world-1-level-1') {
        enemies = [
          { id: 'creeper_1', type: 'shadow-creeper', position: { x: 550, y: height - 90 }, patrolRange: 200 },
          { id: 'creeper_2', type: 'shadow-creeper', position: { x: 720, y: 410 }, patrolRange: 140 },
        ];
      } else if (this.levelId === 'world-1-level-2') {
        enemies = [
          { id: 'creeper_1', type: 'shadow-creeper', position: { x: 400, y: height - 90 }, patrolRange: 240 },
          { id: 'creeper_2', type: 'shadow-creeper', position: { x: 750, y: height - 90 }, patrolRange: 200 },
          { id: 'creeper_3', type: 'shadow-creeper', position: { x: 1050, y: 410 }, patrolRange: 160 },
        ];
      } else {
        enemies = [
          { id: 'creeper_1', type: 'shadow-creeper', position: { x: 500, y: height - 90 }, patrolRange: 200 },
          { id: 'creeper_2', type: 'shadow-creeper', position: { x: 850, y: 410 }, patrolRange: 160 },
        ];
      }
    }

    enemies.forEach((enemy: any) => {
      const { x, y } = enemy.position;
      const range = enemy.patrolRange || 150;

      if (enemy.type === 'letter-guard') {
        this.spawnGuard(enemy);
        return;
      }

      const enemySprite = this.physics.add.sprite(x, y, enemy.type || 'shadow-creeper');
      enemySprite.setDisplaySize(40, 40);
      (enemySprite.body as Phaser.Physics.Arcade.Body).setSize(40, 40);
      (enemySprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      enemySprite.setDepth(8);
      enemySprite.setTint(0x9922AA);

      (enemySprite as any).enemyData = enemy;
      (enemySprite as any).patrolLeft = x - range;
      (enemySprite as any).patrolRight = x + range;
      (enemySprite as any).speed = 60 + Math.random() * 40;
      (enemySprite as any).direction = 1;

      this.enemiesGroup.add(enemySprite);

      // Float visual effect
      this.tweens.add({
        targets: enemySprite,
        y: y - 6,
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Patrol zone marker
      const zone = this.add.rectangle(x, y + 30, range * 2, 4, 0x9922AA, 0.2);
      zone.setDepth(4);
      this.enemyPatrolZones.set(enemy.id, { left: x - range, right: x + range });
    });

    // Overlap registration removed — now checked manually in updateEnemies()
  }

  private spawnGuard(guardData: any): void {
    if (this.defeatedGuards.has(guardData.id)) return;

    const { x, y } = guardData.position;
    const guardWordId = guardData.guardWordId;

    const guardWord = this.levelWords.find((w: any) => w.id === guardWordId);
    if (!guardWord) {
      console.warn('[spawnGuard] Guard word not found:', guardWordId);
      return;
    }

    const guard = this.physics.add.sprite(x, y, 'letter-placeholder');
    guard.setDisplaySize(50, 50);
    (guard.body as Phaser.Physics.Arcade.Body).setSize(50, 50);
    (guard.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    guard.setTint(0xCC4422);
    guard.setDepth(8);

    (guard as any).enemyData = guardData;
    (guard as any).type = 'letter-guard';
    (guard as any).guardWordId = guardWordId;
    (guard as any)._lastPuzzle = 0;

    this.enemiesGroup.add(guard);
    this.activeGuards.set(guardData.id, guard);

    this.tweens.add({
      targets: guard,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const zone = this.add.rectangle(x, y + 30, 120, 4, 0xCC4422, 0.3);
    zone.setDepth(4);
    (guard as any).blockZone = zone;

    const label = this.add.text(x, y - 40, `🛡️ ${guardWord.translation}`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '11px',
      color: '#FF8844',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);
    (guard as any).guardLabel = label;
    this.tweens.add({
      targets: label,
      y: y - 45,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const shield = this.add.text(x, y - 20, '🛡️', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(10);
    (guard as any).shieldIcon = shield;
  }

  private stealLetter(): void {
    if (this.collectedLetters.length === 0) return;

    const stolen = this.collectedLetters.pop()!;

    this.events.emit('letterStolen', {
      letter: stolen.letter,
      totalLetters: this.collectedLetters.length,
    });

    this.playSFX('sfx-hurt');

    const stealText = this.add.text(this.player.x, this.player.y - 30, `${stolen.letter} ✖`, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '22px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: stealText,
      y: stealText.y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => stealText.destroy(),
    });

    const droppedLetter = this.physics.add.sprite(this.player.x + Phaser.Math.Between(-40, 40), this.player.y - 50, 'letter-placeholder');
    droppedLetter.setScale(1.1);
    droppedLetter.setDepth(8);
    droppedLetter.setBounce(0.4);
    (droppedLetter as any).charValue = stolen.letter;
    (droppedLetter as any).wordId = stolen.wordId;
    (droppedLetter as any).wordScript = stolen.wordScript;
    (droppedLetter as any).audioPath = stolen.audioPath;
    (droppedLetter as any).stolen = true;
    (droppedLetter as any)._stolenAt = this.time.now;
    (droppedLetter as any).lifespan = this.time.now + 60000;
    (droppedLetter as any).isStolenDrop = true;
    (droppedLetter as any)._warnedExpiry = false;

    // Add to group BEFORE setting gravity — group.add() resets body properties
    this.lettersGroup.add(droppedLetter);
    (droppedLetter.body as Phaser.Physics.Arcade.Body).allowGravity = true;
    (droppedLetter.body as Phaser.Physics.Arcade.Body).immovable = false;
    droppedLetter.setCollideWorldBounds(true);

    const spreadX = Phaser.Math.Between(-300, 300);
    const spreadY = -280 - Phaser.Math.Between(0, 150);
    droppedLetter.setVelocity(spreadX, spreadY);

    // Pulsing red glow on stolen drop to make it noticeable
    const dropGlow = this.add.circle(droppedLetter.x, droppedLetter.y, 16, 0xFF4444, 0.3);
    dropGlow.setDepth(5);
    (droppedLetter as any).glow = dropGlow;
    this.tweens.add({
      targets: dropGlow,
      alpha: 0.1,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    const charText = this.add.text(droppedLetter.x, droppedLetter.y, stolen.letter, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);
    (droppedLetter as any).charText = charText;

    this.showMessage(`A shadow stole "${stolen.letter}"! Grab it back!`);
  }

  private respawnLetter(char: string, wordId: string, wordScript: string, audioPath: string, x: number, y: number): void {
    const letter = this.physics.add.sprite(x, y, 'letter-placeholder');
    letter.setScale(1.1);
    letter.setDepth(8);
    (letter.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    (letter.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    this.lettersGroup.add(letter);

    (letter as any).charValue = char;
    (letter as any).wordId = wordId;
    (letter as any).wordScript = wordScript;
    (letter as any).audioPath = audioPath;

    const charText = this.add.text(x, y, char, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);
    (letter as any).charText = charText;

    // Blue glow to distinguish respawned letters from originals
    const glow = this.add.circle(x, y, 18, 0x66AAFF, 0.25);
    glow.setDepth(5);
    (letter as any).glow = glow;

    // Float animation
    const tween = this.tweens.add({
      targets: [letter, charText, glow],
      y: y - 12,
      duration: 1800,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
    (letter as any).floatTween = tween;

    // Fade in
    letter.setAlpha(0);
    this.tweens.add({ targets: letter, alpha: 1, duration: 500 });
    charText.setAlpha(0);
    this.tweens.add({ targets: charText, alpha: 1, duration: 500 });

    this.showMessage(`"${char}" reappeared nearby!`);
  }

  private spawnCheckpoints(checkpoints: any[]): void {
    if (!checkpoints || checkpoints.length === 0) {
      checkpoints = [{ id: 'start', x: 100, y: 450, activated: true }];
    }

    checkpoints.forEach((cp: any) => {
      const flag = this.add.rectangle(cp.x, cp.y - 20, 6, 40, 0xFFD700, 0.9);
      flag.setDepth(7);
      this.physics.add.existing(flag, true);
      this.checkpointsGroup.add(flag);

      const pole = this.add.rectangle(cp.x, cp.y - 50, 4, 20, 0xDDDDDD, 0.9);
      pole.setDepth(7);
      this.physics.add.existing(pole, true);
      this.checkpointsGroup.add(pole);

      const base = this.add.rectangle(cp.x, cp.y, 16, 6, 0x888888, 0.9);
      base.setDepth(7);
      this.physics.add.existing(base, true);
      this.checkpointsGroup.add(base);

      (flag as any).checkpointId = cp.id;
      this.checkpointActive.set(cp.id, cp.activated || false);

      if (cp.activated) {
        flag.setFillStyle(0x00FF44, 0.9);
        this.lastCheckpoint = { x: cp.x, y: cp.y - 60 };
      }
    });

    this.physics.add.overlap(this.player, this.checkpointsGroup, (_, cpObj) => {
      const cp = cpObj as any;
      const cpId = cp.checkpointId;
      if (!cpId || this.checkpointActive.get(cpId)) return;

      this.checkpointActive.set(cpId, true);
      this.lastCheckpoint = { x: cp.x, y: cp.y - 80 };

      cp.setFillStyle(0x00FF44, 0.9);
      this.playSFX('sfx-collect');

      const glow = this.add.circle(cp.x, cp.y - 20, 30, 0x00FF44, 0.3);
      glow.setDepth(6);
      this.tweens.add({
        targets: glow,
        scaleX: 2, scaleY: 2, alpha: 0,
        duration: 800,
        onComplete: () => glow.destroy(),
      });

      this.showMessage('Checkpoint reached!');
    });
  }

  private spawnHealthPickups(): void {
    this.healthPickupsGroup.clear(true, true);

    const positions = [
      { x: 500, y: 590 }, { x: 800, y: 430 },
    ];

    positions.forEach((pos) => {
      const pickup = this.physics.add.sprite(pos.x, pos.y, 'letter-placeholder');
      pickup.setScale(0.8);
      pickup.setTint(0xCC3333);
      pickup.setDepth(8);
      (pickup.body as Phaser.Physics.Arcade.Body).setSize(28, 28);
      (pickup.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.healthPickupsGroup.add(pickup);

      // Heart label
      const label = this.add.text(pos.x, pos.y, '❤️', {
        fontSize: '18px',
      }).setOrigin(0.5).setDepth(9);

      this.tweens.add({
        targets: [pickup, label],
        y: pos.y - 8,
        duration: 1200 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      (pickup as any).label = label;
    });

    this.physics.add.overlap(this.player, this.healthPickupsGroup, (_, pickupObj) => {
      const pickup = pickupObj as any;
      if (this.health >= 3) return;

      this.health++;
      this.playSFX('sfx-collect');

      if (pickup.label) pickup.label.destroy();
      pickup.destroy();

      this.showMessage('+1 HP recovered!');
    });
  }

  private spawnGems(): void {
    this.gemsGroup.clear(true, true);

    // Default gem positions across the level
    const positions = [
      { x: 350, y: 590 }, { x: 650, y: 440 }, { x: 900, y: 360 },
      { x: 1050, y: 280 }, { x: 550, y: 580 },
    ];

    positions.forEach((pos) => {
      const gem = this.physics.add.sprite(pos.x, pos.y, 'letter-placeholder');
      gem.setScale(0.7);
      gem.setTint(0xFFD700);
      gem.setDepth(8);
      (gem.body as Phaser.Physics.Arcade.Body).setSize(20, 20);
      (gem.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.gemsGroup.add(gem);

      // Diamond label rendered on top
      const label = this.add.text(pos.x, pos.y, '💎', {
        fontSize: '16px',
      }).setOrigin(0.5).setDepth(9);

      // Float animation
      this.tweens.add({
        targets: [gem, label],
        y: pos.y - 8,
        duration: 1500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      (gem as any).label = label;
    });

    this.physics.add.overlap(this.player, this.gemsGroup, (_, gemObj) => {
      const gem = gemObj as any;
      this.gemsCollected++;
      this.playSFX('sfx-collect');

      // Burst particles
      const bx = gem.x;
      const by = gem.y;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const p = this.add.circle(bx, by, 2, 0xFFD700, 1);
        p.setDepth(12);
        this.tweens.add({
          targets: p,
          x: bx + Math.cos(a) * 30,
          y: by + Math.sin(a) * 30,
          alpha: 0,
          duration: 400,
          onComplete: () => p.destroy(),
        });
      }

      // Emit on GameScene events so UIScene receives it
      this.events.emit('gemCollected', this.gemsCollected);

      // Destroy label
      if (gem.label) gem.label.destroy();
      gem.destroy();
    });
  }

  private invincibleTimer?: Phaser.Time.TimerEvent;

  private damagePlayer(): void {
    if (this.isInvincible) return;

    this.health--;
    this.isInvincible = true;

    this.playSFX('sfx-hurt');
    this.cameras.main.shake(200, 0.015);
    this.cameras.main.flash(200, 255, 0, 0);

    // Blink: toggle tint every 120ms
    let blinkOn = true;
    this.player.setTint(0xFF0000);
    const blinkEvent = this.time.addEvent({
      delay: 120,
      repeat: 7, // 8 toggles × 120ms = ~960ms
      callback: () => {
        blinkOn = !blinkOn;
        this.player.setTint(blinkOn ? 0xFF0000 : 0xFFFFFF);
      },
    });
    (this.player as any)._blinkTimer = blinkEvent;

    this.invincibleTimer = this.time.delayedCall(1000, () => {
      if ((this.player as any)._blinkTimer) {
        (this.player as any)._blinkTimer.remove();
        (this.player as any)._blinkTimer = null;
      }
      this.player.clearTint();
      this.isInvincible = false;
    });

    if (this.health <= 0) {
      if (blinkEvent) blinkEvent.remove();
      this.player.clearTint();
      this.playerDeath();
    }
  }

  private playerDeath(): void {
    // Cancel any active blink timer
    if ((this.player as any)._blinkTimer) {
      (this.player as any)._blinkTimer.remove();
      (this.player as any)._blinkTimer = null;
    }
    this.player.clearTint();
    this.player.setVelocity(0, -300);
    (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = true;

    this.time.delayedCall(800, () => {
      this.respawnAtCheckpoint();
    });
  }

  private respawnAtCheckpoint(): void {
    this.deathsThisLevel++;
    this.health = 3;
    this.isInvincible = false;
    this.player.clearTint();

    this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
    this.player.setVelocity(0, 0);

    this.cameras.main.fadeIn(500);

    if (this.currentDialogue) {
      this.scene.stop('DialogueScene');
      this.currentDialogue = null;
      this.scene.resume('GameScene');
      this.scene.resume('UIScene');
    }

    this.enemiesGroup.getChildren().forEach((enemy: any) => {
      enemy.setVelocity(0, 0);
    });

    this.showMessage('Respawned! Stay alert!');

    // Cancel any pending level complete timer from openDoor
    if (this.levelCompleteTimer) {
      this.levelCompleteTimer.remove();
      this.levelCompleteTimer = undefined;
    }

    // If all doors are already opened, trigger level completion
    if (this.activeDoors.length === 0 && this.levelWords.length > 0 && !this.levelCompleteGuard) {
      this.levelCompleteTimer = this.time.delayedCall(1500, () => this.levelComplete());
      return;
    }

    this.events.emit('letterStolen', {
      letter: '',
      totalLetters: this.collectedLetters.length,
    });
  }

  private handleNPCInteraction(): void {
    if (this.nearGuard) {
      this.guardPrompt.setVisible(true);
      const justPressed = this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey);
      if (justPressed || this.touchControls?.interactPressed) {
        if (this.touchControls) this.touchControls.interactPressed = false;
        this.guardPrompt.setVisible(false);
        this.openGuardPuzzle(this.nearGuard);
      }
      return;
    }

    this.guardPrompt.setVisible(false);

    if (!this.nearNPC) {
      this.npcPrompt.setVisible(false);
      return;
    }

    const justPressed = this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey);
    if (!justPressed && !this.touchControls?.interactPressed) return;
    if (this.touchControls) this.touchControls.interactPressed = false;

    const npcData = this.nearNPC;
    if (!npcData || !npcData.dialogues) return;

    this.npcPrompt.setVisible(false);

    this.scene.pause('GameScene');
    this.scene.pause('UIScene');

    this.scene.launch('DialogueScene', {
      dialogue: npcData.dialogues,
      onComplete: () => {
        this.currentDialogue = null;
        this.nearNPC = null;
        this.scene.resume('GameScene');
        this.scene.resume('UIScene');
        this.playLevelMusic();
      },
    });
    this.currentDialogue = this.scene.get('DialogueScene');
  }

  private createPlayerAnimations(): void {
    if (this.anims.exists('player-idle')) return;

    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle-sheet', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run-sheet', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  private updatePlayerAnimation(onGround: boolean, isMoving: boolean): void {
    let animKey = '';
    if (!onGround) {
      animKey = '';
    } else if (isMoving) {
      animKey = 'player-run';
    } else {
      animKey = 'player-idle';
    }

    if (animKey && animKey !== this.currentAnim) {
      this.currentAnim = animKey;
      this.player.play(animKey);
    }
  }

  private playLevelMusic(): void {
    try {
      this.sound.stopByKey('music-world-1');
      this.sound.stopByKey('music-world-2');
      this.sound.stopByKey('music-world-3');

      const musicKey = this.levelMusicKey.startsWith('music-')
        ? this.levelMusicKey
        : `music-${this.levelMusicKey}`;

      if (this.sound.get(musicKey)) {
        this.sound.play(musicKey, { loop: true, volume: 0.3 });
      }
    } catch {}
  }

  private playSFX(key: string): void {
    try {
      if (this.sound.get(key)) {
        this.sound.play(key, { volume: 0.5 });
      }
    } catch {}
  }

  private updateEnemies(): void {
    const now = this.time.now;

    this.enemiesGroup.getChildren().forEach((enemy: any) => {
      if (!enemy.active) return;
      if (enemy.type === 'letter-guard') return; // guards handled in updateGuards()

      // Patrol movement
      const left = enemy.patrolLeft;
      const right = enemy.patrolRight;
      const dir = enemy.direction;
      const speed = enemy.speed;
      enemy.setVelocityX(speed * dir);

      if (enemy.x <= left) {
        enemy.direction = 1;
        enemy.setFlipX(false);
      } else if (enemy.x >= right) {
        enemy.direction = -1;
        enemy.setFlipX(true);
      }

      // Manual distance-based contact check
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      if (Math.abs(dx) < 40 && Math.abs(dy) < 44) {
        if (enemy._lastContact && now - enemy._lastContact < 1500) return;
        enemy._lastContact = now;

        // Always apply knockback
        const knockback = this.player.x < enemy.x ? -250 : 250;
        this.player.setVelocityX(knockback);
        this.player.setVelocityY(-280);

        if (this.collectedLetters.length > 0) {
          this.stealLetter();
        }

        this.damagePlayer();

        enemy.setTint(0xFF0000);
        this.time.delayedCall(150, () => {
          if (enemy.active) enemy.setTint(0x9922AA);
        });
      }
    });

    // Clean up stolen letters — animate position + check expiry
    this.lettersGroup.getChildren().forEach((letter: any) => {
      if (letter.stolen) {
        if (letter.charText) {
          letter.charText.setPosition(letter.x, letter.y);
        }
        if (letter.glow) {
          letter.glow.setPosition(letter.x, letter.y);
        }

        // Flash warning when about to expire (last 10 seconds)
        const remaining = letter.lifespan - now;
        if (remaining < 10000 && remaining > 0) {
          if (!letter._warnedExpiry) {
            letter._warnedExpiry = true;
            // Speed up the glow pulse to warn player
            if (letter.glow) {
              this.tweens.killTweensOf(letter.glow);
              this.tweens.add({
                targets: letter.glow,
                alpha: 0.05,
                duration: 200,
                yoyo: true,
                repeat: -1,
              });
            }
            // Flash the letter red
            this.tweens.add({
              targets: letter,
              alpha: 0.3,
              duration: 250,
              yoyo: true,
              repeat: -1,
            });
          }
        }

        if (now > letter.lifespan) {
          // Expired — respawn the letter so player isn't soft-locked
          const char = letter.charValue;
          const wid = letter.wordId;
          const ws = letter.wordScript;
          const ap = letter.audioPath;

          // Destroy old letter visuals
          if (letter.charText) letter.charText.destroy();
          if (letter.glow) letter.glow.destroy();
          letter.destroy();

          // Spawn the letter at the player's camera position so it's always reachable
          const cam = this.cameras.main;
          const rx = cam.scrollX + (cam.width * 0.2) + Phaser.Math.Between(-60, 60);
          const ry = cam.scrollY + (cam.height * 0.25) + Phaser.Math.Between(0, 120);
          this.respawnLetter(char, wid, ws, ap, rx, ry);
        }
      }
    });
  }

  private updateGuards(): void {
    this.nearGuard = null;

    this.activeGuards.forEach((guard: any) => {
      if (!guard.active || (guard as any).type !== 'letter-guard') return;

      guard.guardLabel?.setPosition(guard.x, guard.y - 40);
      guard.shieldIcon?.setPosition(guard.x, guard.y - 20);
      guard.blockZone?.setPosition(guard.x, guard.y + 30);

      const dx = this.player.x - guard.x;
      const dy = this.player.y - guard.y;
      if (Math.abs(dx) < 70 && Math.abs(dy) < 80) {
        this.nearGuard = guard;
        this.guardPrompt.setPosition(guard.x, guard.y - 60);
      }
    });
  }

  private openGuardPuzzle(guard: any): void {
    const now = this.time.now;
    if (guard._lastPuzzle && now - guard._lastPuzzle < 3000) return;
    guard._lastPuzzle = now;

    const guardWordId = guard.guardWordId;
    const word = this.levelWords.find((w: any) => w.id === guardWordId);
    if (!word) {
      console.warn('[openGuardPuzzle] Word not found:', guardWordId);
      return;
    }

    const wordLetters = this.collectedLetters
      .filter((l) => l.wordId === guardWordId)
      .map((l) => l.letter);

    if (wordLetters.length < (word.splitLetters || []).length) {
      this.showMessage(`Collect letters for "${word.translation}" to defeat the guard!`);
      return;
    }

    this.events.once('wordSpelled', (data: any) => {
      this.defeatGuard(guard);
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

  private defeatGuard(guard: any): void {
    if (!guard.active) return;

    const guardWordId = guard.guardWordId;
    const word = this.levelWords.find((w: any) => w.id === guardWordId);

    this.playSFX('sfx-door-open');
    this.showMessage(`Guard defeated! "${word?.translation || guardWordId}" — path unblocked!`);

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.add.circle(guard.x, guard.y, 3, 0xFF8844, 1);
      p.setDepth(12);
      this.tweens.add({
        targets: p,
        x: guard.x + Math.cos(angle) * 60,
        y: guard.y + Math.sin(angle) * 60,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    if (guard.guardLabel) guard.guardLabel.destroy();
    if (guard.shieldIcon) guard.shieldIcon.destroy();
    if (guard.blockZone) guard.blockZone.destroy();
    guard.destroy();

    this.activeGuards.delete(guard.enemyData?.id);
    if (guard.enemyData?.id) {
      this.defeatedGuards.add(guard.enemyData.id);
    }
    this.nearGuard = null;
    this.guardPrompt.setVisible(false);
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite { return this.player; }
  getHealth(): number { return this.health; }
  getGemsCollected(): number { return this.gemsCollected; }
  getCollectedLetters(): Array<{ letter: string; wordId: string }> { return this.collectedLetters; }
  getLevelWords(): any[] { return this.levelWords; }
}
