import Phaser from 'phaser';

export class TransitionManager {
  static readonly FADE_DURATION = 600;
  static readonly FADE_COLOR = { r: 0x1a, g: 0x1a, b: 0x2e };

  static toScene(fromScene: Phaser.Scene, targetScene: string, data?: Record<string, unknown>): void {
    fromScene.cameras.main.fadeOut(this.FADE_DURATION, this.FADE_COLOR.r, this.FADE_COLOR.g, this.FADE_COLOR.b);
    fromScene.cameras.main.once('camerafadeoutcomplete', () => {
      fromScene.scene.start(targetScene, data);
    });
  }
}
