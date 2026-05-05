import Phaser from 'phaser';
import { BossData, BossSentence } from '../systems/LanguageManager';

interface BossSceneData {
  bossConfig: BossData;
  resolvedWords: Record<string, { script: string; translation: string; splitLetters: string[] }>;
  onBossDefeated: () => void;
}

enum BossState {
  ATTACKING = 'attacking',
  VULNERABLE = 'vulnerable',
  SPELLING = 'spelling',
  DEFEATED = 'defeated',
}

export class BossScene extends Phaser.Scene {
  private bossConfig!: BossData;
  private resolvedWords: Record<string, { script: string; translation: string; splitLetters: string[] }> = {};
  private onBossDefeated!: () => void;

  private player!: Phaser.Physics.Arcade.Sprite;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private projectilesGroup!: Phaser.Physics.Arcade.Group;
  private minionsGroup!: Phaser.Physics.Arcade.Group;
  private floorBounds!: Phaser.GameObjects.Rectangle;

  private playerHP: number = 3;
  private bossHP: number = 3;
  private isPlayerInvincible: boolean = false;
  private currentSentenceIdx: number = 0;
  private sentencesCompleted: number = 0;

  private state: BossState = BossState.ATTACKING;
  private attackTimer?: Phaser.Time.TimerEvent;
  private vulnerableTimer?: Phaser.Time.TimerEvent;
  private stateGuard: boolean = false;

  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private playerHeartsText!: Phaser.GameObjects.Text;
  private sentenceText!: Phaser.GameObjects.Text;
  private sentenceTranslationText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;
  private touchInteract: boolean = false;
  private interactCooldown: number = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceBar!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;

  private playerSpeed: number = 280;
  private jumpForce: number = -460;

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: BossSceneData): void {
    this.bossConfig = data.bossConfig;
    this.resolvedWords = data.resolvedWords || {};
    this.onBossDefeated = data.onBossDefeated;
    this.playerHP = 3;
    this.bossHP = this.bossConfig.health;
    this.isPlayerInvincible = false;
    this.currentSentenceIdx = 0;
    this.sentencesCompleted = 0;
    this.state = BossState.ATTACKING;
    this.stateGuard = false;
    this.interactCooldown = 0;

    const { width, height } = this.cameras.main;

    // Dark arena background
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    // Arena floor
    this.add.rectangle(width / 2, height - 55, width, 10, 0x333344);
    this.add.rectangle(width / 2, height - 20, width, 60, 0x1a1a2e);

    // Physics floor
    const arenaFloor = this.add.rectangle(width / 2, height - 55, width, 10, 0x333344);
    this.physics.add.existing(arenaFloor, true);
    this.floorBounds = arenaFloor;

    // Player
    this.player = this.physics.add.sprite(200, height - 150, 'player-placeholder');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(32, 48);
    playerBody.setOffset(16, 16);

    this.physics.add.collider(this.player, arenaFloor);

    // Boss
    this.boss = this.physics.add.sprite(width / 2, height / 2 - 50, 'enemy-placeholder');
    this.boss.setScale(3);
    this.boss.setTint(0x440000);
    this.boss.setDepth(8);
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    bossBody.setSize(24, 24);
    bossBody.setOffset(4, 4);
    bossBody.setImmovable(true);
    bossBody.allowGravity = false;

    // Boss floating animation
    this.tweens.add({
      targets: this.boss,
      y: this.boss.y - 15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Groups
    this.projectilesGroup = this.physics.add.group({ allowGravity: false });
    this.minionsGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.minionsGroup, arenaFloor);

    // Projectile-player overlap
    this.physics.add.overlap(
      this.player, this.projectilesGroup,
      (_player, projectile) => {
        const p = projectile as Phaser.Physics.Arcade.Sprite;
        if (!p.active) return;
        this.damagePlayer();
        p.destroy();
      },
    );

    // Minion-player overlap
    this.physics.add.overlap(
      this.player, this.minionsGroup,
      (_player, minion) => {
        const m = minion as Phaser.Physics.Arcade.Sprite;
        if (!m.active) return;
        this.damagePlayer();
        m.destroy();
      },
    );

    // Input
    this.setupInput();

    // UI
    this.createUI();

    // Listen for wordSpelled from WordPuzzleScene
    this.events.on('wordSpelled', (data: { word: string; translation: string }) => {
      if (this.state !== BossState.SPELLING) return;
      this.handleSpellSuccess(data);
    });

    // Cleanup on scene shutdown
    this.events.on('shutdown', () => {
      this.clearTimers();
      this.cleanupAttack();
      this.events.off('wordSpelled');
    });

    // Camera
    this.cameras.main.setBounds(0, 0, width, height);

    // Start attack cycle
    this.startAttackCycle();
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.createTouchControls();
  }

  private createTouchControls(): void {
    const { width, height } = this.cameras.main;
    const btnStyle = { fontSize: '36px', color: '#FFFFFF' };

    const makeBtn = (x: number, label: string, onDown: () => void, onUp: () => void) => {
      const bg = this.add.rectangle(x, height - 80, 100, 100, 0x000000, 0.3);
      bg.setScrollFactor(0).setDepth(500).setInteractive();
      bg.on('pointerdown', onDown);
      bg.on('pointerup', onUp);
      bg.on('pointerout', onUp);
      const txt = this.add.text(x, height - 80, label, btnStyle);
      txt.setOrigin(0.5).setScrollFactor(0).setDepth(501);
    };

    makeBtn(80, '\u25C0', () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    makeBtn(200, '\u25B6', () => { this.touchRight = true; }, () => { this.touchRight = false; });
    makeBtn(width - 80, '\u25B2', () => { this.touchJump = true; }, () => { this.touchJump = false; });
    makeBtn(width - 200, '\uD83D\uDCAC', () => { this.touchInteract = true; }, () => { this.touchInteract = false; });
  }

  private createUI(): void {
    const { width } = this.cameras.main;

    // Boss health bar
    const barY = 40;
    const barW = 300;
    const barH = 22;
    const barX = width / 2 - barW / 2;

    this.healthBarBg = this.add.rectangle(width / 2, barY, barW, barH, 0x333333);
    this.healthBarBg.setStrokeStyle(2, 0x880000);
    this.healthBarBg.setDepth(500);
    this.healthBarBg.setScrollFactor(0);

    this.healthBarFill = this.add.rectangle(barX + barW / 2, barY, barW - 4, barH - 4, 0xff2222);
    this.healthBarFill.setDepth(501);
    this.healthBarFill.setScrollFactor(0);

    // Boss name
    this.bossNameText = this.add.text(width / 2, barY, this.bossConfig.nameEnglish, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '14px',
      color: '#ff6666',
    });
    this.bossNameText.setOrigin(0.5, 1.8);
    this.bossNameText.setDepth(500);
    this.bossNameText.setScrollFactor(0);

    // Player hearts
    this.playerHeartsText = this.add.text(10, 10, this.getHeartsString(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
    });
    this.playerHeartsText.setDepth(500);
    this.playerHeartsText.setScrollFactor(0);

    // Sentence display (hidden until vulnerable)
    this.sentenceText = this.add.text(width / 2, 180, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '26px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.sentenceText.setOrigin(0.5);
    this.sentenceText.setDepth(500);
    this.sentenceText.setScrollFactor(0);
    this.sentenceText.setVisible(false);

    this.sentenceTranslationText = this.add.text(width / 2, 215, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#AAADDD',
      align: 'center',
    });
    this.sentenceTranslationText.setOrigin(0.5);
    this.sentenceTranslationText.setDepth(500);
    this.sentenceTranslationText.setScrollFactor(0);
    this.sentenceTranslationText.setVisible(false);

    // Interact prompt
    this.promptText = this.add.text(width / 2, 260, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '20px',
      color: '#44FF44',
      backgroundColor: '#00000088',
      padding: { x: 14, y: 8 },
      stroke: '#00AA00',
      strokeThickness: 2,
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setDepth(500);
    this.promptText.setScrollFactor(0);
    this.promptText.setVisible(false);
  }

  private getHeartsString(): string {
    const filled = '\u2764\uFE0F';
    const empty = '\uD83D\uDC94';
    let str = '';
    for (let i = 0; i < 3; i++) {
      str += i < this.playerHP ? filled : empty;
    }
    return str;
  }

  private getCurrentSentence(): BossSentence {
    return this.bossConfig.sentences[this.currentSentenceIdx];
  }

  // ── State Machine ──

  private startAttackCycle(): void {
    if (this.state === BossState.DEFEATED) return;
    this.state = BossState.ATTACKING;
    this.clearTimers();

    const sentence = this.getCurrentSentence();
    const patterns = this.bossConfig.attackPatterns;
    const pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)];

    const attackDur = pattern.duration;
    // Show attack warning briefly
    this.showAttackWarning(pattern.name);

    switch (pattern.name) {
      case 'shadow_bolt':
        this.shadowBoltAttack(pattern);
        break;
      case 'ground_slam':
        this.groundSlamAttack(pattern);
        break;
      case 'spawn_minions':
        this.spawnMinionsAttack(pattern);
        break;
      default:
        this.shadowBoltAttack(pattern);
    }

    this.attackTimer = this.time.delayedCall(attackDur, () => {
      this.startVulnerablePhase();
    });
  }

  private showAttackWarning(patternName: string): void {
    const { width, height } = this.cameras.main;
    const names: Record<string, string> = {
      shadow_bolt: 'Shadow Bolts!',
      ground_slam: 'Ground Slam!',
      spawn_minions: 'Shadow Minions!',
    };
    const txt = this.add.text(width / 2, height / 2, names[patternName] || 'Attack!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '32px',
      color: '#FF4444',
      stroke: '#440000',
      strokeThickness: 4,
    });
    txt.setOrigin(0.5);
    txt.setDepth(500);
    txt.setScrollFactor(0);
    this.tweens.add({
      targets: txt,
      alpha: 0,
      y: txt.y - 60,
      duration: 1500,
      onComplete: () => txt.destroy(),
    });
  }

  private startVulnerablePhase(): void {
    if (this.state === BossState.DEFEATED) return;
    this.state = BossState.VULNERABLE;
    this.clearTimers();
    this.cleanupAttack();

    const sentence = this.getCurrentSentence();
    const requiredWords = sentence.requiredWords;
    const reqLabels = requiredWords.map((wid) => {
      const w = this.getWordData(wid);
      return w ? w.script : wid;
    }).join(' + ');

    this.sentenceText.setText(sentence.script);
    this.sentenceText.setVisible(true);
    this.sentenceTranslationText.setText(`"${sentence.translation}"\nSpell: ${reqLabels}`);
    this.sentenceTranslationText.setVisible(true);
    this.promptText.setText(`[E] Spell: ${reqLabels}`);
    this.promptText.setVisible(true);

    this.boss.setTint(0x664400);

    this.vulnerableTimer = this.time.delayedCall(6000, () => {
      if (this.state === BossState.VULNERABLE) {
        this.boss.setTint(0x440000);
        this.hideSpellUI();
        this.startAttackCycle();
      }
    });
  }

  private launchBossPuzzle(): void {
    if (this.state !== BossState.VULNERABLE) return;
    if (this.stateGuard) return;
    this.stateGuard = true;

    this.state = BossState.SPELLING;
    this.clearTimers();

    const sentence = this.getCurrentSentence();
    const requiredWords = sentence.requiredWords;

    // Collect splitLetters for all required words
    const allLetters: string[] = [];
    const targetScript: string[] = [];
    for (const wid of requiredWords) {
      const wordData = this.getWordData(wid);
      if (wordData) {
        allLetters.push(...wordData.splitLetters);
        targetScript.push(wordData.script);
      }
    }

    if (allLetters.length === 0) {
      // Fallback: no word data found, treat as auto-success
      this.stateGuard = false;
      this.handleSpellSuccess({ word: requiredWords.join('+'), translation: sentence.translation });
      return;
    }

    const targetWord = targetScript.join(' ');
    const translation = requiredWords
      .map((wid) => { const w = this.getWordData(wid); return w ? w.translation : wid; })
      .join(' + ');

    // Shuffle letters for the puzzle
    const shuffled = Phaser.Utils.Array.Shuffle([...allLetters]);

    this.scene.pause('BossScene');
    this.scene.launch('WordPuzzleScene', {
      word: targetWord,
      translation,
      letters: shuffled,
      correctOrder: allLetters,
      caller: 'BossScene',
    });
  }

  private handleSpellSuccess(data: { word: string; translation: string }): void {
    if (this.state === BossState.DEFEATED) return;
    this.stateGuard = false;

    this.boss.setTint(0x440000);
    this.hideSpellUI();
    this.damageBoss();
  }

  private hideSpellUI(): void {
    this.sentenceText.setVisible(false);
    this.sentenceTranslationText.setVisible(false);
    this.promptText.setVisible(false);
  }

  // ── Attack Patterns ──

  private shadowBoltAttack(pattern: any): void {
    const speed = pattern.speed || 300;
    const { width, height } = this.cameras.main;
    const bossX = this.boss.x;
    const bossY = this.boss.y;

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 600, () => {
        if (this.state === BossState.DEFEATED) return;

        const bolt = this.physics.add.sprite(bossX, bossY + 20, 'letter-placeholder');
        bolt.setDisplaySize(18, 18);
        bolt.setTint(0x000000);
        bolt.setDepth(7);
        this.projectilesGroup.add(bolt);
        const boltBody = bolt.body as Phaser.Physics.Arcade.Body;
        boltBody.setSize(14, 14);

        const angle = Phaser.Math.Angle.Between(bossX, bossY, this.player.x, this.player.y);
        const spread = (i - 1) * 0.3;
        boltBody.velocity.x = Math.cos(angle + spread) * speed;
        boltBody.velocity.y = Math.sin(angle + spread) * speed;

        this.time.delayedCall(3000, () => { if (bolt.active) bolt.destroy(); });
      });
    }
  }

  private groundSlamAttack(pattern: any): void {
    const spd = pattern.speed || 150;
    const { height } = this.cameras.main;

    this.time.delayedCall(400, () => {
      if (this.state === BossState.DEFEATED) return;

      const wave = this.physics.add.sprite(50, height - 100, 'letter-placeholder');
      wave.setDisplaySize(60, 30);
      wave.setTint(0xFF2200);
      wave.setAlpha(0.7);
      wave.setDepth(7);
      this.projectilesGroup.add(wave);
      const waveBody = wave.body as Phaser.Physics.Arcade.Body;
      waveBody.setSize(60, 30);
      waveBody.velocity.x = spd;
      waveBody.allowGravity = false;

      this.time.delayedCall(5000, () => { if (wave.active) wave.destroy(); });
    });
  }

  private spawnMinionsAttack(pattern: any): void {
    const duration = pattern.duration || 3000;
    const { width, height } = this.cameras.main;

    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 50 : width - 50;
      const minion = this.physics.add.sprite(side, height - 120, 'letter-placeholder');
      minion.setDisplaySize(20, 20);
      minion.setTint(0x880088);
      minion.setDepth(7);
      this.minionsGroup.add(minion);
      const mBody = minion.body as Phaser.Physics.Arcade.Body;
      mBody.setSize(16, 16);
      mBody.allowGravity = true;
      minion.setCollideWorldBounds(true);

      this.time.delayedCall(duration, () => { if (minion.active) minion.destroy(); });
    }
  }

  private cleanupAttack(): void {
    this.projectilesGroup.clear(true, true);
    this.minionsGroup.clear(true, true);
  }

  // ── Combat ──

  private damageBoss(): void {
    this.bossHP--;
    this.updateHealthBar();

    // Flash boss
    this.boss.setTint(0xFFFFFF);
    this.time.delayedCall(150, () => {
      if (this.state === BossState.VULNERABLE) this.boss.setTint(0x664400);
      else this.boss.setTint(0x440000);
    });

    // Screen shake
    this.cameras.main.shake(200, 0.01);

    // Damage text
    const { width, height } = this.cameras.main;
    const dmgText = this.add.text(this.boss.x, this.boss.y - 60, '-1', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 3,
    });
    dmgText.setOrigin(0.5);
    dmgText.setDepth(500);
    dmgText.setScrollFactor(0);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => dmgText.destroy(),
    });

    if (this.bossHP <= 0) {
      this.defeatBoss();
      return;
    }

    // Move to next sentence
    this.sentencesCompleted++;
    this.currentSentenceIdx = (this.currentSentenceIdx + 1) % this.bossConfig.sentences.length;

    if (this.state === BossState.SPELLING) {
      // Coming back from puzzle success, go to attack cycle
      this.startAttackCycle();
    }
  }

  private damagePlayer(): void {
    if (this.isPlayerInvincible || this.state === BossState.DEFEATED) return;
    this.isPlayerInvincible = true;

    this.playerHP--;
    this.playerHeartsText.setText(this.getHeartsString());

    // Knockback
    const kbDir = this.player.x < this.boss.x ? -300 : 300;
    this.player.setVelocityX(kbDir);
    this.player.setVelocityY(-200);

    // Flash player red
    this.player.setTint(0xFF0000);
    this.cameras.main.shake(150, 0.008);

    if (this.playerHP <= 0) {
      this.playerDeath();
      return;
    }

    this.time.delayedCall(1000, () => {
      if (this.state === BossState.DEFEATED) return;
      this.isPlayerInvincible = false;
      this.player.clearTint();
    });
  }

  private playerDeath(): void {
    this.cleanupAttack();
    this.clearTimers();
    this.hideSpellUI();
    this.state = BossState.ATTACKING;
    this.stateGuard = false;

    const { width, height } = this.cameras.main;
    const deathText = this.add.text(width / 2, height / 2, 'Arena Reset...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '30px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 3,
    });
    deathText.setOrigin(0.5);
    deathText.setDepth(500);
    deathText.setScrollFactor(0);

    this.cameras.main.flash(500, 255, 0, 0);

    this.time.delayedCall(2000, () => {
      deathText.destroy();
      this.respawnPlayer();
    });
  }

  private respawnPlayer(): void {
    this.playerHP = 3;
    this.isPlayerInvincible = false;
    this.currentSentenceIdx = 0;
    this.sentencesCompleted = 0;
    this.bossHP = this.bossConfig.health;
    this.state = BossState.ATTACKING;
    this.stateGuard = false;

    this.player.setPosition(200, this.cameras.main.height - 150);
    this.player.setVelocity(0, 0);
    this.player.clearTint();
    this.playerHeartsText.setText(this.getHeartsString());
    this.updateHealthBar();

    this.cleanupAttack();
    this.hideSpellUI();

    this.time.delayedCall(500, () => {
      this.startAttackCycle();
    });
  }

  private defeatBoss(): void {
    this.state = BossState.DEFEATED;
    this.clearTimers();
    this.cleanupAttack();
    this.hideSpellUI();

    // Boss death animation
    this.boss.setTint(0xFFFFFF);
    this.tweens.add({
      targets: this.boss,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: 720,
      duration: 1500,
      ease: 'Power2',
    });

    // Victory particles
    for (let i = 0; i < 40; i++) {
      const { width, height } = this.cameras.main;
      const px = this.boss.x + Phaser.Math.Between(-80, 80);
      const py = this.boss.y + Phaser.Math.Between(-80, 80);
      const colors = [0xFFD700, 0xFF6600, 0xFF4444, 0x44FF44, 0x4488FF, 0xFF44FF];
      const p = this.add.circle(px, py, Phaser.Math.Between(4, 12), Phaser.Utils.Array.GetRandom(colors), 0.9);
      p.setDepth(500);
      p.setScrollFactor(0);
      this.tweens.add({
        targets: p,
        x: px + Phaser.Math.Between(-200, 200),
        y: py + Phaser.Math.Between(-200, 200),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(800, 2000),
        delay: Phaser.Math.Between(0, 500),
        onComplete: () => p.destroy(),
      });
    }

    this.cameras.main.flash(500, 255, 215, 0);

    // Victory text
    const { width, height } = this.cameras.main;
    this.time.delayedCall(800, () => {
      const victoryText = this.add.text(width / 2, height / 2, 'VICTORY!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: 6,
      });
      victoryText.setOrigin(0.5);
      victoryText.setDepth(500);
      victoryText.setScrollFactor(0);

      this.tweens.add({
        targets: victoryText,
        scale: { from: 0, to: 1 },
        duration: 600,
        ease: 'Back.easeOut',
      });

      // Continue button
      this.time.delayedCall(2000, () => {
        const continueBtn = this.add.text(width / 2, height / 2 + 70, 'Continue \u2192', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '26px',
          color: '#44FF44',
          backgroundColor: '#00000088',
          padding: { x: 20, y: 10 },
          stroke: '#00AA00',
          strokeThickness: 2,
        });
        continueBtn.setOrigin(0.5);
        continueBtn.setDepth(500);
        continueBtn.setScrollFactor(0);
        continueBtn.setInteractive({ useHandCursor: true });

        continueBtn.on('pointerdown', () => {
          this.onBossDefeated();
          this.scene.stop('BossScene');
        });
        continueBtn.on('pointerover', () => continueBtn.setColor('#88FF88'));
        continueBtn.on('pointerout', () => continueBtn.setColor('#44FF44'));
      });
    });
  }

  private updateHealthBar(): void {
    const barW = 300;
    const barH = 22;
    const maxHP = this.bossConfig.health;
    const pct = Math.max(0, this.bossHP / maxHP);
    const fillW = (barW - 4) * pct;
    this.healthBarFill.setSize(fillW, barH - 4);
    // Color: green → yellow → red
    let color: number;
    if (pct > 0.6) color = 0x44FF44;
    else if (pct > 0.3) color = 0xFFCC00;
    else color = 0xFF2222;
    this.healthBarFill.setFillStyle(color);
  }

  private clearTimers(): void {
    if (this.attackTimer) { this.attackTimer.remove(); this.attackTimer = undefined; }
    if (this.vulnerableTimer) { this.vulnerableTimer.remove(); this.vulnerableTimer = undefined; }
  }

  // ── Helpers ──

  private getWordData(wordId: string): { script: string; translation: string; splitLetters: string[] } | null {
    return this.resolvedWords[wordId] || null;
  }

  // ── Update Loop ──

  update(_time: number, _delta: number): void {
    if (this.state === BossState.DEFEATED) return;
    if (!this.player || !this.player.body) return;

    // Cooldown track
    if (this.interactCooldown > 0) this.interactCooldown -= _delta;

    // Detect puzzle closed without solving
    if (this.state === BossState.SPELLING && !this.scene.isActive('WordPuzzleScene')) {
      this.stateGuard = false;
      this.state = BossState.ATTACKING;
      this.hideSpellUI();
      this.boss.setTint(0x440000);
      this.startAttackCycle();
      return;
    }

    this.handleMovement();

    // Handle interact input
    if (this.state === BossState.VULNERABLE && this.interactCooldown <= 0) {
      const justPressedE = this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey);
      if (justPressedE || this.touchInteract) {
        this.touchInteract = false;
        this.interactCooldown = 3000;
        this.launchBossPuzzle();
      }
    }

    // Track minions toward player
    this.minionsGroup.getChildren().forEach((child) => {
      const m = child as Phaser.Physics.Arcade.Sprite;
      if (!m.active) return;
      const mBody = m.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(m.x, m.y, this.player.x, this.player.y);
      mBody.velocity.x = Math.cos(angle) * 80;
      mBody.velocity.y = Math.sin(angle) * 80;
    });

    // Blink player when invincible
    if (this.isPlayerInvincible) {
      this.player.setAlpha(Math.sin(_time * 0.02) > 0 ? 1 : 0.3);
    } else {
      this.player.setAlpha(1);
    }
  }

  private handleMovement(): void {
    if (this.state === BossState.DEFEATED || this.state === BossState.SPELLING) {
      this.player.setVelocityX(0);
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.cursors.left?.isDown || this.wasd.A.isDown || this.touchLeft;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown || this.touchRight;

    if (left) {
      this.player.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    const jump = this.cursors.up?.isDown || this.wasd.W.isDown || this.spaceBar?.isDown || this.touchJump;
    if (jump && onGround) {
      body.velocity.y = this.jumpForce;
    }
    if (!jump && body.velocity.y < -150) body.velocity.y *= 0.5;
  }

}
