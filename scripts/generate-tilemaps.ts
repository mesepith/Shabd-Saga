import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/tilesets');
const COLS = 60;
const ROWS = 12;
const TILE = 64;

mkdirSync(OUTPUT_DIR, { recursive: true });

interface Obj {
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: Array<{ name: string; type: string; value: any }>;
}

function prop(name: string, value: any) {
  return { name, type: typeof value === 'number' ? 'int' : 'string', value };
}

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makeLayer(name: string, grid: number[][], id: number): object {
  const data: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      data.push(grid[r][c]);
    }
  }
  return {
    id,
    name,
    type: 'tilelayer',
    width: COLS,
    height: ROWS,
    data,
    opacity: 1,
    visible: true,
    x: 0,
    y: 0,
  };
}

function makeObjectLayer(name: string, objects: Obj[], id: number): object {
  return {
    id,
    name,
    type: 'objectgroup',
    opacity: 1,
    visible: true,
    draworder: 'topdown',
    objects,
  };
}

interface WorldInfo {
  tilesetName: string;
  tilesetImage: string;
  sky: number;
  cloud: number[];
  mountainFar: number;
  mountainNear: number;
  groundTop: number;
  groundBody: number;
  platform: number;
  platformBody: number;
  grassTuft: number;
  cornerL: number;
  cornerR: number;
  bush: number;
  vine: number;
  flower: number;
  treeTrunk: number;
  rock: number;
}

const JUNGLE: WorldInfo = {
  tilesetName: 'jungle',
  tilesetImage: 'jungle-tiles.png',
  sky: 9, cloud: [10], mountainFar: 17, mountainNear: 11,
  groundTop: 1, groundBody: 2, platform: 3, platformBody: 16,
  grassTuft: 12, cornerL: 14, cornerR: 15, bush: 5, vine: 6,
  flower: 7, treeTrunk: 8, rock: 4,
};

const VILLAGE: WorldInfo = {
  tilesetName: 'village',
  tilesetImage: 'village-tiles.png',
  sky: 11, cloud: [], mountainFar: 12, mountainNear: -1,
  groundTop: 1, groundBody: 2, platform: 3, platformBody: 3,
  grassTuft: -1, cornerL: 19, cornerR: 20, bush: 5, vine: -1,
  flower: -1, treeTrunk: -1, rock: -1,
};

const PALACE: WorldInfo = {
  tilesetName: 'palace',
  tilesetImage: 'palace-tiles.png',
  sky: 9, cloud: [], mountainFar: 12, mountainNear: -1,
  groundTop: 1, groundBody: 17, platform: 13, platformBody: 13,
  grassTuft: -1, cornerL: -1, cornerR: -1, bush: 6, vine: -1,
  flower: 8, treeTrunk: -1, rock: 13,
};

function buildTilemap(world: number, levelNum: number, w: WorldInfo, layoutFn: (g: ReturnType<typeof emptyGrid>, p: ReturnType<typeof emptyGrid>, s: ReturnType<typeof emptyGrid>, m: ReturnType<typeof emptyGrid>, d: ReturnType<typeof emptyGrid>, f: ReturnType<typeof emptyGrid>) => Obj[]): void {
  const sky = emptyGrid();
  const mountains = emptyGrid();
  const decoBg = emptyGrid();
  const platforms = emptyGrid();
  const decoFg = emptyGrid();

  const objects = layoutFn(sky, mountains, decoBg, platforms, decoFg);
  const objs = objects.length;

  const layers: object[] = [];
  layers.push(makeLayer('sky', sky, 1));
  layers.push(makeLayer('mountains', mountains, 2));
  layers.push(makeLayer('decoration-bg', decoBg, 3));
  layers.push(makeLayer('platforms', platforms, 4));
  layers.push(makeLayer('decoration-fg', decoFg, 5));
  layers.push(makeObjectLayer('objects', objects, 6));

  const levelId = `world-${world}-level-${levelNum}`;
  const json: any = {
    width: COLS, height: ROWS, tilewidth: TILE, tileheight: TILE,
    infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
    type: 'map', version: 1.1, tiledversion: '1.11.0',
    nextlayerid: 7, nextobjectid: objs + 1,
    tilesets: [{
      firstgid: 1,
      name: w.tilesetName,
      tilewidth: TILE,
      tileheight: TILE,
      spacing: 0,
      margin: 0,
      tilecount: 20,
      columns: 5,
      image: w.tilesetImage,
      imagewidth: 320,
      imageheight: 256,
    }],
    layers,
  };

  const outPath = resolve(OUTPUT_DIR, `${levelId}.json`);
  writeFileSync(outPath, JSON.stringify(json, null, 2));
  console.log(`  ✓ ${levelId}.json`);
}

function hline(grid: number[][], row: number, colStart: number, colEnd: number, tile: number): void {
  for (let c = colStart; c <= colEnd; c++) {
    if (c >= 0 && c < COLS && row >= 0 && row < ROWS) grid[row][c] = tile;
  }
}

function place(grid: number[][], row: number, col: number, tile: number): void {
  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) grid[row][col] = tile;
}

function rect(grid: number[][], rStart: number, rEnd: number, cStart: number, cEnd: number, tile: number): void {
  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      place(grid, r, c, tile);
    }
  }
}

// Fill sky with sky tile + occasional clouds
function fillSky(s: number[][], w: WorldInfo): void {
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      s[r][c] = w.sky;
    }
  }
  // Clouds
  if (w.cloud.length > 0) {
    for (const cc of [[4, 2], [28, 3], [52, 1], [16, 4], [44, 2]]) {
      place(s, cc[1], cc[0], w.cloud[0]);
      if (cc[0] + 1 < COLS) place(s, cc[1], cc[0] + 1, w.cloud[0]);
    }
  }
}

// Mountains in background
function fillMountains(m: number[][], w: WorldInfo): void {
  if (w.mountainFar > 0) {
    hline(m, 7, 0, COLS - 1, w.mountainFar);
    hline(m, 8, 0, COLS - 1, w.mountainFar);
  }
  if (w.mountainNear > 0) {
    for (let c = 0; c < COLS; c += 4) {
      place(m, 6, c, w.mountainNear);
      if (c + 1 < COLS) place(m, 6, c + 1, w.mountainNear);
    }
  }
}

// Ground: two rows at bottom
function fillGround(plat: number[][], w: WorldInfo, startCol: number, endCol: number, hasBody: boolean = true): void {
  const gnd = ROWS - 2;
  hline(plat, gnd, startCol, endCol, w.groundTop);
  if (hasBody) hline(plat, gnd + 1, startCol, endCol, w.groundBody);
  // Corners
  if (w.cornerL > 0 && startCol > 0) {
    place(plat, gnd, startCol - 1, w.cornerL);
    if (hasBody) place(plat, gnd + 1, startCol - 1, w.groundBody);
    place(plat, gnd, startCol, w.groundTop);
  }
  if (w.cornerR > 0 && endCol < COLS - 1) {
    place(plat, gnd, endCol + 1, w.cornerR);
    if (hasBody) place(plat, gnd + 1, endCol + 1, w.groundBody);
  }
}

// Simple floating platform
function addPlatform(grid: number[][], w: WorldInfo, col: number, row: number, width: number): void {
  for (let c = col; c < col + width && c < COLS; c++) {
    place(grid, row, c, w.platform);
  }
}

// ─── LEVEL DESIGNS ───

console.log('Generating tilemap JSON files...\n');

// ── World 1 Level 1: Jungle Path (tutorial level) ──
buildTilemap(1, 1, JUNGLE, (sky, mountains, decoBg, plat, decoFg) => {
  fillSky(sky, JUNGLE);
  fillMountains(mountains, JUNGLE);

  // Ground from col 0 to 57
  fillGround(plat, JUNGLE, 0, 57);

  // Staircase platforms ascending right
  addPlatform(plat, JUNGLE, 5, 8, 3);   // first step
  addPlatform(plat, JUNGLE, 10, 7, 3);  // higher
  addPlatform(plat, JUNGLE, 15, 6, 3);
  addPlatform(plat, JUNGLE, 20, 5, 3);
  addPlatform(plat, JUNGLE, 25, 4, 3);

  // Decorations: bushes, flowers, vines along ground
  [2, 8, 14, 22, 30, 38, 46, 54].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.bush));
  [5, 12, 19, 27, 35, 42, 50].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.flower));
  [3, 17, 33, 48].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.rock));
  [9, 41].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.treeTrunk));

  // Foreground grass tufts
  [1, 6, 13, 21, 29, 37, 44, 53].forEach((c) => place(decoFg, ROWS - 3, c, JUNGLE.grassTuft));

  // Objects
  const objs: Obj[] = [];
  objs.push({ name: 'player-spawn', type: 'player-spawn', x: 100, y: 570 });

  // NPC Owl
  objs.push({ name: 'npc_owl', type: 'npc', x: 250, y: 410, properties: [prop('npcId', 'wise_owl'), prop('spriteKey', 'npc-owl')] });

  // Doors (5 doors for 5 words: baagh, haathi, mor, ped, nadee, phool - actually 6 words)
  // Wait, world-1-1 has 6 words, but original game only spawned 5 doors with 6 positions.
  // Let me check the original: doorPositions has 6 entries. Words: baagh,haathi,mor,ped,nadee,phool = 6 words.
  // spawnDoors iterates all words so 6 doors.
  const doorWords = ['baagh', 'haathi', 'mor', 'ped', 'nadee', 'phool'];
  const doorXs = [350, 470, 590, 710, 830, 950];
  doorWords.forEach((wid, i) => {
    objs.push({
      name: `door_${wid}`, type: 'door',
      x: doorXs[i], y: 625,
      width: 56, height: 84,
      properties: [prop('wordId', wid)],
    });
  });

  // 20 letter positions
  const letterPositions = [
    { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
    { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
    { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
    { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
    { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
    { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
    { x: 250, y: 450 }, { x: 550, y: 560 },
  ];
  letterPositions.forEach((p, i) => {
    objs.push({ name: `letter_${i}`, type: 'letter', x: p.x, y: p.y });
  });

  // Enemies: 2 creepers + 1 guard
  objs.push({ name: 'creeper_1', type: 'enemy-creeper', x: 600, y: 630, properties: [prop('patrolRange', 150), prop('speed', 65), prop('contactCooldown', 1800)] });
  objs.push({ name: 'creeper_2', type: 'enemy-creeper', x: 850, y: 410, properties: [prop('patrolRange', 120), prop('speed', 70), prop('contactCooldown', 1800)] });
  objs.push({ name: 'guard_1', type: 'enemy-guard', x: 1100, y: 550, properties: [prop('guardWordId', 'ped')] });

  // Checkpoint
  objs.push({ name: 'checkpoint_start', type: 'checkpoint', x: 100, y: 450, properties: [prop('id', 'start'), prop('activated', true)] });

  // Health pickups
  objs.push({ name: 'health_1', type: 'health-pickup', x: 500, y: 590 });
  objs.push({ name: 'health_2', type: 'health-pickup', x: 800, y: 430 });

  // Gems
  objs.push({ name: 'gem_1', type: 'gem', x: 350, y: 590 });
  objs.push({ name: 'gem_2', type: 'gem', x: 650, y: 440 });
  objs.push({ name: 'gem_3', type: 'gem', x: 900, y: 360 });
  objs.push({ name: 'gem_4', type: 'gem', x: 1050, y: 280 });
  objs.push({ name: 'gem_5', type: 'gem', x: 550, y: 580 });

  // Camera bounds
  objs.push({ name: 'camera', type: 'camera-bounds', x: 0, y: 0, width: 1600, height: 720 });

  return objs;
});

// ── World 1 Level 2: Jungle Challenge (boss level) ──
buildTilemap(1, 2, JUNGLE, (sky, mountains, decoBg, plat, decoFg) => {
  fillSky(sky, JUNGLE);
  fillMountains(mountains, JUNGLE);

  // Ground with 2 small gaps
  fillGround(plat, JUNGLE, 0, 17);
  fillGround(plat, JUNGLE, 20, 39);
  fillGround(plat, JUNGLE, 42, 57);

  // Platforms — more complex patterns
  addPlatform(plat, JUNGLE, 6, 8, 4);
  addPlatform(plat, JUNGLE, 13, 7, 3);
  addPlatform(plat, JUNGLE, 22, 8, 2);  // above gap
  addPlatform(plat, JUNGLE, 27, 6, 4);
  addPlatform(plat, JUNGLE, 34, 5, 3);
  addPlatform(plat, JUNGLE, 40, 7, 3);
  addPlatform(plat, JUNGLE, 46, 6, 4);

  // Deco
  [1, 7, 15, 25, 36, 45, 53].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.bush));
  [3, 11, 21, 29, 38, 48, 56].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.flower));
  [5, 23, 43].forEach((c) => place(decoBg, ROWS - 3, c, JUNGLE.treeTrunk));
  [2, 8, 16, 28, 37, 47, 55].forEach((c) => place(decoFg, ROWS - 3, c, JUNGLE.grassTuft));

  const objs: Obj[] = [];
  objs.push({ name: 'player-spawn', type: 'player-spawn', x: 100, y: 570 });

  // NPC Monkey
  objs.push({ name: 'npc_monkey', type: 'npc', x: 600, y: 410, properties: [prop('npcId', 'monkey_friend'), prop('spriteKey', 'npc-monkey')] });

  // Doors for 5 words: patta, sooraj, paanee, bandar, ghaas
  const doorWords = ['patta', 'sooraj', 'paanee', 'bandar', 'ghaas'];
  const doorXs = [370, 500, 630, 760, 890];
  doorWords.forEach((wid, i) => {
    objs.push({ name: `door_${wid}`, type: 'door', x: doorXs[i], y: 625, width: 56, height: 84, properties: [prop('wordId', wid)] });
  });

  // Letters - same spread
  const lps = [
    { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
    { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
    { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
    { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
    { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
    { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
    { x: 250, y: 450 }, { x: 550, y: 560 },
  ];
  lps.forEach((p, i) => objs.push({ name: `letter_${i}`, type: 'letter', x: p.x, y: p.y }));

  objs.push({ name: 'creeper_1', type: 'enemy-creeper', x: 400, y: 630, properties: [prop('patrolRange', 200), prop('speed', 85), prop('contactCooldown', 1400)] });
  objs.push({ name: 'creeper_2', type: 'enemy-creeper', x: 750, y: 410, properties: [prop('patrolRange', 180), prop('speed', 90), prop('contactCooldown', 1400)] });
  objs.push({ name: 'creeper_3', type: 'enemy-creeper', x: 1000, y: 330, properties: [prop('patrolRange', 150), prop('speed', 95), prop('contactCooldown', 1400)] });
  objs.push({ name: 'guard_1', type: 'enemy-guard', x: 1120, y: 560, properties: [prop('guardWordId', 'ghaas')] });

  objs.push({ name: 'checkpoint_start', type: 'checkpoint', x: 100, y: 450, properties: [prop('id', 'start'), prop('activated', true)] });
  objs.push({ name: 'checkpoint_mid', type: 'checkpoint', x: 800, y: 350, properties: [prop('id', 'mid'), prop('activated', false)] });

  objs.push({ name: 'health_1', type: 'health-pickup', x: 500, y: 590 });
  objs.push({ name: 'health_2', type: 'health-pickup', x: 800, y: 430 });

  objs.push({ name: 'gem_1', type: 'gem', x: 350, y: 590 });
  objs.push({ name: 'gem_2', type: 'gem', x: 650, y: 440 });
  objs.push({ name: 'gem_3', type: 'gem', x: 900, y: 360 });
  objs.push({ name: 'gem_4', type: 'gem', x: 1050, y: 280 });
  objs.push({ name: 'gem_5', type: 'gem', x: 550, y: 580 });

  objs.push({ name: 'camera', type: 'camera-bounds', x: 0, y: 0, width: 1600, height: 720 });

  return objs;
});

// ── World 2 Level 1: Village Journey ──
buildTilemap(2, 1, VILLAGE, (sky, mountains, decoBg, plat, decoFg) => {
  fillSky(sky, VILLAGE);
  // Village hills
  for (let c = 0; c < COLS; c += 4) {
    place(mountains, 8, c, VILLAGE.mountainFar);
  }

  // Cobblestone ground
  fillGround(plat, VILLAGE, 0, 57);

  // Wood platforms + house-style structures
  addPlatform(plat, VILLAGE, 4, 8, 4);
  addPlatform(plat, VILLAGE, 10, 7, 3);
  addPlatform(plat, VILLAGE, 16, 6, 4);
  addPlatform(plat, VILLAGE, 22, 5, 3);
  addPlatform(plat, VILLAGE, 28, 6, 3);

  // House decorations: wall+roof combos
  [7, 19, 33].forEach((c) => place(decoBg, ROWS - 5, c, VILLAGE.bush)); // house-wall
  [8, 20, 34].forEach((c) => place(decoBg, ROWS - 5, c, VILLAGE.bush)); // window
  [7, 19, 33].forEach((c) => place(decoBg, ROWS - 6, c, 6)); // roof

  // Fences
  [3, 15, 29, 44].forEach((c) => place(decoBg, ROWS - 3, c, 9)); // fence-h

  // Straw bales
  [5, 25].forEach((c) => place(decoBg, ROWS - 3, c, 14));

  const objs: Obj[] = [];
  objs.push({ name: 'player-spawn', type: 'player-spawn', x: 100, y: 570 });

  // NPC Deer
  objs.push({ name: 'npc_deer', type: 'npc', x: 300, y: 410, properties: [prop('npcId', 'deer_mother'), prop('spriteKey', 'npc-deer')] });

  // Doors for 5 words: maa, rotee, ghar, doodh, bazaar
  const doorWords = ['maa', 'rotee', 'ghar', 'doodh', 'bazaar'];
  const doorXs = [370, 500, 630, 760, 890];
  doorWords.forEach((wid, i) => {
    objs.push({ name: `door_${wid}`, type: 'door', x: doorXs[i], y: 625, width: 56, height: 84, properties: [prop('wordId', wid)] });
  });

  const lps = [
    { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
    { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
    { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
    { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
    { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
    { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
    { x: 250, y: 450 }, { x: 550, y: 560 },
  ];
  lps.forEach((p, i) => objs.push({ name: `letter_${i}`, type: 'letter', x: p.x, y: p.y }));

  objs.push({ name: 'creeper_1', type: 'enemy-creeper', x: 500, y: 630, properties: [prop('patrolRange', 180), prop('speed', 75), prop('contactCooldown', 1700)] });
  objs.push({ name: 'creeper_2', type: 'enemy-creeper', x: 800, y: 410, properties: [prop('patrolRange', 150), prop('speed', 80), prop('contactCooldown', 1700)] });
  objs.push({ name: 'guard_1', type: 'enemy-guard', x: 1020, y: 560, properties: [prop('guardWordId', 'doodh')] });

  objs.push({ name: 'checkpoint_start', type: 'checkpoint', x: 100, y: 450, properties: [prop('id', 'start'), prop('activated', true)] });

  objs.push({ name: 'health_1', type: 'health-pickup', x: 500, y: 590 });
  objs.push({ name: 'health_2', type: 'health-pickup', x: 800, y: 430 });

  objs.push({ name: 'gem_1', type: 'gem', x: 350, y: 590 });
  objs.push({ name: 'gem_2', type: 'gem', x: 650, y: 440 });
  objs.push({ name: 'gem_3', type: 'gem', x: 900, y: 360 });
  objs.push({ name: 'gem_4', type: 'gem', x: 1050, y: 280 });
  objs.push({ name: 'gem_5', type: 'gem', x: 550, y: 580 });

  objs.push({ name: 'camera', type: 'camera-bounds', x: 0, y: 0, width: 1600, height: 720 });

  return objs;
});

// ── World 2 Level 2: Village Challenge (boss) ──
buildTilemap(2, 2, VILLAGE, (sky, mountains, decoBg, plat, decoFg) => {
  fillSky(sky, VILLAGE);
  for (let c = 0; c < COLS; c += 3) place(mountains, 8, c, VILLAGE.mountainFar);

  // Ground with a gap
  fillGround(plat, VILLAGE, 0, 22);
  fillGround(plat, VILLAGE, 25, 57);

  addPlatform(plat, VILLAGE, 5, 8, 4);
  addPlatform(plat, VILLAGE, 11, 7, 3);
  addPlatform(plat, VILLAGE, 18, 8, 3);
  addPlatform(plat, VILLAGE, 24, 7, 2);  // gap bridge
  addPlatform(plat, VILLAGE, 29, 6, 4);
  addPlatform(plat, VILLAGE, 36, 5, 3);
  addPlatform(plat, VILLAGE, 43, 6, 4);

  [2, 9, 17, 27, 38, 49].forEach((c) => place(decoBg, ROWS - 3, c, 9)); // fences
  [6, 22, 35].forEach((c) => place(decoBg, ROWS - 3, c, 14)); // straw
  [4, 14, 31, 46].forEach((c) => place(decoBg, ROWS - 3, c, 5)); // house-wall deco

  const objs: Obj[] = [];
  objs.push({ name: 'player-spawn', type: 'player-spawn', x: 100, y: 570 });

  const doorWords = ['pita', 'daadee', 'chaay', 'phal', 'mitthai'];
  const doorXs = [370, 500, 630, 760, 890];
  doorWords.forEach((wid, i) => {
    objs.push({ name: `door_${wid}`, type: 'door', x: doorXs[i], y: 625, width: 56, height: 84, properties: [prop('wordId', wid)] });
  });

  const lps = [
    { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
    { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
    { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
    { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
    { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
    { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
    { x: 250, y: 450 }, { x: 550, y: 560 },
  ];
  lps.forEach((p, i) => objs.push({ name: `letter_${i}`, type: 'letter', x: p.x, y: p.y }));

  objs.push({ name: 'creeper_1', type: 'enemy-creeper', x: 450, y: 630, properties: [prop('patrolRange', 220), prop('speed', 95), prop('contactCooldown', 1350)] });
  objs.push({ name: 'creeper_2', type: 'enemy-creeper', x: 800, y: 410, properties: [prop('patrolRange', 160), prop('speed', 100), prop('contactCooldown', 1300)] });
  objs.push({ name: 'guard_1', type: 'enemy-guard', x: 1050, y: 560, properties: [prop('guardWordId', 'phal')] });

  objs.push({ name: 'checkpoint_start', type: 'checkpoint', x: 100, y: 450, properties: [prop('id', 'start'), prop('activated', true)] });

  objs.push({ name: 'health_1', type: 'health-pickup', x: 500, y: 590 });
  objs.push({ name: 'health_2', type: 'health-pickup', x: 800, y: 430 });

  objs.push({ name: 'gem_1', type: 'gem', x: 350, y: 590 });
  objs.push({ name: 'gem_2', type: 'gem', x: 650, y: 440 });
  objs.push({ name: 'gem_3', type: 'gem', x: 900, y: 360 });
  objs.push({ name: 'gem_4', type: 'gem', x: 1050, y: 280 });
  objs.push({ name: 'gem_5', type: 'gem', x: 550, y: 580 });

  objs.push({ name: 'camera', type: 'camera-bounds', x: 0, y: 0, width: 1600, height: 720 });

  return objs;
});

// ── World 3 Level 1: Royal Palace (boss level) ──
buildTilemap(3, 1, PALACE, (sky, mountains, decoBg, plat, decoFg) => {
  fillSky(sky, PALACE);
  // Stars
  for (let r = 1; r < 5; r++) {
    for (let c = 2; c < COLS; c += 7) {
      place(sky, r, c, 10);
    }
  }
  // Moon
  place(sky, 1, 50, 11);

  // Palace-far silhouette
  for (let c = 0; c < COLS; c += 5) {
    place(mountains, 7, c, PALACE.mountainFar);
  }

  // Marble ground
  fillGround(plat, PALACE, 0, 57, false);
  hline(plat, ROWS - 1, 0, 57, PALACE.groundBody);

  // Pillar platforms + grand architecture
  addPlatform(plat, PALACE, 4, 8, 3);
  addPlatform(plat, PALACE, 10, 7, 3);
  addPlatform(plat, PALACE, 16, 6, 4);
  addPlatform(plat, PALACE, 22, 5, 3);
  addPlatform(plat, PALACE, 29, 6, 4);

  // Pillars as decoration
  [3, 9, 15, 21, 28, 35].forEach((c) => {
    [ROWS - 5, ROWS - 4, ROWS - 3].forEach((r) => {
      place(decoBg, r, c, 2); // pillar-shaft
    });
    place(decoBg, ROWS - 6, c, 3); // pillar-capital
    place(decoBg, ROWS - 2, c, 4); // pillar-base
  });

  // Curtains
  [1, 7, 13, 19, 25, 31, 40, 48].forEach((c) => place(decoBg, ROWS - 4, c, 7));

  // Red carpet
  [2, 8, 14, 20, 26, 33].forEach((c) => place(decoFg, ROWS - 1, c, 6));

  const objs: Obj[] = [];
  objs.push({ name: 'player-spawn', type: 'player-spawn', x: 100, y: 570 });

  // Doors for 6 words: raaja, raanee, laal, neela, kitaab, deepak
  const doorWords = ['raaja', 'raanee', 'laal', 'neela', 'kitaab', 'deepak'];
  const doorXs = [350, 470, 590, 710, 830, 950];
  doorWords.forEach((wid, i) => {
    objs.push({ name: `door_${wid}`, type: 'door', x: doorXs[i], y: 625, width: 56, height: 84, properties: [prop('wordId', wid)] });
  });

  const lps = [
    { x: 200, y: 530 }, { x: 300, y: 500 }, { x: 400, y: 460 },
    { x: 500, y: 420 }, { x: 600, y: 380 }, { x: 700, y: 340 },
    { x: 800, y: 300 }, { x: 900, y: 260 }, { x: 1000, y: 220 },
    { x: 1100, y: 200 }, { x: 350, y: 560 }, { x: 480, y: 550 },
    { x: 650, y: 500 }, { x: 780, y: 450 }, { x: 880, y: 400 },
    { x: 980, y: 350 }, { x: 1080, y: 300 }, { x: 1150, y: 260 },
    { x: 250, y: 450 }, { x: 550, y: 560 },
  ];
  lps.forEach((p, i) => objs.push({ name: `letter_${i}`, type: 'letter', x: p.x, y: p.y }));

  objs.push({ name: 'creeper_1', type: 'enemy-creeper', x: 530, y: 630, properties: [prop('patrolRange', 200), prop('speed', 110), prop('contactCooldown', 1200)] });
  objs.push({ name: 'creeper_2', type: 'enemy-creeper', x: 900, y: 410, properties: [prop('patrolRange', 150), prop('speed', 120), prop('contactCooldown', 1100)] });
  objs.push({ name: 'guard_1', type: 'enemy-guard', x: 1150, y: 500, properties: [prop('guardWordId', 'neela')] });

  objs.push({ name: 'checkpoint_start', type: 'checkpoint', x: 100, y: 450, properties: [prop('id', 'start'), prop('activated', true)] });

  objs.push({ name: 'health_1', type: 'health-pickup', x: 500, y: 590 });
  objs.push({ name: 'health_2', type: 'health-pickup', x: 800, y: 430 });

  objs.push({ name: 'gem_1', type: 'gem', x: 350, y: 590 });
  objs.push({ name: 'gem_2', type: 'gem', x: 650, y: 440 });
  objs.push({ name: 'gem_3', type: 'gem', x: 900, y: 360 });
  objs.push({ name: 'gem_4', type: 'gem', x: 1050, y: 280 });
  objs.push({ name: 'gem_5', type: 'gem', x: 550, y: 580 });

  objs.push({ name: 'camera', type: 'camera-bounds', x: 0, y: 0, width: 1600, height: 720 });

  return objs;
});

console.log('\nAll tilemap JSON files generated!');
