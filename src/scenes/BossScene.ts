import Phaser from 'phaser';

interface BossConfig {
  name: string;
  nameEnglish: string;
  spriteKey: string;
  health: number;
  sentences: Array<{
    script: string;
    translation: string;
    requiredWords: string[];
    timeLimit: number;
  }>;
}

export class BossScene extends Phaser.Scene {
  private boss!: Phaser.Physics.Arcade.Sprite;
  private bossHealth: number = 3;
  private bossMaxHealth: number = 3;
  private player!: Phaser.Physics.Arcade.Sprite;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private healthBar!: Phaser.GameObjects.Graphics;
  private currentSentenceIndex: number = 0;
  private isVulnerable: boolean = false;
  private bossConfig!: BossConfig;
  private onBossDefeatedCallback?: () => void;

  // Player movement in arena
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: { bossConfig: BossConfig; collectedWords: string[]; onBossDefeated?: () => void }): void {
    const { width, height } = this.cameras.main;

    this.bossConfig = data.bossConfig;
    this.onBossDefeatedCallback = data.onBossDefeated;
    this.bossHealth = data.bossConfig.health;
    this.bossMaxHealth = data.bossConfig.health;

    this.cameras.main.fadeIn(500);

    // Arena background — dramatic gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Ground
    const ground = this.add.rectangle(width / 2, height - 30, width, 60, 0x1a1a33);
    this.physics.add.existing(ground, true);

    // Boss introduction
    const bossName = this.add.text(width / 2, height * 0.15, data.bossConfig.name, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '42px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 4,
    });
    bossName.setOrigin(0.5);
    bossName.setAlpha(0);

    this.tweens.add({
      targets: bossName,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
    });

    const bossSub = this.add.text(width / 2, height * 0.22, data.bossConfig.nameEnglish, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '20px',
      color: '#AA6666',
    });
    bossSub.setOrigin(0.5);

    // Boss entity (placeholder)
    this.boss = this.physics.add.sprite(width * 0.75, height * 0.45, 'enemy-placeholder');
    this.boss.setScale(3);
    this.boss.setAlpha(0);
    this.boss.setImmovable(true);

    this.tweens.add({
      targets: this.boss,
      alpha: 1,
      y: height * 0.5,
      duration: 1000,
      delay: 500,
      ease: 'Bounce.easeOut',
    });

    // Continuous floating animation
    this.tweens.add({
      targets: this.boss,
      y: height * 0.5 + 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1500,
    });

    // Boss health bar
    this.createHealthBar();

    // Player in arena
    this.player = this.physics.add.sprite(150, height - 80, 'player-placeholder');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, ground);

    // Projectiles group
    this.projectiles = this.physics.add.group();

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    };

    // Instructions
    const instruction = this.add.text(width / 2, height - 80, 'Dodge attacks! Spell sentences to damage the boss!', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    instruction.setOrigin(0.5);

    // Start boss attack cycle after intro
    this.time.delayedCall(3000, () => {
      this.startBossFight();
    });
  }

  private createHealthBar(): void {
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(500);
    this.healthBar.setScrollFactor(0);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const { width } = this.cameras.main;
    const barWidth = 300;
    const barHeight = 20;
    const x = width / 2 - barWidth / 2;
    const y = 15;

    this.healthBar.clear();

    // Background
    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRoundedRect(x, y, barWidth, barHeight, 6);

    // Health fill
    const healthRatio = this.bossHealth / this.bossMaxHealth;
    const healthColor = healthRatio > 0.5 ? 0xFF4444 : healthRatio > 0.25 ? 0xFFAA00 : 0xFF0000;
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRoundedRect(x, y, barWidth * healthRatio, barHeight, 6);

    // Border
    this.healthBar.lineStyle(2, 0xFFFFFF, 0.5);
    this.healthBar.strokeRoundedRect(x, y, barWidth, barHeight, 6);

    // Label
    this.healthBar.fillStyle(0xFFFFFF, 1);
    // The depth ensures text is drawn on top
  }

  private startBossFight(): void {
    this.attackCycle();
  }

  private attackCycle(): void {
    if (this.bossHealth <= 0) return;

    const attackType = Phaser.Math.Between(0, 2);

    switch (attackType) {
      case 0:
        this.shadowBoltAttack();
        break;
      case 1:
        this.groundWaveAttack();
        break;
      case 2:
        this.spawnMinions();
        break;
    }

    // Vulnerable period after attack — player can spell to deal damage
    this.time.delayedCall(1500, () => {
      this.isVulnerable = true;
      this.showSpellPrompt();
    });
  }

  private shadowBoltAttack(): void {
    // Boss shoots 3 shadow bolts at the player
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 500, () => {
        const bolt = this.add.circle(this.boss.x, this.boss.y, 10, 0xFF4444, 1);
        this.physics.add.existing(bolt);
        this.projectiles.add(bolt);

        const angle = Phaser.Math.Angle.Between(
          this.boss.x, this.boss.y, this.player.x, this.player.y
        );
        const speed = 300 + i * 50;
        bolt.body!.velocity.x = Math.cos(angle) * speed;
        bolt.body!.velocity.y = Math.sin(angle) * speed;

        // Destroy after 3 seconds
        this.time.delayedCall(3000, () => {
          if (bolt.active) bolt.destroy();
        });
      });
    }
  }

  private groundWaveAttack(): void {
    // Ground wave travels across the arena — player must jump
    const wave = this.add.rectangle(0, this.cameras.main.height - 40, 30, 20, 0xFF6600, 0.8);
    this.physics.add.existing(wave);
    this.projectiles.add(wave);

    this.tweens.add({
      targets: wave,
      x: this.cameras.main.width,
      duration: 2000,
      onUpdate: () => {
        if (wave.body && this.physics.overlap(wave, this.player)) {
          // Player hit by ground wave
          this.cameras.main.shake(200, 0.01);
        }
      },
      onComplete: () => wave.destroy(),
    });
  }

  private spawnMinions(): void {
    // Spawn 2 small shadow minions
    for (let i = 0; i < 2; i++) {
      const minion = this.add.circle(
        Phaser.Math.Between(100, 300),
        this.cameras.main.height - 50,
        12, 0x8833AA, 1
      );
      this.physics.add.existing(minion);
      this.projectiles.add(minion);

      // Bob towards player
      this.tweens.add({
        targets: minion,
        x: this.player.x + Phaser.Math.Between(-50, 50),
        duration: 2000,
        onComplete: () => {
          if (minion.active) minion.destroy();
        },
      });
    }
  }

  private showSpellPrompt(): void {
    if (this.currentSentenceIndex >= this.bossConfig.sentences.length) {
      this.currentSentenceIndex = 0;
    }

    const sentence = this.bossConfig.sentences[this.currentSentenceIndex];

    // Show the sentence to spell
    const prompt = this.add.text(
      this.cameras.main.width / 2,
      60,
      `Spell: "${sentence.translation}"`,
      {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#00000088',
        padding: { x: 15, y: 8 },
      }
    );
    prompt.setOrigin(0.5);
    prompt.setScrollFactor(0);
    prompt.setDepth(500);

    // Auto-vanish after 5 seconds
    this.time.delayedCall(5000, () => {
      if (prompt.active) prompt.destroy();
      this.isVulnerable = false;
      this.time.delayedCall(1000, () => this.attackCycle());
    });

    // Simulate a successful spell cast for the placeholder
    // In the real game, this would launch WordPuzzleScene
    this.time.delayedCall(2000, () => {
      if (this.isVulnerable && this.bossHealth > 0) {
        this.dealDamage(sentence.script);
        prompt.destroy();
      }
    });
  }

  private dealDamage(sentence: string): void {
    this.bossHealth--;
    this.updateHealthBar();

    // Boss hurt flash
    this.boss.setTint(0xFF0000);
    this.time.delayedCall(200, () => this.boss.clearTint());

    // Damage text
    const dmgText = this.add.text(this.boss.x, this.boss.y - 30, `"${sentence}" ✓`, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFD700',
    });
    dmgText.setOrigin(0.5);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => dmgText.destroy(),
    });

    this.cameras.main.shake(400, 0.01);

    if (this.bossHealth <= 0) {
      this.time.delayedCall(1000, () => this.bossDefeated());
    } else {
      this.isVulnerable = false;
      this.currentSentenceIndex++;
      this.time.delayedCall(1500, () => this.attackCycle());
    }
  }

  private bossDefeated(): void {
    const { width, height } = this.cameras.main;

    // Boss defeat animation
    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      angle: 360,
      duration: 2000,
      ease: 'Quad.easeIn',
    });

    // Victory text
    const victoryText = this.add.text(width / 2, height / 2, '🎉 विजय! 🎉\nVictory!', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '42px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 4,
      align: 'center',
    });
    victoryText.setOrigin(0.5);
    victoryText.setAlpha(0);
    victoryText.setDepth(500);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 500,
    });

    // Celebration particles
    for (let i = 0; i < 40; i++) {
      this.time.delayedCall(i * 30, () => {
        const x = Phaser.Math.Between(100, width - 100);
        const y = Phaser.Math.Between(100, height - 100);
        const colors = [0xFFD700, 0xFF6B6B, 0x66FF66, 0x6699FF];
        const particle = this.add.circle(x, y, 3, colors[i % 4], 1);
        particle.setDepth(501);

        this.tweens.add({
          targets: particle,
          y: y - Phaser.Math.Between(50, 200),
          alpha: 0,
          duration: Phaser.Math.Between(800, 2000),
          onComplete: () => particle.destroy(),
        });
      });
    }

    // Return button
    this.time.delayedCall(3000, () => {
      const continueBtn = this.add.text(width / 2, height - 60, 'Continue →', {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '24px',
        color: '#FFD700',
        backgroundColor: '#00000088',
        padding: { x: 20, y: 10 },
      });
      continueBtn.setOrigin(0.5);
      continueBtn.setDepth(500);
      continueBtn.setInteractive({ useHandCursor: true });

      continueBtn.on('pointerdown', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('BossScene');
          if (this.onBossDefeatedCallback) {
            this.onBossDefeatedCallback();
          } else {
            this.scene.start('LevelSelectScene');
          }
        });
      });
    });
  }

  update(): void {
    if (!this.player || !this.player.body) return;

    // Player movement in arena
    const speed = 220;
    if (this.cursors.left?.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    if ((this.cursors.up?.isDown || this.wasd.W.isDown) && onGround) {
      this.player.setVelocityY(-400);
    }
  }
}
