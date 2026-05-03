import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets');
const WIDTH = 1280;
const HEIGHT = 720;

const BG_LAYERS = [
  { baseColor: [13, 27, 42, 255] },
  { baseColor: [27, 40, 56, 255] },
  { baseColor: [26, 71, 42, 255] },
  { baseColor: [30, 86, 49, 255] },
  { baseColor: [45, 90, 39, 255] },
];

async function generateLayer(buffer: Buffer, layerIndex: number, worldId: string): Promise<void> {
  const dir = resolve(OUTPUT_DIR, `backgrounds/${worldId}`);
  mkdirSync(dir, { recursive: true });

  const path = resolve(dir, `layer-${layerIndex}.png`);
  await sharp(buffer).png().toFile(path);
  console.log(`  Generated: ${path}`);
}

/**
 * Generate a simple gradient + procedural noise background layer.
 * Uses sharp's SVG compositing to create layered visuals.
 */
function generateGradientLayer(width: number, height: number, colorTop: string, colorBot: string): Buffer {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colorTop}"/>
        <stop offset="100%" stop-color="${colorBot}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#sky)"/>
  </svg>`;
  return Buffer.from(svg);
}

function generateMountainLayer(width: number, height: number, color: string): Buffer {
  let paths = '';
  for (let x = 0; x < width; x += 80) {
    const h = Math.sin(x * 0.008) * 120 + Math.cos(x * 0.025) * 60 + 80;
    paths += `<polygon points="${x},${height} ${x + 40},${height - h} ${x + 80},${height}" fill="${color}" opacity="0.6"/>`;
  }
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="none"/>
    ${paths}
  </svg>`;
  return Buffer.from(svg);
}

function generateTreeLayer(width: number, height: number, trunkColor: string, leafColor: string): Buffer {
  let elements = '';
  for (let x = 0; x < width; x += 50) {
    const h = 40 + Math.random() * 60;
    const leafR = 20 + Math.random() * 25;
    // Trunk
    elements += `<rect x="${x - 4}" y="${height - h}" width="8" height="${h}" fill="${trunkColor}"/>`;
    // Leaves
    elements += `<circle cx="${x}" cy="${height - h - leafR * 0.3}" r="${leafR}" fill="${leafColor}" opacity="0.5"/>`;
  }
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="none"/>
    ${elements}
  </svg>`;
  return Buffer.from(svg);
}

async function generateBackgrounds() {
  console.log('Generating background layers...\n');

  // World 1: Jungle
  console.log('World 1 (Jungle):');
  const layers1: Array<{ name: string; svg: Buffer }> = [
    { name: 'sky', svg: generateGradientLayer(WIDTH, HEIGHT, '#0D1B2A', '#1B3B5A') },
    { name: 'mountains-far', svg: generateMountainLayer(WIDTH, HEIGHT, '#1B3A2A') },
    { name: 'mountains-near', svg: generateMountainLayer(WIDTH, HEIGHT, '#1A472A') },
    { name: 'trees-far', svg: generateTreeLayer(WIDTH, HEIGHT, '#2D1810', '#1A4A2A') },
    { name: 'trees-mid', svg: generateTreeLayer(WIDTH, HEIGHT, '#3D2015', '#1E5631') },
    { name: 'ground', svg: Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg"><rect width="${WIDTH}" height="${HEIGHT}" fill="#2D5A27"/><rect y="${HEIGHT - 40}" width="${WIDTH}" height="40" fill="#1E3E1A"/></svg>`) },
  ];

  for (const layer of layers1) {
    const dir = resolve(OUTPUT_DIR, 'backgrounds/world-1');
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `${layer.name}.png`);
    await sharp(layer.svg).png().toFile(path);
    console.log(`  world-1/${layer.name}.png`);
  }

  // World 2: Village
  console.log('World 2 (Village):');
  const layers2: Array<{ name: string; svg: Buffer }> = [
    { name: 'sky', svg: generateGradientLayer(WIDTH, HEIGHT, '#FFD700', '#87CEEB') },
    { name: 'hills-far', svg: generateMountainLayer(WIDTH, HEIGHT, '#8B7355') },
    { name: 'hills-near', svg: generateMountainLayer(WIDTH, HEIGHT, '#A0522D') },
  ];

  for (const layer of layers2) {
    const dir = resolve(OUTPUT_DIR, 'backgrounds/world-2');
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `${layer.name}.png`);
    await sharp(layer.svg).png().toFile(path);
    console.log(`  world-2/${layer.name}.png`);
  }

  // World 3: Palace
  console.log('World 3 (Palace):');
  const layers3: Array<{ name: string; svg: Buffer }> = [
    { name: 'sky', svg: generateGradientLayer(WIDTH, HEIGHT, '#1a0a2e', '#2d1b69') },
    { name: 'palace-far', svg: generateMountainLayer(WIDTH, HEIGHT, '#4a3a6e') },
  ];

  for (const layer of layers3) {
    const dir = resolve(OUTPUT_DIR, 'backgrounds/world-3');
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `${layer.name}.png`);
    await sharp(layer.svg).png().toFile(path);
    console.log(`  world-3/${layer.name}.png`);
  }

  console.log('\nAll backgrounds generated!');
}

generateBackgrounds().catch(console.error);
