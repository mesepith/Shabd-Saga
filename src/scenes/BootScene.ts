import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load minimal assets needed for the preload screen
    this.load.image('logo', 'assets/ui/logo.png');
    this.load.image('loading-bar-bg', 'assets/ui/loading-bar-bg.png');
    this.load.image('loading-bar-fill', 'assets/ui/loading-bar-fill.png');
  }

  create(): void {
    // Set up any global settings
    this.scale.lockOrientation('landscape');

    // Transition to preload scene
    this.scene.start('PreloadScene');
  }
}
