import Phaser from 'phaser';
import { BossData, BossSentence } from '../systems/LanguageManager';
import { TouchControls } from '../systems/TouchControls';
import { AudioManager } from '../systems/AudioManager';
import { TransitionManager } from '../systems/TransitionManager';

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
  private bossSpotlight!: Phaser.GameObjects.Graphics;
  private ambientParticles: any[] = [];
  private ambientTimer?: Phaser.Time.TimerEvent;

  private touchControls?: TouchControls;
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

    this.cameras.main.fadeIn(TransitionManager.FADE_DURATION);

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

    // Boss (128×128 base sprite, scale varies by world — higher = bigger)
    const bossSpriteKey = this.bossConfig.spriteKey
      ? `${this.bossConfig.spriteKey}-sheet`
      : 'enemy-placeholder';
    const bossSheetExists = this.textures.exists(bossSpriteKey);
    const finalSpriteKey = bossSheetExists ? bossSpriteKey : 'enemy-placeholder';
    const bossScale = this.getBossScale();
    this.boss = this.physics.add.sprite(width / 2, height / 2 - 30, finalSpriteKey);
    this.boss.setScale(bossScale);
    this.boss.setDepth(8);
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    bossBody.setSize(56, 56);
    bossBody.setOffset(36, 36);
    bossBody.setImmovable(true);
    bossBody.allowGravity = false;

    if (bossSheetExists) {
      this.createBossAnimations(bossSpriteKey);
      this.boss.play(`boss-idle-${this.bossConfig.spriteKey}`);
    }

    // Boss floating idle animation (more dramatic)
    this.tweens.add({
      targets: this.boss,
      y: this.boss.y - 20,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Subtle scale pulse
    this.tweens.add({
      targets: this.boss,
      scaleX: bossScale + 0.1,
      scaleY: bossScale + 0.1,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Boss-specific spotlight behind boss
    this.bossSpotlight = this.add.graphics();
    this.bossSpotlight.setScrollFactor(0);
    this.bossSpotlight.setDepth(4);
    const spotCX = width / 2;
    const spotCY = height / 2 - 30;
    const spotColorSet = this.getSpotlightColors();
    const spotRadii = [180, 150, 120, 90, 60, 30];
    for (let i = 0; i < spotColorSet.length; i++) {
      this.bossSpotlight.fillStyle(spotColorSet[i], 0.45 - i * 0.06);
      this.bossSpotlight.fillCircle(spotCX, spotCY, spotRadii[i]);
    }

    // Ambient particles around boss
    this.spawnAmbientParticles();

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
      this.events.off('wordSpelled');
      this.touchControls?.destroy();
      AudioManager.getInstance().stopMusic();
    });

    // Camera
    this.cameras.main.setBounds(0, 0, width, height);

    // Start boss arena music (escalating per world)
    AudioManager.getInstance().startBossMusic(this.getBossWorld());

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

    if (TouchControls.isTouchDevice(this)) {
      this.touchControls = new TouchControls(this);
    }
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

    // Sentence display (hidden until vulnerable, positioned high to not cover boss)
    this.sentenceText = this.add.text(width / 2, 100, '', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '24px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.sentenceText.setOrigin(0.5);
    this.sentenceText.setDepth(500);
    this.sentenceText.setScrollFactor(0);
    this.sentenceText.setVisible(false);

    this.sentenceTranslationText = this.add.text(width / 2, 135, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '15px',
      color: '#AAADDD',
      align: 'center',
    });
    this.sentenceTranslationText.setOrigin(0.5);
    this.sentenceTranslationText.setDepth(500);
    this.sentenceTranslationText.setScrollFactor(0);
    this.sentenceTranslationText.setVisible(false);

    // Interact prompt
    this.promptText = this.add.text(width / 2, 170, '', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
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

  private createBossAnimations(bossSpriteKey: string): void {
    const animKey = `boss-idle-${this.bossConfig.spriteKey}`;
    if (this.anims.exists(animKey)) return;

    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(bossSpriteKey, { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });
  }

  private getBossScale(): number {
    switch (this.bossConfig.id) {
      case 'jungle_boss': return 2.0;
      case 'village_boss': return 2.2;
      case 'palace_boss': return 2.4;
      default: return 2.0;
    }
  }

  private getSpotlightColors(): number[] {
    switch (this.bossConfig.id) {
      case 'jungle_boss':
        return [0x223300, 0x1a2200, 0x111100, 0x080800, 0x040200, 0x020100];
      case 'village_boss':
        return [0x441100, 0x331100, 0x220800, 0x110400, 0x080200, 0x040100];
      case 'palace_boss':
        return [0x330033, 0x220022, 0x110011, 0x080008, 0x040004, 0x020002];
      default:
        return [0x441100, 0x331100, 0x220800, 0x110400, 0x080200, 0x040100];
    }
  }

  private getCurrentSentence(): BossSentence {
    return this.bossConfig.sentences[this.currentSentenceIdx];
  }

  // ── State Machine ──

  private startAttackCycle(): void {
    if (this.state === BossState.DEFEATED) return;
    this.state = BossState.ATTACKING;
    this.clearTimers();
    this.touchControls?.hideInteractButton();

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
        AudioManager.getInstance().playBossSlam();
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
      ground_slam: 'Ground Slam! Jump!',
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
    this.touchControls?.showInteractButton();

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

    this.boss.setTint(0x997744);

    this.vulnerableTimer = this.time.delayedCall(6000, () => {
      if (this.state === BossState.VULNERABLE) {
        this.boss.clearTint();
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

    // Stop player movement so they don't walk into attacks when puzzle closes
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.touchControls?.reset();

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

    this.boss.clearTint();
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
    const bossX = this.boss.x;
    const bossY = this.boss.y;

    // Telegraph: boss flashes before firing
    this.boss.setTint(0xFF2200);
    this.time.delayedCall(300, () => {
      if (this.state !== BossState.DEFEATED && this.state !== BossState.VULNERABLE) {
        this.boss.clearTint();
      }
    });

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 600, () => {
        if (this.state === BossState.DEFEATED) return;

        AudioManager.getInstance().playBossAttack();

        const angle = Phaser.Math.Angle.Between(bossX, bossY, this.player.x, this.player.y);
        const spread = (i - 1) * 0.3;
        const travelAngle = angle + spread;

        // Muzzle flash at boss position
        const flash = this.add.circle(bossX, bossY + 20, 16, 0xFF4400, 0.9);
        flash.setDepth(12);
        this.tweens.add({
          targets: flash, scale: 2, alpha: 0, duration: 400,
          onComplete: () => flash.destroy(),
        });

        // Main bolt — elongated in travel direction, bright fiery red-orange
        const bolt = this.physics.add.sprite(bossX, bossY + 20, 'letter-placeholder');
        bolt.setDisplaySize(32, 12);
        bolt.setTint(0xFF6600);
        bolt.setAlpha(1);
        bolt.setDepth(7);
        bolt.setRotation(travelAngle);
        this.projectilesGroup.add(bolt);
        const boltBody = bolt.body as Phaser.Physics.Arcade.Body;
        boltBody.setSize(28, 12);

        boltBody.velocity.x = Math.cos(travelAngle) * speed;
        boltBody.velocity.y = Math.sin(travelAngle) * speed;

        // Glow behind bolt
        const glow = this.add.circle(bossX, bossY + 20, 10, 0xFF4400, 0.6);
        glow.setDepth(6);

        // Trail particles (fire sparks behind the bolt)
        const trailTimer = this.time.addEvent({
          delay: 60,
          repeat: 20,
          callback: () => {
            if (!bolt.active) { trailTimer.remove(); return; }
            const spark = this.add.circle(bolt.x, bolt.y, Phaser.Math.Between(2, 5), 0xFF8800, 0.7);
            spark.setDepth(5);
            this.tweens.add({
              targets: spark, alpha: 0, scale: 0.3, duration: 400,
              onComplete: () => spark.destroy(),
            });
          },
        });

        // Update glow + mild homing toward player each frame
        const glowUpdater = this.time.addEvent({
          delay: 16, repeat: 100,
          callback: () => {
            if (!bolt.active) { glowUpdater.remove(); glow.destroy(); return; }
            glow.x = bolt.x;
            glow.y = bolt.y;

            // Mild homing: curve toward player's current position
            const curAngle = Phaser.Math.Angle.Between(bolt.x, bolt.y, this.player.x, this.player.y);
            const curSpeed = Math.sqrt(boltBody.velocity.x ** 2 + boltBody.velocity.y ** 2);
            const newSpeed = curSpeed + 4; // Slightly accelerate
            const blendFactor = 0.03; // Gentle curve
            const velAngle = Math.atan2(boltBody.velocity.y, boltBody.velocity.x);
            const blendedAngle = velAngle + (curAngle - velAngle) * blendFactor;
            boltBody.velocity.x = Math.cos(blendedAngle) * newSpeed;
            boltBody.velocity.y = Math.sin(blendedAngle) * newSpeed;
            bolt.setRotation(blendedAngle);
          },
        });

        this.time.delayedCall(3500, () => {
          if (bolt.active) bolt.destroy();
          trailTimer.remove();
          glowUpdater.remove();
          glow.destroy();
        });
      });
    }
  }

  private groundSlamAttack(pattern: any): void {
    const spd = 450;
    const { width, height } = this.cameras.main;
    const floorY = height - 100;
    const originalY = this.boss.y;

    // Boss telegraph: shake, then SLAM DOWN to floor
    this.boss.setTint(0xFF4400);
    this.tweens.add({
      targets: this.boss, x: this.boss.x - 12, duration: 80,
      yoyo: true, repeat: 3,
    });

    // Boss slams down to floor level (250px drop in 300ms)
    this.time.delayedCall(500, () => {
      if (this.state !== BossState.ATTACKING) return;
      this.tweens.add({
        targets: this.boss,
        y: floorY - 30,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (this.state === BossState.DEFEATED) return;

          // IMPACT: vertical crack beam from boss to floor
          const beamY = (this.boss.y + floorY) / 2;
          const beam = this.add.rectangle(this.boss.x, beamY, 16, Math.abs(this.boss.y - floorY) + 20, 0xFF4400, 0.8);
          beam.setDepth(12);
          this.tweens.add({
            targets: beam, alpha: 0, scaleY: 1.5, duration: 600,
            onComplete: () => beam.destroy(),
          });

          // Impact explosion at floor
          const impact = this.add.circle(this.boss.x, floorY, 24, 0xFF4400, 0.9);
          impact.setDepth(13);
          this.tweens.add({
            targets: impact, scale: 3, alpha: 0, duration: 500,
            onComplete: () => impact.destroy(),
          });

          // Screen shake on impact
          this.cameras.main.shake(200, 0.015);

          // Rock particles burst upward from impact
          for (let j = 0; j < 12; j++) {
            const rock = this.add.circle(
              this.boss.x + Phaser.Math.Between(-30, 30),
              floorY - Phaser.Math.Between(0, 10),
              Phaser.Math.Between(3, 7),
              0xFF6600, 0.8
            );
            rock.setDepth(8);
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const dist = Phaser.Math.Between(60, 150);
            this.tweens.add({
              targets: rock,
              x: rock.x + Math.cos(angle) * dist,
              y: rock.y + Math.sin(angle) * dist,
              alpha: 0, scale: 0.5, duration: 800,
              onComplete: () => rock.destroy(),
            });
          }

          // Spawn TWO waves from impact point
          [-1, 1].forEach((dir) => {
            AudioManager.getInstance().playBossAttack();
            const wave = this.physics.add.sprite(this.boss.x, floorY, 'letter-placeholder');
            wave.setDisplaySize(80, 36);
            wave.setTint(0xFF2400);
            wave.setAlpha(0.95);
            wave.setDepth(7);
            wave.setFlipX(dir < 0);
            this.projectilesGroup.add(wave);
            const waveBody = wave.body as Phaser.Physics.Arcade.Body;
            waveBody.setSize(80, 36);
            waveBody.velocity.x = spd * dir;
            waveBody.allowGravity = false;

            const waveGlow = this.add.circle(this.boss.x, floorY, 30, 0xFF4400, 0.35);
            waveGlow.setDepth(6);

            const glowAndSparkTimer = this.time.addEvent({
              delay: 50, repeat: 60,
              callback: () => {
                if (!wave.active) { glowAndSparkTimer.remove(); waveGlow.destroy(); return; }
                waveGlow.x = wave.x;
                waveGlow.y = wave.y;
                waveGlow.setAlpha(0.2 + Math.sin(Date.now() * 0.015) * 0.2);
                const behindX = wave.x - (dir * Phaser.Math.Between(40, 70));
                const spark = this.add.circle(behindX, floorY + Phaser.Math.Between(-10, 10), Phaser.Math.Between(3, 7), 0xFF6600, 0.8);
                spark.setDepth(5);
                this.tweens.add({
                  targets: spark, alpha: 0, y: spark.y + 25, duration: 500,
                  onComplete: () => spark.destroy(),
                });
              },
            });

            this.time.delayedCall(4000, () => {
              if (wave.active) wave.destroy();
              glowAndSparkTimer.remove();
              waveGlow.destroy();
            });
          });
        },
      });

      // Boss rises back up
      this.time.delayedCall(800, () => {
        if (this.state === BossState.DEFEATED) return;
        this.tweens.add({
          targets: this.boss, y: originalY, duration: 500, ease: 'Back.easeOut',
          onComplete: () => {
            if (this.state !== BossState.VULNERABLE) this.boss.clearTint();
          },
        });
      });
    });
  }

  private spawnMinionsAttack(pattern: any): void {
    const duration = pattern.duration || 3000;
    const bossX = this.boss.x;
    const bossY = this.boss.y;

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.state === BossState.DEFEATED) return;

        AudioManager.getInstance().playBossMinion();

        // Spawn from boss position with slight spread
        const spawnX = bossX + Phaser.Math.Between(-30, 30);
        const spawnY = bossY + 20;

        // Spawn flash at boss
        const spawnFlash = this.add.circle(spawnX, spawnY, 20, 0xFF44FF, 0.8);
        spawnFlash.setDepth(12);
        this.tweens.add({
          targets: spawnFlash, scale: 2.5, alpha: 0, duration: 500,
          onComplete: () => spawnFlash.destroy(),
        });

        // Minion floats (no gravity), chases player
        const minion = this.physics.add.sprite(spawnX, spawnY, 'letter-placeholder');
        minion.setDisplaySize(22, 22);
        minion.setTint(0xFF44FF);
        minion.setAlpha(0.9);
        minion.setDepth(7);
        this.minionsGroup.add(minion);
        const mBody = minion.body as Phaser.Physics.Arcade.Body;
        mBody.setSize(16, 16);
        mBody.allowGravity = false;
        mBody.setImmovable(false);
        minion.setCollideWorldBounds(true);

        // Eject minions outward from boss toward player direction
        const toPlayer = Phaser.Math.Angle.Between(bossX, bossY, this.player.x, this.player.y);
        const ejectAngle = toPlayer + (i - 1) * 0.4;
        mBody.velocity.x = Math.cos(ejectAngle) * 200;
        mBody.velocity.y = Math.sin(ejectAngle) * 200;

        // Glow around minion (created AFTER velocity set so initial pos is correct)
        const minionGlow = this.add.circle(spawnX, spawnY, 14, 0xFF66FF, 0.35);
        minionGlow.setDepth(6);

        // Track how long this minion lives
        const startTime = this.time.now;
        let chasing = false;

        // Trail particles + glow update
        const minionTrail = this.time.addEvent({
          delay: 80,
          repeat: Math.floor(duration / 80),
          callback: () => {
            if (!minion.active) { minionTrail.remove(); minionGlow.destroy(); return; }

            minionGlow.x = minion.x;
            minionGlow.y = minion.y;
            minionGlow.setAlpha(0.15 + Math.sin(Date.now() * 0.02) * 0.15);

            // After 500ms spread, start homing toward player
            if (this.time.now - startTime > 500) {
              chasing = true;
              const angle = Phaser.Math.Angle.Between(minion.x, minion.y, this.player.x, this.player.y);
              mBody.velocity.x += Math.cos(angle) * 15;
              mBody.velocity.y += Math.sin(angle) * 15;
              // Clamp speed
              const spd = Math.sqrt(mBody.velocity.x ** 2 + mBody.velocity.y ** 2);
              if (spd > 250) {
                mBody.velocity.x = (mBody.velocity.x / spd) * 250;
                mBody.velocity.y = (mBody.velocity.y / spd) * 250;
              }
            }

            // Trail spark
            const trail = this.add.circle(minion.x, minion.y, Phaser.Math.Between(2, 5), 0xFF88FF, 0.5);
            trail.setDepth(5);
            this.tweens.add({
              targets: trail, alpha: 0, scale: 0.3, duration: 400,
              onComplete: () => trail.destroy(),
            });
          },
        });

        // Minion expires after duration
        this.time.delayedCall(duration, () => {
          // Burst particles on expire
          if (minion.active) {
            for (let j = 0; j < 8; j++) {
              const burst = this.add.circle(minion.x, minion.y, Phaser.Math.Between(3, 6), 0xFF66FF, 0.7);
              burst.setDepth(8);
              const ba = (j / 8) * Math.PI * 2;
              this.tweens.add({
                targets: burst,
                x: burst.x + Math.cos(ba) * 40,
                y: burst.y + Math.sin(ba) * 40,
                alpha: 0, scale: 0, duration: 500,
                onComplete: () => burst.destroy(),
              });
            }
          }
          if (minion.active) minion.destroy();
          minionTrail.remove();
          minionGlow.destroy();
        });
      });
    }
  }

  private cleanupAttack(): void {
    // Guard: groups might be destroyed if scene is shutting down
    if (!this.projectilesGroup || !this.minionsGroup) return;
    if (!this.projectilesGroup.getChildren || !this.minionsGroup.getChildren) return;

    // Fade out projectiles — keep full velocity so waves sweep arena edges
    this.projectilesGroup.getChildren().forEach((child) => {
      const p = child as Phaser.Physics.Arcade.Sprite;
      if (!p.active) return;
      this.tweens.add({
        targets: p, alpha: 0, duration: 800,
        onComplete: () => { if (p.active) p.destroy(); },
      });
    });

    // Minions fade and disperse upward
    this.minionsGroup.getChildren().forEach((child) => {
      const m = child as Phaser.Physics.Arcade.Sprite;
      if (!m.active) return;
      const mBody = m.body as Phaser.Physics.Arcade.Body;
      mBody.velocity.x = Phaser.Math.Between(-60, 60);
      mBody.velocity.y = -200;
      this.tweens.add({
        targets: m, alpha: 0, scale: 0.5, duration: 500,
        onComplete: () => { if (m.active) m.destroy(); },
      });
    });
  }

  // ── Combat ──

  private damageBoss(): void {
    this.bossHP--;
    this.updateHealthBar();
    AudioManager.getInstance().playBossHit();

    // Flash boss
    this.boss.setTint(0xFFFFFF);
    this.time.delayedCall(150, () => {
      if (this.state === BossState.VULNERABLE) this.boss.setTint(0x997744);
      else this.boss.clearTint();
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
    AudioManager.getInstance().playHurt();

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
    this.touchControls?.hideInteractButton();
    AudioManager.getInstance().stopMusic();
    AudioManager.getInstance().startVictoryMusic();

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

        const doContinue = () => {
          if (this.state !== BossState.DEFEATED) return;
          AudioManager.getInstance().stopMusic();
          this.onBossDefeated();
          this.scene.stop('BossScene');
        };

        continueBtn.on('pointerdown', doContinue);
        continueBtn.on('pointerover', () => continueBtn.setColor('#88FF88'));
        continueBtn.on('pointerout', () => continueBtn.setColor('#44FF44'));

        // Keyboard fallback: Enter or Space to continue
        const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        const spaceContinue = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        enterKey.once('down', doContinue);
        spaceContinue.once('down', doContinue);
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
      this.boss.clearTint();
      this.startAttackCycle();
      return;
    }

    this.handleMovement();

    // Ambient particles
    this.updateAmbientParticles(_delta);

    // Handle interact input
    if (this.state === BossState.VULNERABLE && this.interactCooldown <= 0) {
      const justPressedE = this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey);
      if (justPressedE || this.touchControls?.interactPressed) {
        if (this.touchControls) this.touchControls.interactPressed = false;
        this.interactCooldown = 3000;
        this.launchBossPuzzle();
      }
    }

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

    const left = this.cursors.left?.isDown || this.wasd.A.isDown || (this.touchControls?.movementForce.x ?? 0) < -0.3;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown || (this.touchControls?.movementForce.x ?? 0) > 0.3;

    if (left) {
      this.player.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    const jump = this.cursors.up?.isDown || this.wasd.W.isDown || this.spaceBar?.isDown || (this.touchControls?.jumpHeld ?? false);
    if (jump && onGround) {
      body.velocity.y = this.jumpForce;
    }
    if (!jump && body.velocity.y < -150) body.velocity.y *= 0.5;
  }

  private spawnAmbientParticles(): void {
    this.ambientParticles = [];
    const { width, height } = this.cameras.main;
    const worldIdx = this.bossConfig.id === 'jungle_boss' ? 0 :
      this.bossConfig.id === 'village_boss' ? 1 : 2;
    const counts = [10, 14, 18];
    const particleCount = counts[worldIdx];
    const colorSets = [
      [0x224400, 0x113300, 0x336611, 0x225522],
      [0x441100, 0x220800, 0x662200, 0x331100],
      [0x330033, 0x220022, 0x440044, 0x331133],
    ];
    const particleColors = colorSets[worldIdx];

    for (let i = 0; i < particleCount; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const dist = Phaser.Math.Between(80, 160);
      const p = this.add.circle(
        width / 2 + Math.cos(Phaser.Math.DegToRad(angle)) * dist,
        height / 2 - 30 + Math.sin(Phaser.Math.DegToRad(angle)) * dist,
        Phaser.Math.Between(2, 6),
        Phaser.Utils.Array.GetRandom(particleColors),
        Phaser.Math.FloatBetween(0.1, 0.4),
      );
      p.setDepth(5);
      p.setScrollFactor(0);
      (p as any)._orbitAngle = angle;
      (p as any)._orbitDist = dist;
      (p as any)._orbitSpeed = Phaser.Math.FloatBetween(0.2, 0.6);
      (p as any)._orbitPhase = Phaser.Math.FloatBetween(-0.5, 0.5);
      this.ambientParticles.push(p);
    }
  }

  private updateAmbientParticles(delta: number): void {
    if (this.state === BossState.DEFEATED) {
      this.ambientParticles.forEach(p => p.setAlpha(Math.max(0, p.alpha - delta * 0.002)));
      return;
    }
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2 - 30;
    const dt = delta * 0.001;

    for (const p of this.ambientParticles) {
      if (!p.active) continue;
      const pd = p as any;
      pd._orbitAngle += pd._orbitSpeed * dt;
      pd._orbitDist += Math.sin(pd._orbitPhase + pd._orbitAngle * 0.5) * dt * 10;

      const targetAlpha = this.state === BossState.VULNERABLE ? 0.5 : 0.2;
      p.x = cx + Math.cos(pd._orbitAngle) * pd._orbitDist;
      p.y = cy + Math.sin(pd._orbitAngle) * pd._orbitDist * 0.5;
      p.alpha += (targetAlpha - p.alpha) * dt * 2;
    }
  }

  private getBossWorld(): number {
    switch (this.bossConfig.id) {
      case 'jungle_boss': return 1;
      case 'village_boss': return 2;
      case 'palace_boss': return 3;
      default: return 1;
    }
  }

}
