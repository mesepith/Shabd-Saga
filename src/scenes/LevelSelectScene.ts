import Phaser from 'phaser';

interface WorldNode {
  id: string;
  name: string;
  nameEnglish: string;
  x: number;
  y: number;
  unlocked: boolean;
  stars: number;
  isBoss: boolean;
}

export class LevelSelectScene extends Phaser.Scene {
  private worlds: WorldNode[] = [];
  private playerProgress: Record<string, { stars: number; completed: boolean }> = {};

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(data?: { language: string }): void {
    const language = data?.language || 'hindi';
    const { width, height } = this.cameras.main;

    this.cameras.main.fadeIn(500);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, 50, 'Choose Your Adventure', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
    });
    title.setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 30, '← Back', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#AAAACC',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    backBtn.on('pointerover', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setColor('#AAAACC'));

    // Define worlds
    this.worlds = [
      {
        id: 'world-1',
        name: 'जंगल की यात्रा',
        nameEnglish: 'The Jungle Journey',
        x: width * 0.25,
        y: height * 0.4,
        unlocked: true,
        stars: this.getProgress('world-1')?.stars || 0,
        isBoss: false,
      },
      {
        id: 'world-2',
        name: 'गाँव का रास्ता',
        nameEnglish: 'The Village Path',
        x: width * 0.5,
        y: height * 0.55,
        unlocked: this.getProgress('world-1')?.completed || false,
        stars: this.getProgress('world-2')?.stars || 0,
        isBoss: false,
      },
      {
        id: 'world-3',
        name: 'राजमहल',
        nameEnglish: 'The Royal Palace',
        x: width * 0.75,
        y: height * 0.4,
        unlocked: this.getProgress('world-2')?.completed || false,
        stars: this.getProgress('world-3')?.stars || 0,
        isBoss: true,
      },
    ];

    // Draw world map nodes
    this.worlds.forEach((world, index) => {
      this.createWorldNode(world, index);
    });

    // Draw connector paths between unlocked worlds
    this.drawConnectors();

    // Stars summary
    const totalStars = Object.values(this.playerProgress).reduce(
      (sum, p) => sum + (p.stars || 0), 0
    );
    const starsText = this.add.text(width / 2, height - 40, `Total Stars: ${totalStars}`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#FFD700',
    });
    starsText.setOrigin(0.5);
  }

  private createWorldNode(world: WorldNode, index: number): void {
    const nodeSize = 100;

    // Glow effect for unlocked worlds
    if (world.unlocked) {
      const glow = this.add.circle(world.x, world.y, nodeSize * 0.8, 0xFFD700, 0.15);
      this.tweens.add({
        targets: glow,
        alpha: 0.3,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Node circle
    const nodeBg = this.add.graphics();
    if (world.unlocked) {
      nodeBg.fillStyle(0x334466, 1);
      nodeBg.fillCircle(world.x, world.y, nodeSize / 2);
      nodeBg.lineStyle(3, 0x66CCFF, 1);
      nodeBg.strokeCircle(world.x, world.y, nodeSize / 2);
    } else {
      nodeBg.fillStyle(0x1a1a33, 1);
      nodeBg.fillCircle(world.x, world.y, nodeSize / 2);
      nodeBg.lineStyle(2, 0x333355, 1);
      nodeBg.strokeCircle(world.x, world.y, nodeSize / 2);
    }

    // World number
    const numText = this.add.text(world.x, world.y - 18, `World ${index + 1}`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '13px',
      color: world.unlocked ? '#66CCFF' : '#444466',
    });
    numText.setOrigin(0.5);

    // World name (Hindi)
    const nameText = this.add.text(world.x, world.y + 5, world.unlocked ? world.name : '🔒', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: world.unlocked ? '16px' : '24px',
      color: world.unlocked ? '#FFFFFF' : '#555577',
    });
    nameText.setOrigin(0.5);

    // Stars display
    if (world.unlocked && world.stars > 0) {
      const starsStr = '★'.repeat(world.stars) + '☆'.repeat(3 - world.stars);
      const starsDisplay = this.add.text(world.x, world.y + 28, starsStr, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#FFD700',
      });
      starsDisplay.setOrigin(0.5);
    }

    // English name below
    if (world.unlocked) {
      const engText = this.add.text(world.x, world.y + 68, world.nameEnglish, {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '12px',
        color: '#8888AA',
      });
      engText.setOrigin(0.5);
    }

    // Boss indicator
    if (world.isBoss && world.unlocked) {
      const bossTag = this.add.text(world.x, world.y - 42, '👑 BOSS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#FF6666',
      });
      bossTag.setOrigin(0.5);
    }

    // Interaction
    if (world.unlocked) {
      const hitZone = this.add.zone(world.x, world.y, nodeSize, nodeSize).setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        nodeBg.clear();
        nodeBg.fillStyle(0x445577, 1);
        nodeBg.fillCircle(world.x, world.y, nodeSize / 2);
        nodeBg.lineStyle(3, 0x88DDFF, 1);
        nodeBg.strokeCircle(world.x, world.y, nodeSize / 2);
      });

      hitZone.on('pointerout', () => {
        nodeBg.clear();
        nodeBg.fillStyle(0x334466, 1);
        nodeBg.fillCircle(world.x, world.y, nodeSize / 2);
        nodeBg.lineStyle(3, 0x66CCFF, 1);
        nodeBg.strokeCircle(world.x, world.y, nodeSize / 2);
      });

      hitZone.on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', {
            worldId: world.id,
            levelId: `${world.id}-level-1`,
            language: 'hindi',
          });
        });
      });
    }
  }

  private drawConnectors(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(3, 0x334466, 0.6);

    // Draw paths between consecutive worlds
    for (let i = 0; i < this.worlds.length - 1; i++) {
      const current = this.worlds[i];
      const next = this.worlds[i + 1];

      // Dashed line effect
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const segments = 20;

      for (let s = 0; s < segments; s += 2) {
        const t1 = s / segments;
        const t2 = (s + 1) / segments;
        graphics.lineBetween(
          current.x + dx * t1,
          current.y + dy * t1,
          current.x + dx * t2,
          current.y + dy * t2
        );
      }
    }
  }

  private getProgress(worldId: string): { stars: number; completed: boolean } | null {
    try {
      const progress = JSON.parse(localStorage.getItem('shabd-saga-progress') || '{}');
      const worldProgress = progress?.languages?.hindi?.completedLevels?.[`${worldId}-level-1`];
      if (worldProgress) {
        return { stars: worldProgress.stars || 0, completed: true };
      }
      // Check if any level in this world is completed
      const levels = progress?.languages?.hindi?.completedLevels || {};
      const worldLevels = Object.keys(levels).filter(k => k.startsWith(worldId));
      if (worldLevels.length > 0) {
        const maxStars = Math.max(...worldLevels.map(k => levels[k]?.stars || 0));
        return { stars: maxStars, completed: worldLevels.length > 0 };
      }
    } catch (e) {
      // localStorage not available or corrupted
    }
    return null;
  }
}
