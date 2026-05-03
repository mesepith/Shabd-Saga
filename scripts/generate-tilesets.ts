import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/tilesets');
const TILE_SIZE = 64;

async function generateTile(type: string, color1: string, color2: string, pattern: string): Promise<void> {
  const tileDir = resolve(OUTPUT_DIR);
  mkdirSync(tileDir, { recursive: true });

  const svg = `<svg width="${TILE_SIZE}" height="${TILE_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${TILE_SIZE}" height="${TILE_SIZE}" fill="${color1}"/>
    ${pattern}
    <rect width="${TILE_SIZE}" height="${TILE_SIZE}" fill="none" stroke="${color2}" stroke-width="1"/>
  </svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).png().toFile(resolve(tileDir, `${type}.png`));
}

async function generateTilesets() {
  console.log('Generating tileset textures...\n');

  // Grass platform
  await generateTile(
    'platform-grass',
    '#2D5A27',
    '#1E3E1A',
    `<rect y="0" width="${TILE_SIZE}" height="6" fill="#3D7A37"/><rect y="6" width="${TILE_SIZE}" height="2" fill="#2D5A27"/>`
  );
  console.log('  platform-grass.png');

  // Stone platform
  await generateTile(
    'platform-stone',
    '#666666',
    '#444444',
    `<rect x="8" y="8" width="16" height="12" fill="#777777" opacity="0.5"/><rect x="36" y="20" width="14" height="12" fill="#777777" opacity="0.5"/><rect x="20" y="38" width="18" height="14" fill="#777777" opacity="0.5"/>`
  );
  console.log('  platform-stone.png');

  // Dirt platform
  await generateTile(
    'platform-dirt',
    '#8B6914',
    '#6B4914',
    `<rect x="4" y="4" width="12" height="8" fill="#9B7934" opacity="0.4"/><rect x="40" y="10" width="10" height="10" fill="#6B4914" opacity="0.3"/><rect x="20" y="40" width="16" height="10" fill="#5B3904" opacity="0.3"/>`
  );
  console.log('  platform-dirt.png');

  // Palace marble
  await generateTile(
    'platform-marble',
    '#E8DCC8',
    '#C8BCA8',
    `<rect x="10" y="10" width="20" height="15" fill="#F0E4D0" opacity="0.3"/><rect x="40" y="30" width="14" height="12" fill="#D8CCB8" opacity="0.2"/>`
  );
  console.log('  platform-marble.png');

  // Wood platform
  await generateTile(
    'platform-wood',
    '#A0522D',
    '#7B3F1A',
    `<rect y="0" width="${TILE_SIZE}" height="4" fill="#B0623D"/><rect y="10" width="${TILE_SIZE}" height="4" fill="#B0623D"/><rect y="20" width="${TILE_SIZE}" height="4" fill="#B0623D"/><rect y="30" width="${TILE_SIZE}" height="4" fill="#B0623D"/>`
  );
  console.log('  platform-wood.png');

  console.log('\nAll tilesets generated!');
}

generateTilesets().catch(console.error);
