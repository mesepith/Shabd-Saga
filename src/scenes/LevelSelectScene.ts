import Phaser from 'phaser';
import { TransitionManager } from '../systems/TransitionManager';
import { AudioManager } from '../systems/AudioManager';

interface WorldNode {
  id: string;
  name: string;
  nameEnglish: string;
  x: number;
  y: number;
  unlocked: boolean;
  stars: number;
}

interface LevelInfo {
  levelId: string;
  levelNumber: number;
  name: string;
  nameEnglish: string;
  stars: number;
  completed: boolean;
}

export class LevelSelectScene extends Phaser.Scene {
  private worlds: WorldNode[] = [];
  private playerProgress: Record<string, { stars: number; completed: boolean }> = {};
  private currentMenuObjects: Phaser.GameObjects.GameObject[] = [];
  private selectedWorldId: string | null = null;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(data?: { language: string }): void {
    const language = data?.language || 'hindi';
    const { width, height } = this.cameras.main;
    this.currentMenuObjects = [];
    this.selectedWorldId = null;

    this.cameras.main.fadeIn(TransitionManager.FADE_DURATION);
    AudioManager.getInstance().startMenuMusic();

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, width, height);
    this.currentMenuObjects.push(bg);

    // Title
    const title = this.add.text(width / 2, 50, 'Choose Your Adventure', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
    });
    title.setOrigin(0.5);
    this.currentMenuObjects.push(title);

    // Back button
    const backBtn = this.add.text(30, 30, '← Back', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '18px',
      color: '#AAAACC',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      TransitionManager.toScene(this, 'MenuScene');
    });
    backBtn.on('pointerover', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setColor('#AAAACC'));
    this.currentMenuObjects.push(backBtn);

    // Define worlds
    this.worlds = [
      {
        id: 'world-1',
        name: 'जंगल की यात्रा',
        nameEnglish: 'The Jungle Journey',
        x: width * 0.25,
        y: height * 0.35,
        unlocked: true,
        stars: this.getWorldStars('world-1'),
      },
      {
        id: 'world-2',
        name: 'गाँव का रास्ता',
        nameEnglish: 'The Village Path',
        x: width * 0.5,
        y: height * 0.48,
        unlocked: this.getProgress('world-1-level-1') !== null || this.getProgress('world-1-level-2') !== null,
        stars: this.getWorldStars('world-2'),
      },
      {
        id: 'world-3',
        name: 'राजमहल',
        nameEnglish: 'The Royal Palace',
        x: width * 0.75,
        y: height * 0.35,
        unlocked: this.getProgress('world-2-level-1') !== null || this.getProgress('world-2-level-2') !== null,
        stars: this.getWorldStars('world-3'),
      },
    ];

    // Draw world map nodes
    this.worlds.forEach((world, index) => {
      this.createWorldNode(world, index);
    });

    // Draw connector paths
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
    this.currentMenuObjects.push(starsText);
  }

  private getWorldStars(worldId: string): number {
    try {
      const progress = JSON.parse(localStorage.getItem('shabd-saga-progress') || '{}');
      const levels = progress?.languages?.hindi?.completedLevels || {};
      return Object.entries(levels)
        .filter(([k]) => k.startsWith(worldId))
        .reduce((sum, [_, v]: [string, any]) => sum + (v.stars || 0), 0);
    } catch { return 0; }
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
      this.currentMenuObjects.push(glow);
    }

    // Node circle
    const nodeBg = this.add.graphics();
    this.drawNodeBg(nodeBg, world, false);
    this.currentMenuObjects.push(nodeBg);

    // World number
    const numText = this.add.text(world.x, world.y - 18, `World ${index + 1}`, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '13px',
      color: world.unlocked ? '#66CCFF' : '#444466',
    });
    numText.setOrigin(0.5);
    this.currentMenuObjects.push(numText);

    // World name (Hindi)
    const nameText = this.add.text(world.x, world.y + 5, world.unlocked ? world.name : '🔒', {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: world.unlocked ? '16px' : '24px',
      color: world.unlocked ? '#FFFFFF' : '#555577',
    });
    nameText.setOrigin(0.5);
    this.currentMenuObjects.push(nameText);

    // Stars display
    if (world.unlocked && world.stars > 0) {
      const starsStr = '★'.repeat(Math.min(world.stars, 3)) + '☆'.repeat(Math.max(0, 3 - Math.min(world.stars, 3)));
      const starsDisplay = this.add.text(world.x, world.y + 28, starsStr, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#FFD700',
      });
      starsDisplay.setOrigin(0.5);
      this.currentMenuObjects.push(starsDisplay);
    }

    // English name below
    if (world.unlocked) {
      const engText = this.add.text(world.x, world.y + 60, world.nameEnglish, {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '12px',
        color: '#8888AA',
      });
      engText.setOrigin(0.5);
      this.currentMenuObjects.push(engText);
    }

    // Interaction
    if (world.unlocked) {
      const hitZone = this.add.zone(world.x, world.y, nodeSize, nodeSize).setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        this.drawNodeBg(nodeBg, world, true);
      });

      hitZone.on('pointerout', () => {
        this.drawNodeBg(nodeBg, world, false);
      });

      hitZone.on('pointerdown', () => {
        this.showWorldLevels(world);
      });

      this.currentMenuObjects.push(hitZone);
    }
  }

  private drawNodeBg(graphics: Phaser.GameObjects.Graphics, world: WorldNode, hover: boolean): void {
    graphics.clear();
    const nodeSize = 100;
    if (world.unlocked) {
      graphics.fillStyle(hover ? 0x445577 : 0x334466, 1);
      graphics.fillCircle(world.x, world.y, nodeSize / 2);
      graphics.lineStyle(3, hover ? 0x88DDFF : 0x66CCFF, 1);
      graphics.strokeCircle(world.x, world.y, nodeSize / 2);
    } else {
      graphics.fillStyle(0x1a1a33, 1);
      graphics.fillCircle(world.x, world.y, nodeSize / 2);
      graphics.lineStyle(2, 0x333355, 1);
      graphics.strokeCircle(world.x, world.y, nodeSize / 2);
    }
  }

  private showWorldLevels(world: WorldNode): void {
    this.selectedWorldId = world.id;
    const { width, height } = this.cameras.main;

    // Clear previous level menu if any
    this.currentMenuObjects.forEach((obj) => {
      if (obj.type !== 'Graphics' && obj.type !== 'Rectangle') {
        // Keep background
      }
    });
    this.clearLevelMenu();

    // Overlay backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    backdrop.setDepth(50);
    backdrop.setInteractive(); // Block clicks behind
    this.currentMenuObjects.push(backdrop);

    // Panel
    const panel = this.add.rectangle(width / 2, height / 2, 480, 380, 0x1a1a3e, 0.95);
    panel.setStrokeStyle(2, 0x4444AA);
    panel.setDepth(51);
    this.currentMenuObjects.push(panel);

    // Back button
    const backBtn = this.add.text(width / 2 - 220, height / 2 - 175, '← Back to Worlds', {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#AAAACC',
    }).setDepth(52).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.closeLevelMenu());
    backBtn.on('pointerover', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setColor('#AAAACC'));
    this.currentMenuObjects.push(backBtn);

    // World title
    const worldTitle = this.add.text(width / 2, height / 2 - 155, world.name, {
      fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
      fontSize: '28px',
      color: '#FFD700',
    }).setOrigin(0.5).setDepth(52);
    this.currentMenuObjects.push(worldTitle);

    const worldSub = this.add.text(width / 2, height / 2 - 125, world.nameEnglish, {
      fontFamily: 'Noto Sans, system-ui, sans-serif',
      fontSize: '16px',
      color: '#8888AA',
    }).setOrigin(0.5).setDepth(52);
    this.currentMenuObjects.push(worldSub);

    // Level buttons
    const levels = this.getWorldLevels(world.id);
    const startY = height / 2 - 60;
    const btnH = 60;
    const btnW = 380;
    const gap = 14;

    levels.forEach((level, i) => {
      const y = startY + i * (btnH + gap);

      // Level button
      const btn = this.add.rectangle(width / 2, y + btnH / 2, btnW, btnH, level.completed ? 0x2a3a2a : 0x2a2a4a, 1);
      btn.setStrokeStyle(2, level.completed ? 0x44AA44 : 0x444488);
      btn.setDepth(52);
      btn.setInteractive({ useHandCursor: true });
      this.currentMenuObjects.push(btn);

      // Level number + name
      const starStr = level.completed ? '★'.repeat(level.stars) + '☆'.repeat(3 - level.stars) : '';

      const levelText = this.add.text(width / 2 - 150, y + btnH / 2, `Level ${level.levelNumber}: ${level.name}`, {
        fontFamily: 'Noto Sans Devanagari, system-ui, sans-serif',
        fontSize: '18px',
        color: '#FFFFFF',
      }).setOrigin(0, 0.5).setDepth(53);
      this.currentMenuObjects.push(levelText);

      const engText = this.add.text(width / 2 - 150, y + btnH / 2 + 18, level.nameEnglish, {
        fontFamily: 'Noto Sans, system-ui, sans-serif',
        fontSize: '12px',
        color: '#8888AA',
      }).setOrigin(0, 0.5).setDepth(53);
      this.currentMenuObjects.push(engText);

      if (starStr) {
        const starsTxt = this.add.text(width / 2 + 150, y + btnH / 2, starStr, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#FFD700',
        }).setOrigin(1, 0.5).setDepth(53);
        this.currentMenuObjects.push(starsTxt);
      }

      btn.on('pointerover', () => {
        btn.setFillStyle(level.completed ? 0x3a5a3a : 0x3a3a6a);
        btn.setStrokeStyle(2, level.completed ? 0x66CC66 : 0x6666AA);
      });

      btn.on('pointerout', () => {
        btn.setFillStyle(level.completed ? 0x2a3a2a : 0x2a2a4a);
        btn.setStrokeStyle(2, level.completed ? 0x44AA44 : 0x444488);
      });

      btn.on('pointerdown', () => {
        this.startLevel(level.levelId);
      });
    });
  }

  private getWorldLevels(worldId: string): LevelInfo[] {
    // Level names from the language data
    const levelNames: Record<string, { name: string; nameEnglish: string }> = {
      'world-1-level-1': { name: 'जंगल का मार्ग', nameEnglish: 'The Jungle Path' },
      'world-1-level-2': { name: 'जंगल की चुनौती', nameEnglish: 'The Jungle Challenge' },
      'world-2-level-1': { name: 'गाँव की यात्रा', nameEnglish: 'The Village Journey' },
      'world-2-level-2': { name: 'गाँव की चुनौती', nameEnglish: 'The Village Challenge' },
      'world-3-level-1': { name: 'राजमहल का रहस्य', nameEnglish: 'Secret of the Palace' },
    };

    const levels: LevelInfo[] = [];
    // Find all levels for this world from the progress data
    try {
      const progress = JSON.parse(localStorage.getItem('shabd-saga-progress') || '{}');
      const completedLevels = progress?.languages?.hindi?.completedLevels || {};

      // Generate level entries
      let levelNum = 1;
      while (true) {
        const levelId = `${worldId}-level-${levelNum}`;
        const info = levelNames[levelId];
        if (!info) break;

        const levelProgress = completedLevels[levelId];
        const completed = !!levelProgress;
        levels.push({
          levelId,
          levelNumber: levelNum,
          name: info.name,
          nameEnglish: info.nameEnglish,
          stars: levelProgress?.stars || 0,
          completed,
        });

        // Next level only accessible if previous was completed OR it's the first level
        if (!completed && levelNum > 1) break; // Don't show locked future levels
        levelNum++;
      }
    } catch {
      // Default: just show level-1
      const info = levelNames[`${worldId}-level-1`];
      if (info) {
        levels.push({
          levelId: `${worldId}-level-1`,
          levelNumber: 1,
          name: info.name,
          nameEnglish: info.nameEnglish,
          stars: 0,
          completed: false,
        });
      }
    }

    // Always show level-1 if not yet unlocked (it's first level)
    if (levels.length === 0) {
      const info = levelNames[`${worldId}-level-1`];
      if (info) {
        levels.push({
          levelId: `${worldId}-level-1`,
          levelNumber: 1,
          name: info.name,
          nameEnglish: info.nameEnglish,
          stars: 0,
          completed: false,
        });
      }
    }

    return levels;
  }

  private startLevel(levelId: string): void {
    TransitionManager.toScene(this, 'GameScene', { levelId, language: 'hindi' } as any);
  }

  private clearLevelMenu(): void {
    // Remove objects added during level menu display
    this.currentMenuObjects = this.currentMenuObjects.filter((obj) => {
      if (obj.getData('persistent')) return true;
      if (obj.active) {
        // Keep world map objects, remove level menu objects
        const depth = (obj as any).depth || 0;
        if (depth >= 50) {
          obj.destroy();
          return false;
        }
      }
      return obj.active;
    });
  }

  private closeLevelMenu(): void {
    // Remove all level menu objects and restart scene to refresh
    this.scene.restart();
  }

  private drawConnectors(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(3, 0x334466, 0.6);
    this.currentMenuObjects.push(graphics);

    for (let i = 0; i < this.worlds.length - 1; i++) {
      const current = this.worlds[i];
      const next = this.worlds[i + 1];

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

  private getProgress(levelId: string): { stars: number; completed: boolean } | null {
    try {
      const progress = JSON.parse(localStorage.getItem('shabd-saga-progress') || '{}');
      const levelProgress = progress?.languages?.hindi?.completedLevels?.[levelId];
      if (levelProgress) {
        return { stars: levelProgress.stars || 0, completed: true };
      }
    } catch { /* ignore */ }
    return null;
  }
}
