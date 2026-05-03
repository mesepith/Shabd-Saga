import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/sprites');
const SIZE = 64;

function generateSprite(type: string, color: string, shape: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    ${shape}
  </svg>`;
}

async function generateSprites() {
  console.log('Generating sprite placeholders...\n');

  const sprites: Array<{ category: string; name: string; color: string; shape: string }> = [
    // Player sprites
    {
      category: 'player',
      name: 'idle',
      color: '#E8750A',
      shape: `<rect x="12" y="8" width="40" height="48" rx="12" fill="#E8750A"/><circle cx="32" cy="20" r="14" fill="#E8750A"/><circle cx="24" cy="16" r="4" fill="white"/><circle cx="40" cy="16" r="4" fill="white"/><circle cx="26" cy="15" r="2" fill="black"/><circle cx="42" cy="15" r="2" fill="black"/><rect x="24" y="28" width="8" height="20" rx="4" fill="#FFd700"/><polygon points="8,20 16,12 16,28" fill="#E8750A"/><polygon points="56,20 48,12 48,28" fill="#E8750A"/>`,
    },
    {
      category: 'player',
      name: 'jump',
      color: '#E8750A',
      shape: `<rect x="12" y="12" width="40" height="40" rx="10" fill="#E8750A"/><circle cx="32" cy="18" r="14" fill="#E8750A"/><circle cx="24" cy="14" r="4" fill="white"/><circle cx="40" cy="14" r="4" fill="white"/><circle cx="26" cy="13" r="2" fill="black"/><circle cx="42" cy="13" r="2" fill="black"/><polygon points="8,18 16,10 16,24" fill="#E8750A"/><polygon points="56,18 48,10 48,24" fill="#E8750A"/><rect x="20" y="44" width="24" height="12" rx="6" fill="#E8750A"/>`,
    },
    // Enemy sprites
    {
      category: 'enemies',
      name: 'shadow-creeper',
      color: '#4a004a',
      shape: `<ellipse cx="32" cy="36" rx="22" ry="26" fill="#4a0088"/><ellipse cx="16" cy="28" rx="8" ry="10" fill="#4a0088"/><ellipse cx="48" cy="28" rx="8" ry="10" fill="#4a0088"/><circle cx="20" cy="26" r="5" fill="#FFD700"/><circle cx="44" cy="26" r="5" fill="#FFD700"/><circle cx="21" cy="25" r="2" fill="white"/><circle cx="45" cy="25" r="2" fill="white"/>`,
    },
    // NPC sprites
    {
      category: 'npcs',
      name: 'owl',
      color: '#8B6914',
      shape: `<ellipse cx="32" cy="36" rx="20" ry="24" fill="#8B6914"/><circle cx="32" cy="22" r="16" fill="#A0782C"/><rect x="20" y="16" width="10" height="10" rx="4" fill="white"/><rect x="34" y="16" width="10" height="10" rx="4" fill="white"/><circle cx="25" cy="21" r="4" fill="#8B6914"/><circle cx="39" cy="21" r="4" fill="#8B6914"/><polygon points="28,10 32,2 36,10" fill="#FFD700"/>`,
    },
    {
      category: 'npcs',
      name: 'monkey',
      color: '#808080',
      shape: `<ellipse cx="32" cy="36" rx="18" ry="22" fill="#808080"/><circle cx="32" cy="18" r="14" fill="#999999"/><ellipse cx="22" cy="14" rx="8" ry="10" fill="#A0A0A0"/><ellipse cx="42" cy="14" rx="8" ry="10" fill="#A0A0A0"/><circle cx="26" cy="17" r="3" fill="white"/><circle cx="38" cy="17" r="3" fill="white"/><circle cx="27" cy="16" r="1.5" fill="black"/><circle cx="39" cy="16" r="1.5" fill="black"/>`,
    },
    {
      category: 'npcs',
      name: 'deer',
      color: '#D4A574',
      shape: `<ellipse cx="32" cy="38" rx="16" ry="22" fill="#D4A574"/><circle cx="32" cy="18" r="12" fill="#D4A574"/><circle cx="26" cy="15" r="3" fill="white"/><circle cx="38" cy="15" r="3" fill="white"/><circle cx="27" cy="14" r="1.5" fill="black"/><circle cx="39" cy="14" r="1.5" fill="black"/><line x1="22" y1="8" x2="16" y2="2" stroke="#8B6914" stroke-width="2"/><line x1="42" y1="8" x2="48" y2="2" stroke="#8B6914" stroke-width="2"/>`,
    },
    // Props sprites
    {
      category: 'props',
      name: 'door',
      color: '#8B4513',
      shape: `<rect x="8" y="0" width="48" height="64" rx="4" fill="#8B4513"/><rect x="12" y="4" width="40" height="56" rx="2" fill="#A0522D"/><circle cx="52" cy="32" r="3" fill="#FFD700"/><rect x="14" y="30" width="18" height="4" fill="#D4A574"/>`,
    },
    {
      category: 'props',
      name: 'gem',
      color: '#00FFFF',
      shape: `<polygon points="32,2 44,20 38,38 26,38 20,20" fill="#00FFFF"/><polygon points="32,2 20,20 32,38" fill="#66FFFF"/><circle cx="32" cy="20" r="4" fill="white" opacity="0.5"/>`,
    },
    // Letter placeholder
    {
      category: 'letters',
      name: 'placeholder',
      color: '#FFD700',
      shape: `<circle cx="32" cy="32" r="18" fill="#FFD700" opacity="0.9"/><circle cx="32" cy="32" r="14" fill="none" stroke="#FFA500" stroke-width="2"/><text x="32" y="38" font-size="16" fill="#8B6914" text-anchor="middle" font-family="sans-serif">अ</text>`,
    },
  ];

  for (const sprite of sprites) {
    const dir = resolve(OUTPUT_DIR, sprite.category);
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `${sprite.name}.png`);
    const svg = Buffer.from(generateSprite(sprite.category, sprite.color, sprite.shape));
    await sharp(svg).png().toFile(path);
    console.log(`  ${sprite.category}/${sprite.name}.png`);
  }

  console.log('\nAll sprites generated!');
}

generateSprites().catch(console.error);
