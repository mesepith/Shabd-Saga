import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/ui');

const UI_ELEMENTS: Array<{ name: string; width: number; height: number; svg: string }> = [
  {
    name: 'logo',
    width: 512,
    height: 128,
    svg: `<svg width="512" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="128" fill="#1a1a2e"/>
      <text x="256" y="72" font-size="48" fill="#FFD700" text-anchor="middle" font-family="sans-serif" font-weight="bold">शब्द सागा</text>
      <text x="256" y="100" font-size="16" fill="#CCAADD" text-anchor="middle" font-family="sans-serif" font-style="italic">Shabd Saga</text>
    </svg>`,
  },
  {
    name: 'loading-bar-bg',
    width: 400,
    height: 40,
    svg: `<svg width="400" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="40" rx="8" fill="#222244"/>
      <rect x="2" y="2" width="396" height="36" rx="6" fill="none" stroke="#444488" stroke-width="1"/>
    </svg>`,
  },
  {
    name: 'loading-bar-fill',
    width: 400,
    height: 40,
    svg: `<svg width="400" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="40" rx="8" fill="#66ccff"/>
    </svg>`,
  },
  {
    name: 'button-play',
    width: 240,
    height: 64,
    svg: `<svg width="240" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="64" rx="12" fill="#44AA44"/>
      <rect x="3" y="3" width="234" height="58" rx="9" fill="none" stroke="#66DD66" stroke-width="3"/>
      <text x="120" y="38" font-size="22" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">▶ Play</text>
    </svg>`,
  },
  {
    name: 'button-settings',
    width: 48,
    height: 48,
    svg: `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#334466"/>
      <circle cx="24" cy="24" r="20" fill="none" stroke="#556688" stroke-width="2"/>
      <text x="24" y="30" font-size="20" fill="#AAAACC" text-anchor="middle" font-family="sans-serif">⚙</text>
    </svg>`,
  },
  {
    name: 'panel-bg',
    width: 64,
    height: 64,
    svg: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="6" fill="#1a1a3e"/>
      <rect x="1" y="1" width="62" height="62" rx="5" fill="none" stroke="#334466" stroke-width="1"/>
    </svg>`,
  },
  {
    name: 'star-gold',
    width: 32,
    height: 32,
    svg: `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 19,11 29,11 21,17 24,26 16,21 8,26 11,17 3,11 13,11" fill="#FFD700"/>
    </svg>`,
  },
  {
    name: 'star-empty',
    width: 32,
    height: 32,
    svg: `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 19,11 29,11 21,17 24,26 16,21 8,26 11,17 3,11 13,11" fill="none" stroke="#555555" stroke-width="1.5"/>
    </svg>`,
  },
  {
    name: 'heart-full',
    width: 28,
    height: 28,
    svg: `<svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
      <path d="M14,26 L4,14 Q0,9 4,6 Q8,3 14,8 Q20,3 24,6 Q28,9 24,14 Z" fill="#FF4444"/>
    </svg>`,
  },
  {
    name: 'heart-empty',
    width: 28,
    height: 28,
    svg: `<svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
      <path d="M14,26 L4,14 Q0,9 4,6 Q8,3 14,8 Q20,3 24,6 Q28,9 24,14 Z" fill="none" stroke="#555555" stroke-width="1.5"/>
    </svg>`,
  },
  {
    name: 'gem-icon',
    width: 24,
    height: 24,
    svg: `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 20,10 16,20 8,20 4,10" fill="#00FFFF"/>
      <polygon points="12,2 4,10 12,20" fill="#66FFFF" opacity="0.5"/>
    </svg>`,
  },
  {
    name: 'map-node',
    width: 100,
    height: 100,
    svg: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#334466"/>
      <circle cx="50" cy="50" r="43" fill="none" stroke="#66CCFF" stroke-width="3"/>
    </svg>`,
  },
  {
    name: 'map-node-locked',
    width: 100,
    height: 100,
    svg: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#1a1a33"/>
      <circle cx="50" cy="50" r="43" fill="none" stroke="#333355" stroke-width="2"/>
      <text x="50" y="58" font-size="28" fill="#555577" text-anchor="middle" font-family="sans-serif">🔒</text>
    </svg>`,
  },
  {
    name: 'map-connector',
    width: 32,
    height: 32,
    svg: `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="0" width="4" height="32" fill="#334466" opacity="0.6"/>
    </svg>`,
  },
];

async function generateUI() {
  console.log('Generating UI elements...\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const element of UI_ELEMENTS) {
    const path = resolve(OUTPUT_DIR, `${element.name}.png`);
    const svg = Buffer.from(element.svg);
    await sharp(svg).png().toFile(path);
    console.log(`  ${element.name}.png`);
  }

  console.log('\nAll UI elements generated!');
}

generateUI().catch(console.error);
