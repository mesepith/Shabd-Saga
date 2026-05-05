import Phaser from 'phaser';

/**
 * Floating joystick + jump/interact buttons for mobile touch screens.
 * Cross-browser (Chrome, Safari) and cross-device (Android, iPhone).
 *
 * Layout (landscape 1280x720):
 *   Left half, bottom 45% — invisible joystick zone (touch anywhere)
 *   Right side, bottom area — jump button (72px) + interact button (60px)
 *
 * Multitouch: left thumb drives joystick, right thumb taps buttons — tracked by pointerId.
 */
export class TouchControls {
  /** -1 (full left) to 1 (full right). 0 = idle. Continuous, not reset per frame. */
  movementForce: { x: number } = { x: 0 };

  /** True while jump button is held. Release for variable-height jump (cut velocity). */
  jumpHeld: boolean = false;

  /**
   * One-shot flag set on interact button tap.
   * Consumer (scene) MUST set to false after consuming.
   */
  interactPressed: boolean = false;

  private scene: Phaser.Scene;

  // Joystick visuals
  private joystickRing!: Phaser.GameObjects.Graphics;
  private joystickKnob!: Phaser.GameObjects.Graphics;

  // Buttons
  private jumpBtn!: Phaser.GameObjects.Rectangle;
  private jumpBtnText!: Phaser.GameObjects.Text;
  private interactBtn!: Phaser.GameObjects.Rectangle;
  private interactBtnText!: Phaser.GameObjects.Text;

  // Pointer tracking (multitouch)
  private activeJoystickPointer: number = -1;
  private activeJumpPointer: number = -1;
  private joystickOriginX: number = 0;
  private joystickOriginY: number = 0;

  // Zones
  private readonly joystickRadius: number = 52;
  private readonly deadZone: number = 12;
  private midX: number = 0;
  private controlZoneTop: number = 0; // y above which controls ignore touches

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;
    this.midX = width / 2;
    this.controlZoneTop = height * 0.52;

    this.createJoystick();
    this.createButtons(width, height);
    this.registerInput();
  }

  // ── Joystick ──

  private createJoystick(): void {
    this.joystickRing = this.scene.add.graphics();
    this.joystickRing.setScrollFactor(0).setDepth(200);
    this.joystickRing.setVisible(false);

    this.joystickKnob = this.scene.add.graphics();
    this.joystickKnob.setScrollFactor(0).setDepth(201);
    this.joystickKnob.setVisible(false);
  }

  private drawJoystick(ringX: number, ringY: number, knobOffsetX: number, knobOffsetY: number): void {
    const r = this.joystickRadius;
    // Outer ring
    this.joystickRing.clear();
    this.joystickRing.lineStyle(3, 0xffffff, 0.35);
    this.joystickRing.strokeCircle(ringX, ringY, r);
    // Inner fill (subtle)
    this.joystickRing.fillStyle(0xffffff, 0.06);
    this.joystickRing.fillCircle(ringX, ringY, r);

    // Knob
    this.joystickKnob.clear();
    this.joystickKnob.fillStyle(0xffffff, 0.45);
    this.joystickKnob.fillCircle(ringX + knobOffsetX, ringY + knobOffsetY, 22);
    this.joystickKnob.lineStyle(2, 0xffffff, 0.55);
    this.joystickKnob.strokeCircle(ringX + knobOffsetX, ringY + knobOffsetY, 22);
  }

  private hideJoystick(): void {
    this.joystickRing.setVisible(false);
    this.joystickKnob.setVisible(false);
    this.joystickRing.clear();
    this.joystickKnob.clear();
  }

  private showJoystick(x: number, y: number): void {
    this.joystickRing.setVisible(true);
    this.joystickKnob.setVisible(true);
    this.drawJoystick(x, y, 0, 0);
  }

  // ── Buttons ──

  private createButtons(width: number, height: number): void {
    // Jump button — bottom-right, large target
    const jumpX = width - 80;
    const jumpY = height - 100;

    this.jumpBtn = this.scene.add.rectangle(jumpX, jumpY, 72, 72, 0x000000, 0.25);
    this.jumpBtn.setStrokeStyle(2, 0xffffff, 0.25);
    this.jumpBtn.setScrollFactor(0).setDepth(200).setInteractive();

    this.jumpBtnText = this.scene.add.text(jumpX, jumpY, '\u25B2', {
      fontSize: '34px', color: '#FFFFFF',
    });
    this.jumpBtnText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Interact button — above jump
    const intX = width - 80;
    const intY = height - 190;

    this.interactBtn = this.scene.add.rectangle(intX, intY, 60, 60, 0x000000, 0.25);
    this.interactBtn.setStrokeStyle(2, 0xffffff, 0.25);
    this.interactBtn.setScrollFactor(0).setDepth(200).setInteractive();

    this.interactBtnText = this.scene.add.text(intX, intY, '\uD83D\uDCAC', {
      fontSize: '24px',
    });
    this.interactBtnText.setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  // ── Input ──

  private registerInput(): void {
    const input = this.scene.input;

    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore touches above the control zone (let game objects handle them)
      if (pointer.y < this.controlZoneTop) return;

      // --- Interact button (one-shot) ---
      if (
        pointer.x >= this.interactBtn.x - 30 &&
        pointer.x <= this.interactBtn.x + 30 &&
        pointer.y >= this.interactBtn.y - 30 &&
        pointer.y <= this.interactBtn.y + 30
      ) {
        this.interactPressed = true;
        return;
      }

      // --- Jump button (hold-to-jump) ---
      if (
        pointer.x >= this.jumpBtn.x - 36 &&
        pointer.x <= this.jumpBtn.x + 36 &&
        pointer.y >= this.jumpBtn.y - 36 &&
        pointer.y <= this.jumpBtn.y + 36
      ) {
        this.activeJumpPointer = pointer.id;
        this.jumpHeld = true;
        this.jumpBtn.setFillStyle(0x444444, 0.5);
        return;
      }

      // --- Left zone → joystick ---
      if (pointer.x < this.midX && this.activeJoystickPointer === -1) {
        this.activeJoystickPointer = pointer.id;
        this.joystickOriginX = pointer.x;
        this.joystickOriginY = pointer.y;
        this.showJoystick(this.joystickOriginX, this.joystickOriginY);
      }
    });

    input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.activeJoystickPointer) return;

      const dx = pointer.x - this.joystickOriginX;
      const dy = pointer.y - this.joystickOriginY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clampedDist = Math.min(dist, this.joystickRadius);

      let knobX = 0;
      let knobY = 0;
      if (dist > 0.01) {
        const ratio = clampedDist / dist;
        knobX = dx * ratio;
        knobY = dy * ratio;
      }

      this.drawJoystick(this.joystickOriginX, this.joystickOriginY, knobX, knobY);

      // Horizontal movement force (dead zone)
      if (Math.abs(dx) < this.deadZone) {
        this.movementForce.x = 0;
      } else {
        const force = clampedDist / this.joystickRadius;
        this.movementForce.x = dx > 0 ? force : -force;
        // Clamp to [-1, 1]
        if (this.movementForce.x > 1) this.movementForce.x = 1;
        if (this.movementForce.x < -1) this.movementForce.x = -1;
      }
    });

    input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Release joystick (by pointerId — handles slide-off)
      if (pointer.id === this.activeJoystickPointer) {
        this.activeJoystickPointer = -1;
        this.movementForce.x = 0;
        this.hideJoystick();
        return;
      }

      // Release jump button (by pointerId — handles slide-off)
      if (pointer.id === this.activeJumpPointer) {
        this.activeJumpPointer = -1;
        this.jumpHeld = false;
        this.jumpBtn.setFillStyle(0x000000, 0.25);
        return;
      }
    });
  }

  // ── Lifecycle ──

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');

    this.joystickRing?.destroy();
    this.joystickKnob?.destroy();
    this.jumpBtn?.destroy();
    this.jumpBtnText?.destroy();
    this.interactBtn?.destroy();
    this.interactBtnText?.destroy();
  }

  /**
   * Returns true if the current device supports touch.
   * Works on Chrome, Safari, Android, iPhone via Phaser's device detection.
   */
  static isTouchDevice(scene: Phaser.Scene): boolean {
    const device = scene.sys.game.device;
    if (device.input.touch) return true;
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
    return false;
  }
}
