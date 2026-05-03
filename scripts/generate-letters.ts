import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/sprites/letters');

// Hindi letters from the language config
const HINDI_LETTERS = [
  'बा', 'घ', 'हा', 'थी', 'मो', 'र', 'पे', 'ड़', 'न', 'दी', 'फू', 'ल',
  'प', 'ता', 'सू', 'ज', 'पा', 'नी', 'बं', 'द', 'घा', 'स',
  'माँ', 'रो', 'टी', 'ध', 'दू', 'ज़ार', 'पि', 'दा',
  'चा', 'य', 'फ', 'मि', 'ठा', 'ई', 'ला', 'कि', 'ब', 'क',
];

const COLORS = {
  consonant: '#E8750A',
  vowel: '#4488CC',
  matra: '#CC44AA',
  special: '#FFD700',
};

function isVowel(char: string): boolean {
  const vowels = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'];
  return vowels.includes(char);
}

function getLetterColor(char: string): string {
  if (isVowel(char)) return COLORS.vowel;
  if (char.length > 1) return COLORS.matra; // combined has matra
  return COLORS.consonant;
}

async function generateLetters() {
  console.log('Generating letter sprites...\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const letter of HINDI_LETTERS) {
    const color = getLetterColor(letter[0]);
    const size = letter.length > 1 ? 64 : 56;

    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" opacity="0.85"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>
      <text x="${size / 2}" y="${size / 2 + size * 0.15}" font-size="${size * 0.4}" fill="white" text-anchor="middle" font-family="Noto Sans Devanagari, sans-serif" font-weight="bold">${letter}</text>
    </svg>`;

    const buf = Buffer.from(svg);
    await sharp(buf).png().toFile(resolve(OUTPUT_DIR, `${letter}.png`));
    console.log(`  ${letter}.png`);
  }

  // Also generate placeholder
  const placeholderSVG = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#666666" opacity="0.9"/>
    <text x="32" y="38" font-size="20" fill="white" text-anchor="middle" font-family="sans-serif">?</text>
  </svg>`;
  await sharp(Buffer.from(placeholderSVG)).png().toFile(resolve(OUTPUT_DIR, 'placeholder.png'));
  console.log('  placeholder.png');

  console.log('\nAll letter sprites generated!');
}

generateLetters().catch(console.error);
