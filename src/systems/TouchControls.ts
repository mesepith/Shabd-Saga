import Phaser from 'phaser';

/**
 * Floating joystick + jump zone + dynamic interact button for mobile touch screens.
 * Cross-browser (Chrome, Safari) and cross-device (Android, iPhone).
 *
 * Layout (landscape 1280x720):
 *   Left half (x < midX), bottom 48% — invisible joystick zone (touch anywhere, drag to move)
 *   Right half (x >= midX) — tap anywhere to jump (hold for variable height)
 *   Dynamic interact button — appears only near NPCs/guards/boss vulnerable phase
 *
 * Multitouch: left thumb drives joystick, right thumb jumps — tracked by pointerId.
 */
export class TouchControls {
  /** -1 (full left) to 1 (full right). 0 = idle. Continuous. */
  movementForce: { x: number } = { x: 0 };

  /** True while right-half touch is held. Release for variable-height jump. */
  jumpHeld: boolean = false;

  /** One-shot flag set on interact button tap. Consumer MUST reset to false. */
  interactPressed: boolean = false;

  private scene: Phaser.Scene;

  // Joystick visuals
  private joystickRing!: Phaser.GameObjects.Graphics;
  private joystickKnob!: Phaser.GameObjects.Graphics;

  // Dynamic interact button
  private interactBtn!: Phaser.GameObjects.Rectangle;
  private interactBtnText!: Phaser.GameObjects.Text;
  private interactBtnVisible: boolean = false;

  // Pointer tracking (multitouch)
  private activeJoystickPointer: number = -1;
  private activeJumpPointer: number = -1;
  private joystickOriginX: number = 0;
  private joystickOriginY: number = 0;

  // Zones
  private readonly joystickRadius: number = 52;
  private readonly deadZone: number = 12;
  private midX: number = 0;
  private controlZoneTop: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;
    this.midX = width / 2;
    this.controlZoneTop = height * 0.52;

    this.createJoystick();
    this.createInteractButton(width, height);
    this.registerInput();
  }

  // ── Joystick (unchanged) ──

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
    this.joystickRing.clear();
    this.joystickRing.lineStyle(3, 0xffffff, 0.35);
    this.joystickRing.strokeCircle(ringX, ringY, r);
    this.joystickRing.fillStyle(0xffffff, 0.06);
    this.joystickRing.fillCircle(ringX, ringY, r);

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

  // ── Dynamic Interact Button ──

  private createInteractButton(_width: number, _height: number): void {
    const btnX = this.midX + (_width - this.midX) / 2;
    const btnY = _height * 0.34;

    this.interactBtn = this.scene.add.rectangle(btnX, btnY, 170, 72, 0x333333, 0.80);
    this.interactBtn.setStrokeStyle(3, 0xffcc44, 0.9);
    this.interactBtn.setScrollFactor(0).setDepth(200).setInteractive();
    this.interactBtn.setVisible(false);

    this.interactBtnText = this.scene.add.text(btnX, btnY, '⚡\u00A0Interact', {
      fontSize: '26px',
      color: '#FFCC44',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
    });
    this.interactBtnText.setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.interactBtnText.setVisible(false);
  }

  showInteractButton(): void {
    if (this.interactBtnVisible) return;
    this.interactBtnVisible = true;
    this.interactBtn.setVisible(true);
    this.interactBtnText.setVisible(true);
  }

  hideInteractButton(): void {
    if (!this.interactBtnVisible) return;
    this.interactBtnVisible = false;
    this.interactBtn.setVisible(false);
    this.interactBtnText.setVisible(false);
    this.interactPressed = false;
  }

  // ── Input ──

  private isOnInteractBtn(px: number, py: number): boolean {
    if (!this.interactBtnVisible) return false;
    const b = this.interactBtn;
    return px >= b.x - 85 && px <= b.x + 85 && py >= b.y - 42 && py <= b.y + 42;
  }

  private registerInput(): void {
    const input = this.scene.input;

    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Interact button takes priority — check before control zone filter
      if (this.isOnInteractBtn(pointer.x, pointer.y)) {
        this.interactPressed = true;
        return;
      }

      // Ignore touches above control zone for movement/jump
      if (pointer.y < this.controlZoneTop) return;

      // Right half — jump zone
      if (pointer.x >= this.midX) {
        if (this.activeJumpPointer === -1) {
          this.activeJumpPointer = pointer.id;
          this.jumpHeld = true;
        }
        return;
      }

      // Left half — joystick
      if (this.activeJoystickPointer === -1) {
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

      if (Math.abs(dx) < this.deadZone) {
        this.movementForce.x = 0;
      } else {
        const force = clampedDist / this.joystickRadius;
        this.movementForce.x = dx > 0 ? force : -force;
        if (this.movementForce.x > 1) this.movementForce.x = 1;
        if (this.movementForce.x < -1) this.movementForce.x = -1;
      }
    });

    input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activeJoystickPointer) {
        this.activeJoystickPointer = -1;
        this.movementForce.x = 0;
        this.hideJoystick();
        return;
      }

      if (pointer.id === this.activeJumpPointer) {
        this.activeJumpPointer = -1;
        this.jumpHeld = false;
      }
    });
  }

  // ── Lifecycle ──

  reset(): void {
    this.activeJoystickPointer = -1;
    this.activeJumpPointer = -1;
    this.movementForce.x = 0;
    this.jumpHeld = false;
    this.interactPressed = false;
    this.hideJoystick();
    this.hideInteractButton();
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');

    this.joystickRing?.destroy();
    this.joystickKnob?.destroy();
    this.interactBtn?.destroy();
    this.interactBtnText?.destroy();
  }

  /** Returns true if the current device supports touch. */
  static isTouchDevice(scene: Phaser.Scene): boolean {
    const device = scene.sys.game.device;
    if (device.input.touch) return true;
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
    return false;
  }
}
