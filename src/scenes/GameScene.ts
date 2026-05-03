import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceBar!: Phaser.Input.Keyboard.Key;

  // Touch controls
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchJump: boolean = false;

  // Player state
  private playerSpeed: number = 250;
  private jumpForce: number = -450;
  private canJump: boolean = true;
  private health: number = 3;

  // Parallax layers (placeholders)
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { worldId: string; levelId: string; language: string }): void {
    const { width, height } = this.cameras.main;

    this.cameras.main.fadeIn(500);

    // Create parallax background layers
    this.createParallaxBackground();

    // Create platforms group
    this.platforms = this.physics.add.staticGroup();

    // Create ground platform
    const ground = this.add.rectangle(width / 2, height - 40, width * 2, 80, 0x2D5A27);
    this.physics.add.existing(ground, true);
    (ground.body as Phaser.Physics.Arcade.StaticBody).checkCollision.down = false;
    (ground.body as Phaser.Physics.Arcade.StaticBody).checkCollision.left = false;
    (ground.body as Phaser.Physics.Arcade.StaticBody).checkCollision.right = false;
    this.platforms.add(ground);

    // Create floating platforms
    this.createFloatingPlatform(300, 500, 200, 20);
    this.createFloatingPlatform(600, 400, 200, 20);
    this.createFloatingPlatform(900, 320, 250, 20);
    this.createFloatingPlatform(400, 250, 180, 20);
    this.createFloatingPlatform(700, 180, 150, 20);
    this.createFloatingPlatform(1000, 500, 200, 20);

    // Create player
    this.player = this.physics.add.sprite(100, height - 150, 'player-placeholder');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Player physics body adjustments
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(32, 48);
    playerBody.setOffset(16, 16);

    // Camera setup
    this.cameras.main.setBounds(0, 0, 1600, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(50, 50);

    // Collision
    this.physics.add.collider(this.player, this.platforms);

    // Input setup
    this.setupInput();

    // Launch UI scene as overlay
    this.scene.launch('UIScene', { gameScene: this });

    // Collectible letters placeholder (will be replaced by Akshar entities)
    this.createPlaceholderLetters();
  }

  update(): void {
    if (!this.player || !this.player.body) return;

    this.handleMovement();
  }

  private createParallaxBackground(): void {
    const { width, height } = this.cameras.main;

    // Create layered gradient backgrounds (until real art is generated)
    const colors = [
      { color: 0x0D1B2A, scrollFactor: 0 },    // Deep sky
      { color: 0x1B2838, scrollFactor: 0.05 },  // Far clouds
      { color: 0x2C3E50, scrollFactor: 0.1 },   // Mountains
      { color: 0x1A472A, scrollFactor: 0.2 },   // Far trees
      { color: 0x1E5631, scrollFactor: 0.4 },   // Mid trees
      { color: 0x2D5A27, scrollFactor: 0.7 },   // Near foliage
    ];

    colors.forEach((layer) => {
      const bg = this.add.rectangle(0, 0, width * 2, height, layer.color);
      bg.setOrigin(0, 0);
      bg.setScrollFactor(layer.scrollFactor);
      bg.setDepth(-10 + layer.scrollFactor * 10);
    });

    // Add some decorative elements for depth
    // Far mountains silhouette
    const mountains = this.add.graphics();
    mountains.fillStyle(0x1B3A2A, 1);
    mountains.setScrollFactor(0.15);
    mountains.setDepth(-8);
    const peakY = height * 0.6;
    for (let x = 0; x < width * 3; x += 100) {
      const h = Math.sin(x * 0.01) * 80 + Math.cos(x * 0.03) * 40;
      mountains.fillTriangle(x, peakY, x + 50, peakY - h - 20, x + 100, peakY);
    }

    // Sun/moon glow
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

    // Grass top decoration
    const grassTop = this.add.rectangle(x, y - height / 2 - 3, width, 6, 0x228B22);

    this.physics.add.existing(platform, true);
    this.platforms.add(platform);

    // Add some grass detail dots
    for (let i = 0; i < width / 20; i++) {
      const dotX = x - width / 2 + 10 + i * 20;
      const dot = this.add.circle(dotX, y - height / 2 - 5, 2, 0x32CD32, 0.7);
    }
  }

  private setupInput(): void {
    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch controls — virtual buttons on screen
    this.createTouchControls();
  }

  private createTouchControls(): void {
    const { width, height } = this.cameras.main;

    // Left movement button
    const leftBtn = this.add.rectangle(80, height - 80, 100, 100, 0x000000, 0.3);
    leftBtn.setScrollFactor(0);
    leftBtn.setDepth(100);
    leftBtn.setInteractive();
    leftBtn.on('pointerdown', () => { this.touchLeft = true; });
    leftBtn.on('pointerup', () => { this.touchLeft = false; });
    leftBtn.on('pointerout', () => { this.touchLeft = false; });

    const leftArrow = this.add.text(80, height - 80, '◀', {
      fontSize: '36px',
      color: '#FFFFFF',
    });
    leftArrow.setOrigin(0.5);
    leftArrow.setScrollFactor(0);
    leftArrow.setDepth(101);

    // Right movement button
    const rightBtn = this.add.rectangle(200, height - 80, 100, 100, 0x000000, 0.3);
    rightBtn.setScrollFactor(0);
    rightBtn.setDepth(100);
    rightBtn.setInteractive();
    rightBtn.on('pointerdown', () => { this.touchRight = true; });
    rightBtn.on('pointerup', () => { this.touchRight = false; });
    rightBtn.on('pointerout', () => { this.touchRight = false; });

    const rightArrow = this.add.text(200, height - 80, '▶', {
      fontSize: '36px',
      color: '#FFFFFF',
    });
    rightArrow.setOrigin(0.5);
    rightArrow.setScrollFactor(0);
    rightArrow.setDepth(101);

    // Jump button
    const jumpBtn = this.add.rectangle(width - 80, height - 80, 100, 100, 0x000000, 0.3);
    jumpBtn.setScrollFactor(0);
    jumpBtn.setDepth(100);
    jumpBtn.setInteractive();
    jumpBtn.on('pointerdown', () => { this.touchJump = true; });
    jumpBtn.on('pointerup', () => { this.touchJump = false; });
    jumpBtn.on('pointerout', () => { this.touchJump = false; });

    const jumpArrow = this.add.text(width - 80, height - 80, '▲', {
      fontSize: '36px',
      color: '#FFFFFF',
    });
    jumpArrow.setOrigin(0.5);
    jumpArrow.setScrollFactor(0);
    jumpArrow.setDepth(101);
  }

  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Reset jump when on ground
    if (onGround) {
      this.canJump = true;
    }

    // Horizontal movement
    const leftPressed = this.cursors.left?.isDown || this.wasd.A.isDown || this.touchLeft;
    const rightPressed = this.cursors.right?.isDown || this.wasd.D.isDown || this.touchRight;

    if (leftPressed) {
      this.player.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true);
    } else if (rightPressed) {
      this.player.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    const jumpPressed = this.cursors.up?.isDown || this.wasd.W.isDown || this.spaceBar.isDown || this.touchJump;
    if (jumpPressed && onGround && this.canJump) {
      this.player.setVelocityY(this.jumpForce);
      this.canJump = false;
    }

    // Variable jump height (release jump early = shorter jump)
    if (!jumpPressed && body.velocity.y < -150) {
      body.velocity.y *= 0.6;
    }
  }

  private createPlaceholderLetters(): void {
    // Create some floating collectible letters as placeholders
    const letterPositions = [
      { x: 350, y: 450 },
      { x: 650, y: 350 },
      { x: 950, y: 270 },
      { x: 450, y: 200 },
      { x: 750, y: 130 },
    ];

    letterPositions.forEach((pos, i) => {
      const letter = this.add.circle(pos.x, pos.y, 16, 0xFFD700, 0.9);
      letter.setStrokeStyle(2, 0xFFA500);

      // Floating animation
      this.tweens.add({
        targets: letter,
        y: pos.y - 10,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Glow effect
      const glow = this.add.circle(pos.x, pos.y, 24, 0xFFD700, 0.2);
      this.tweens.add({
        targets: glow,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.05,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Collision with player
      this.physics.add.overlap(this.player, letter, () => {
        letter.destroy();
        glow.destroy();
        this.collectLetter(i);
      });
    });
  }

  private collectLetter(index: number): void {
    // Emit event to UI scene to update WordBar
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit('letterCollected', { index, total: 5 });
    }

    // Particle burst effect
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

  // Public getters for UI Scene
  public getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  public getHealth(): number {
    return this.health;
  }

  public getCollectedLetters(): number {
    // Will be managed by a letter collection system
    return 0;
  }
}
