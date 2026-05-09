import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/tilesets');
const TILE = 64;
const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;

// ─── SVG gradient utilities ───

function linearGradient(
  id: string,
  angle: number,
  stops: [number, string][],
): string {
  const rad = (angle * Math.PI) / 180;
  const x1 = 0.5 - Math.cos(rad) * 0.5;
  const y1 = 0.5 - Math.sin(rad) * 0.5;
  const x2 = 0.5 + Math.cos(rad) * 0.5;
  const y2 = 0.5 + Math.sin(rad) * 0.5;
  const s = stops
    .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${s}</linearGradient>`;
}

function radialGradient(
  id: string,
  cx: number,
  cy: number,
  r: number,
  stops: [number, string][],
): string {
  const s = stops
    .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${s}</radialGradient>`;
}

// ─── Gradient definitions per world ───

function jungleGradients(): string {
  return [
    linearGradient('jg-grass', 270, [
      [0, '#4B7A33'],
      [0.3, '#3D5A27'],
      [0.7, '#2D4A1A'],
      [1, '#1E3A10'],
    ]),
    linearGradient('jg-grass-top', 270, [
      [0, '#5A9A44'],
      [0.5, '#4B7A33'],
      [1, '#3D5A27'],
    ]),
    linearGradient('jg-dirt', 270, [
      [0, '#7B5932'],
      [0.4, '#6B4922'],
      [0.8, '#5B3904'],
      [1, '#4A2904'],
    ]),
    linearGradient('jg-wood', 270, [
      [0, '#6B4520'],
      [0.5, '#5B3515'],
      [1, '#3A2510'],
    ]),
    linearGradient('jg-rock', 315, [
      [0, '#8B8B8B'],
      [0.5, '#6B6B6B'],
      [1, '#4B4B4B'],
    ]),
    radialGradient('jg-rock-round', 0.35, 0.35, 0.7, [
      [0, '#9B9B9B'],
      [0.5, '#7B7B7B'],
      [1, '#5B5B5B'],
    ]),
    radialGradient('jg-bush', 0.45, 0.4, 0.6, [
      [0, '#4A8A44'],
      [0.5, '#3D7A37'],
      [1, '#2D5A27'],
    ]),
    linearGradient('jg-sky', 270, [
      [0, '#264A7C'],
      [0.4, '#1B3A5C'],
      [1, '#0E2040'],
    ]),
    radialGradient('jg-sun', 0.5, 0.3, 0.6, [
      [0, 'rgba(255,228,181,0.25)'],
      [0.3, 'rgba(255,215,0,0.15)'],
      [0.7, 'rgba(255,180,50,0.05)'],
      [1, 'rgba(0,0,0,0)'],
    ]),
    linearGradient('jg-cloud', 270, [
      [0, 'rgba(255,255,255,0.45)'],
      [0.3, 'rgba(255,255,255,0.3)'],
      [1, 'rgba(255,255,255,0.08)'],
    ]),
    linearGradient('jg-mtn', 315, [
      [0, '#3D5A6A'],
      [0.5, '#2D4A5A'],
      [1, '#1D3A4A'],
    ]),
    linearGradient('jg-mtn-far', 315, [
      [0, 'rgba(42,74,90,0.55)'],
      [0.5, 'rgba(26,58,74,0.45)'],
      [1, 'rgba(20,40,60,0.35)'],
    ]),
    radialGradient('jg-flower', 0.5, 0.5, 0.5, [
      [0, '#FF8FB3'],
      [0.6, '#FF6B9D'],
      [1, '#E05080'],
    ]),
    radialGradient('jg-gold', 0.5, 0.5, 0.5, [
      [0, '#FFE44D'],
      [0.5, '#FFD700'],
      [1, '#D4A800'],
    ]),
  ].join('');
}

function villageGradients(): string {
  return [
    linearGradient('vg-cobble', 270, [
      [0, '#6A6A6A'],
      [0.3, '#5A5A5A'],
      [0.7, '#4A4A4A'],
      [1, '#3A3A3A'],
    ]),
    linearGradient('vg-road', 270, [
      [0, '#8B7240'],
      [0.4, '#7B6230'],
      [1, '#6B5210'],
    ]),
    linearGradient('vg-wood-h', 270, [
      [0, '#8B6B4A'],
      [0.3, '#6B4520'],
      [0.6, '#5B3515'],
      [1, '#3A2510'],
    ]),
    linearGradient('vg-wood-v', 0, [
      [0, '#8B6B4A'],
      [0.3, '#6B4520'],
      [0.6, '#5B3515'],
      [1, '#3A2510'],
    ]),
    linearGradient('vg-wall', 270, [
      [0, '#D4B892'],
      [0.2, '#C4A882'],
      [0.6, '#B89872'],
      [1, '#A88862'],
    ]),
    linearGradient('vg-roof', 315, [
      [0, '#D45A4A'],
      [0.3, '#C44A3A'],
      [0.6, '#9B3A2A'],
      [1, '#7B2A1A'],
    ]),
    linearGradient('vg-sky', 270, [
      [0, '#6D5080'],
      [0.35, '#4D4070'],
      [0.7, '#3D3060'],
      [1, '#2A2050'],
    ]),
    linearGradient('vg-hills', 270, [
      [0, '#6A8A5A'],
      [0.4, '#5A6A4A'],
      [1, '#3A4A2A'],
    ]),
    linearGradient('vg-straw', 270, [
      [0, '#E4C850'],
      [0.2, '#D4B850'],
      [0.6, '#C4A840'],
      [1, '#A08830'],
    ]),
    radialGradient('vg-canopy', 0.5, 0.3, 0.7, [
      [0, '#EEAA55'],
      [0.4, '#DD9944'],
      [1, '#BB7722'],
    ]),
    linearGradient('vg-chimney', 270, [
      [0, '#8B5A4A'],
      [0.4, '#7B4A3A'],
      [1, '#5B2A1A'],
    ]),
    linearGradient('vg-fence', 270, [
      [0, '#9B7B5A'],
      [0.5, '#8B6B4A'],
      [1, '#6B4520'],
    ]),
  ].join('');
}

function palaceGradients(): string {
  return [
    linearGradient('pg-marble', 270, [
      [0, '#F0E8D8'],
      [0.3, '#E0D8C8'],
      [0.7, '#D8D0C0'],
      [1, '#C8C0B0'],
    ]),
    linearGradient('pg-marble-dark', 270, [
      [0, '#D0C8B8'],
      [0.4, '#C8C0B0'],
      [1, '#B8B0A0'],
    ]),
    linearGradient('pg-pillar', 0, [
      [0, '#D0C8B8'],
      [0.25, '#F0E8D8'],
      [0.5, '#F8F0E8'],
      [0.75, '#F0E8D8'],
      [1, '#D0C8B8'],
    ]),
    linearGradient('pg-pillar-simple', 0, [
      [0, '#D8D0C0'],
      [0.3, '#F0E8D8'],
      [0.7, '#F0E8D8'],
      [1, '#D8D0C0'],
    ]),
    linearGradient('pg-gold', 270, [
      [0, '#FFE44D'],
      [0.3, '#FFD700'],
      [0.6, '#D4A800'],
      [1, '#B88800'],
    ]),
    linearGradient('pg-gold-h', 0, [
      [0, '#B88800'],
      [0.3, '#FFD700'],
      [0.5, '#FFE44D'],
      [0.7, '#FFD700'],
      [1, '#B88800'],
    ]),
    linearGradient('pg-stone', 270, [
      [0, '#5A5A6A'],
      [0.4, '#4A4A5A'],
      [1, '#3A3A4A'],
    ]),
    linearGradient('pg-carpet', 270, [
      [0, '#9B2A3A'],
      [0.5, '#8B1A2A'],
      [1, '#7B0A1A'],
    ]),
    linearGradient('pg-curtain', 0, [
      [0, '#4A1050'],
      [0.3, '#6A3070'],
      [0.7, '#6A3070'],
      [1, '#4A1050'],
    ]),
    linearGradient('pg-sky', 270, [
      [0, '#141438'],
      [0.4, '#0A0A24'],
      [1, '#05051A'],
    ]),
    radialGradient('pg-candle-glow', 0.5, 0.45, 0.5, [
      [0, 'rgba(255,200,50,0.4)'],
      [0.3, 'rgba(255,150,0,0.2)'],
      [0.7, 'rgba(255,100,0,0.05)'],
      [1, 'rgba(0,0,0,0)'],
    ]),
    radialGradient('pg-moon-glow', 0.5, 0.3, 0.8, [
      [0, 'rgba(200,200,255,0.2)'],
      [0.5, 'rgba(180,180,240,0.08)'],
      [1, 'rgba(0,0,0,0)'],
    ]),
    linearGradient('pg-throne-velvet', 270, [
      [0, '#8B3030'],
      [0.4, '#6B2020'],
      [1, '#4B1010'],
    ]),
  ].join('');
}

// ─── Tile wrapper ───

interface TileDef {
  id: number;
  name: string;
  svg: string;
}

function makeTile(inner: string): string {
  return `<svg width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function emptyTile(id: number, name: string): TileDef {
  return { id, name, svg: makeTile('') };
}

// ─── JUNGLE TILES ───

function jungleTiles(): TileDef[] {
  const G = jungleGradients();
  return [
    {
      id: 1, name: 'grass-ground',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-grass)"/>` +
        `<rect y="0" width="64" height="7" fill="url(#jg-grass-top)"/>` +
        `<rect y="7" width="64" height="3" fill="rgba(30,60,10,0.35)"/>` +
        `<ellipse cx="10" cy="16" rx="6" ry="3" fill="rgba(75,122,51,0.5)"/>` +
        `<ellipse cx="30" cy="22" rx="5" ry="2" fill="rgba(100,140,70,0.3)"/>` +
        `<ellipse cx="52" cy="14" rx="4" ry="2" fill="rgba(75,122,51,0.4)"/>` +
        `<ellipse cx="18" cy="34" rx="5" ry="3" fill="rgba(80,130,55,0.3)"/>` +
        `<ellipse cx="44" cy="40" rx="7" ry="3" fill="rgba(60,100,35,0.25)"/>` +
        `<ellipse cx="8" cy="50" rx="4" ry="2" fill="rgba(70,110,40,0.3)"/>` +
        `<ellipse cx="56" cy="28" rx="5" ry="2" fill="rgba(65,105,35,0.35)"/>` +
        `<circle cx="14" cy="12" r="1.5" fill="rgba(255,255,255,0.08)"/>` +
        `<circle cx="40" cy="8" r="1" fill="rgba(255,255,255,0.06)"/>` +
        `<circle cx="58" cy="20" r="1.5" fill="rgba(255,255,255,0.07)"/>`,
      ),
    },
    {
      id: 2, name: 'dirt-ground',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-dirt)"/>` +
        `<rect y="0" width="64" height="8" fill="rgba(123,89,50,0.3)"/>` +
        `<ellipse cx="8" cy="14" rx="5" ry="4" fill="rgba(91,57,4,0.5)"/>` +
        `<ellipse cx="28" cy="10" rx="4" ry="3" fill="rgba(123,89,50,0.3)"/>` +
        `<ellipse cx="48" cy="16" rx="6" ry="4" fill="rgba(91,57,4,0.4)"/>` +
        `<ellipse cx="16" cy="30" rx="5" ry="5" fill="rgba(100,70,20,0.35)"/>` +
        `<ellipse cx="40" cy="28" rx="4" ry="3" fill="rgba(85,50,10,0.4)"/>` +
        `<ellipse cx="56" cy="34" rx="5" ry="4" fill="rgba(100,70,20,0.3)"/>` +
        `<ellipse cx="10" cy="46" rx="6" ry="4" fill="rgba(91,57,4,0.45)"/>` +
        `<ellipse cx="34" cy="50" rx="5" ry="3" fill="rgba(110,75,25,0.3)"/>` +
        `<ellipse cx="54" cy="48" rx="4" ry="3" fill="rgba(85,50,10,0.35)"/>` +
        `<ellipse cx="22" cy="58" rx="7" ry="4" fill="rgba(91,57,4,0.4)"/>` +
        `<line x1="6" y1="22" x2="12" y2="26" stroke="rgba(100,70,20,0.3)" stroke-width="1"/>` +
        `<line x1="44" y1="38" x2="50" y2="42" stroke="rgba(100,70,20,0.25)" stroke-width="1"/>`,
      ),
    },
    {
      id: 3, name: 'grass-platform',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-wood)"/>` +
        `<rect y="0" width="64" height="8" fill="url(#jg-grass-top)"/>` +
        `<rect y="8" width="64" height="2" fill="rgba(30,60,10,0.4)"/>` +
        `<rect x="2" y="12" width="60" height="2" fill="rgba(100,80,50,0.3)"/>` +
        `<rect x="6" y="22" width="12" height="2" fill="rgba(70,50,30,0.4)"/>` +
        `<rect x="34" y="28" width="20" height="2" fill="rgba(70,50,30,0.35)"/>` +
        `<rect x="12" y="38" width="16" height="2" fill="rgba(50,35,15,0.4)"/>` +
        `<rect x="40" y="44" width="14" height="2" fill="rgba(50,35,15,0.35)"/>` +
        `<rect x="8" y="52" width="18" height="2" fill="rgba(40,25,10,0.3)"/>` +
        `<circle cx="10" cy="16" r="2" fill="rgba(90,150,70,0.4)"/>` +
        `<circle cx="50" cy="10" r="2" fill="rgba(90,150,70,0.35)"/>`,
      ),
    },
    {
      id: 4, name: 'rock-boulder',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<ellipse cx="32" cy="42" rx="24" ry="18" fill="url(#jg-rock)"/>` +
        `<ellipse cx="28" cy="38" rx="20" ry="14" fill="url(#jg-rock-round)"/>` +
        `<ellipse cx="18" cy="30" rx="8" ry="5" fill="rgba(155,155,155,0.35)"/>` +
        `<path d="M18 28 L22 46 L16 48 Z" fill="rgba(75,75,75,0.23)" />` +
        `<path d="M38 32 L44 50 L40 52 Z" fill="rgba(75,75,75,0.2)" />` +
        `<line x1="24" y1="52" x2="30" y2="55" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>` +
        `<line x1="34" y1="36" x2="40" y2="38" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>` +
        `<ellipse cx="22" cy="34" rx="6" ry="2" fill="rgba(255,255,255,0.12)"/>`,
      ),
    },
    {
      id: 5, name: 'bush',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<ellipse cx="32" cy="44" rx="26" ry="18" fill="rgba(45,90,39,0.8)"/>` +
        `<ellipse cx="24" cy="42" rx="18" ry="15" fill="url(#jg-bush)"/>` +
        `<ellipse cx="42" cy="44" rx="16" ry="13" fill="#3D6A30"/>` +
        `<ellipse cx="32" cy="34" rx="12" ry="9" fill="#4A8A44"/>` +
        `<ellipse cx="20" cy="34" rx="7" ry="6" fill="#5AAA50"/>` +
        `<ellipse cx="44" cy="36" rx="6" ry="5" fill="#5AAA50"/>` +
        `<circle cx="26" cy="30" r="2" fill="rgba(100,180,80,0.5)"/>` +
        `<circle cx="38" cy="32" r="2" fill="rgba(100,180,80,0.45)"/>` +
        `<circle cx="16" cy="40" r="1.5" fill="rgba(100,180,80,0.35)"/>` +
        `<circle cx="48" cy="42" r="1.5" fill="rgba(100,180,80,0.3)"/>`,
      ),
    },
    {
      id: 6, name: 'vine',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="28" y="0" width="8" height="64" fill="url(#jg-wood)" rx="3"/>` +
        `<rect x="30" y="0" width="4" height="64" fill="rgba(100,150,70,0.25)" rx="2"/>` +
        `<ellipse cx="32" cy="8" rx="7" ry="4" fill="#4B7A33"/>` +
        `<ellipse cx="34" cy="8" rx="5" ry="3" fill="rgba(80,140,50,0.5)"/>` +
        `<ellipse cx="28" cy="22" rx="7" ry="4" fill="#4B7A33"/>` +
        `<ellipse cx="30" cy="22" rx="5" ry="3" fill="rgba(80,140,50,0.5)"/>` +
        `<ellipse cx="36" cy="36" rx="7" ry="4" fill="#3D6A30"/>` +
        `<ellipse cx="34" cy="36" rx="5" ry="3" fill="rgba(70,120,45,0.5)"/>` +
        `<ellipse cx="28" cy="50" rx="7" ry="4" fill="#4B7A33"/>` +
        `<ellipse cx="30" cy="50" rx="5" ry="3" fill="rgba(80,140,50,0.5)"/>` +
        `<circle cx="33" cy="14" r="1" fill="rgba(100,100,100,0.3)"/>` +
        `<circle cx="29" cy="28" r="1" fill="rgba(100,100,100,0.25)"/>` +
        `<circle cx="37" cy="42" r="1" fill="rgba(100,100,100,0.3)"/>`,
      ),
    },
    {
      id: 7, name: 'flower',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<circle cx="26" cy="42" r="7" fill="url(#jg-flower)"/>` +
        `<circle cx="16" cy="38" r="6" fill="#FF8FB3"/>` +
        `<circle cx="36" cy="38" r="6" fill="#FF8FB3"/>` +
        `<circle cx="22" cy="32" r="6" fill="#FF8FB3"/>` +
        `<circle cx="30" cy="32" r="6" fill="#FF8FB3"/>` +
        `<circle cx="26" cy="37" r="4.5" fill="url(#jg-gold)"/>` +
        `<rect x="25" y="49" width="2" height="15" fill="url(#jg-wood)"/>` +
        `<ellipse cx="26" cy="38" rx="2" ry="2" fill="rgba(255,255,255,0.3)"/>` +
        `<circle cx="28" cy="49" r="3" fill="rgba(60,130,50,0.25)"/>`,
      ),
    },
    {
      id: 8, name: 'tree-trunk',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="18" y="0" width="28" height="64" fill="url(#jg-wood)"/>` +
        `<rect x="20" y="0" width="24" height="64" fill="rgba(107,69,32,0.4)"/>` +
        `<rect x="22" y="0" width="20" height="64" fill="rgba(150,120,80,0.15)"/>` +
        `<rect x="18" y="8" width="28" height="3" fill="rgba(74,42,21,0.5)"/>` +
        `<rect x="18" y="18" width="28" height="2" fill="rgba(74,42,21,0.4)"/>` +
        `<rect x="18" y="30" width="28" height="3" fill="rgba(74,42,21,0.5)"/>` +
        `<rect x="18" y="40" width="28" height="2" fill="rgba(74,42,21,0.35)"/>` +
        `<rect x="18" y="50" width="28" height="3" fill="rgba(74,42,21,0.45)"/>` +
        `<rect x="20" y="56" width="24" height="4" fill="rgba(50,30,10,0.4)"/>` +
        `<ellipse cx="24" cy="14" rx="6" ry="3" fill="rgba(100,140,70,0.2)"/>` +
        `<ellipse cx="38" cy="36" rx="5" ry="2" fill="rgba(100,140,70,0.15)"/>`,
      ),
    },
    {
      id: 9, name: 'sky',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-sky)"/>` +
        `<circle cx="10" cy="8" r="1" fill="rgba(255,255,255,0.15)"/>` +
        `<circle cx="52" cy="14" r="1.2" fill="rgba(255,255,255,0.12)"/>` +
        `<circle cx="38" cy="6" r="0.8" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="18" cy="22" r="1" fill="rgba(255,255,255,0.08)"/>` +
        `<circle cx="56" cy="28" r="0.8" fill="rgba(255,255,255,0.09)"/>`,
      ),
    },
    {
      id: 10, name: 'cloud',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<ellipse cx="30" cy="28" rx="20" ry="12" fill="url(#jg-cloud)"/>` +
        `<ellipse cx="20" cy="30" rx="14" ry="9" fill="rgba(255,255,255,0.28)"/>` +
        `<ellipse cx="44" cy="26" rx="16" ry="10" fill="rgba(255,255,255,0.22)"/>` +
        `<ellipse cx="54" cy="30" rx="10" ry="7" fill="rgba(255,255,255,0.15)"/>` +
        `<ellipse cx="10" cy="32" rx="8" ry="6" fill="rgba(255,255,255,0.18)"/>` +
        `<ellipse cx="32" cy="24" rx="14" ry="6" fill="rgba(255,255,255,0.4)"/>`,
      ),
    },
    {
      id: 11, name: 'mountain',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<polygon points="0,64 16,8 32,64" fill="url(#jg-mtn)"/>` +
        `<polygon points="0,64 16,8 16,64" fill="rgba(100,120,130,0.2)"/>` +
        `<polygon points="28,64 48,20 64,10 64,64" fill="#1D3A4A"/>` +
        `<polygon points="28,64 48,20 40,64" fill="rgba(60,90,105,0.25)"/>` +
        `<polygon points="48,20 64,10 64,64" fill="rgba(30,60,75,0.5)"/>` +
        `<polygon points="10,64 24,20 38,64" fill="rgba(61,90,106,0.5)"/>` +
        `<polygon points="14,20 18,28 10,28 Z" fill="rgba(220,235,245,0.4)"/>` +
        `<polygon points="44,22 48,32 38,32 Z" fill="rgba(220,235,245,0.3)"/>` +
        `<line x1="14" y1="24" x2="12" y2="40" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>` +
        `<line x1="46" y1="26" x2="44" y2="44" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`,
      ),
    },
    {
      id: 12, name: 'grass-tuft',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<polygon points="18,64 22,38 26,64" fill="url(#jg-grass)"/>` +
        `<polygon points="12,64 16,44 20,64" fill="#4B7A33"/>` +
        `<polygon points="24,64 28,40 32,64" fill="#3D6A30"/>` +
        `<polygon points="32,64 36,46 40,64" fill="#4B7A33"/>` +
        `<polygon points="38,64 42,42 46,64" fill="#2D5A27"/>` +
        `<polygon points="44,64 48,48 52,64" fill="#3D6A30"/>` +
        `<polygon points="50,64 54,40 58,64" fill="#4B7A33"/>` +
        `<polygon points="16,44 18,40 20,44" fill="rgba(255,255,200,0.3)"/>` +
        `<polygon points="42,42 44,38 46,42" fill="rgba(255,255,200,0.25)"/>`,
      ),
    },
    emptyTile(13, 'empty'),
    {
      id: 14, name: 'ground-corner-l',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-grass)"/>` +
        `<rect y="0" width="64" height="7" fill="url(#jg-grass-top)"/>` +
        `<polygon points="0,64 64,0 64,64" fill="url(#jg-dirt)"/>` +
        `<polygon points="0,64 64,0 64,52" fill="rgba(123,89,50,0.25)"/>` +
        `<rect x="2" y="8" width="30" height="3" fill="rgba(30,60,10,0.4)"/>` +
        `<ellipse cx="50" cy="56" rx="10" ry="6" fill="rgba(91,57,4,0.4)"/>` +
        `<ellipse cx="44" cy="48" rx="8" ry="5" fill="rgba(100,70,20,0.3)"/>`,
      ),
    },
    {
      id: 15, name: 'ground-corner-r',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-grass)"/>` +
        `<rect y="0" width="64" height="7" fill="url(#jg-grass-top)"/>` +
        `<polygon points="0,0 64,64 0,64" fill="url(#jg-dirt)"/>` +
        `<polygon points="0,0 64,64 0,52" fill="rgba(123,89,50,0.25)"/>` +
        `<rect x="32" y="8" width="30" height="3" fill="rgba(30,60,10,0.4)"/>` +
        `<ellipse cx="14" cy="56" rx="10" ry="6" fill="rgba(91,57,4,0.4)"/>` +
        `<ellipse cx="20" cy="48" rx="8" ry="5" fill="rgba(100,70,20,0.3)"/>`,
      ),
    },
    {
      id: 16, name: 'grass-detail',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-grass)"/>` +
        `<rect y="0" width="64" height="5" fill="rgba(75,122,51,0.3)"/>` +
        `<circle cx="10" cy="16" r="3" fill="rgba(75,122,51,0.4)"/>` +
        `<circle cx="48" cy="24" r="2.5" fill="rgba(75,122,51,0.35)"/>` +
        `<circle cx="28" cy="40" r="4" fill="rgba(75,122,51,0.3)"/>` +
        `<circle cx="56" cy="10" r="2" fill="rgba(75,122,51,0.25)"/>` +
        `<ellipse cx="16" cy="48" rx="5" ry="3" fill="rgba(90,140,60,0.2)"/>` +
        `<ellipse cx="40" cy="56" rx="6" ry="3" fill="rgba(90,140,60,0.2)"/>` +
        `<ellipse cx="8" cy="32" rx="3" ry="5" fill="rgba(60,100,30,0.35)"/>` +
        `<ellipse cx="54" cy="44" rx="3" ry="4" fill="rgba(60,100,30,0.25)"/>` +
        `<line x1="6" y1="12" x2="14" y2="10" stroke="rgba(100,140,70,0.35)" stroke-width="1.5"/>` +
        `<line x1="42" y1="52" x2="50" y2="50" stroke="rgba(100,140,70,0.3)" stroke-width="1"/>`,
      ),
    },
    {
      id: 17, name: 'mountain-far',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<polygon points="0,64 10,12 24,64" fill="url(#jg-mtn-far)"/>` +
        `<polygon points="0,64 10,12 12,64" fill="rgba(255,255,255,0.05)"/>` +
        `<polygon points="6,16 10,20 6,20 Z" fill="rgba(220,235,245,0.2)"/>` +
        `<polygon points="20,64 34,18 50,64" fill="rgba(26,58,74,0.35)"/>` +
        `<polygon points="28,22 32,28 24,28 Z" fill="rgba(220,235,245,0.15)"/>` +
        `<polygon points="46,64 56,14 64,20 64,64" fill="rgba(26,58,74,0.4)"/>` +
        `<polygon points="50,18 54,26 46,26 Z" fill="rgba(220,235,245,0.2)"/>`,
      ),
    },
    {
      id: 18, name: 'top-grass',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#jg-grass-top)"/>` +
        `<rect y="0" width="64" height="8" fill="#5A9A44"/>` +
        `<rect y="8" width="64" height="3" fill="rgba(61,90,39,0.3)"/>` +
        `<rect x="2" y="14" width="60" height="3" fill="rgba(61,90,39,0.25)"/>` +
        `<rect x="4" y="22" width="24" height="2" fill="rgba(45,74,26,0.25)"/>` +
        `<rect x="34" y="26" width="26" height="2" fill="rgba(45,74,26,0.2)"/>` +
        `<rect x="2" y="34" width="30" height="2" fill="rgba(45,74,26,0.2)"/>` +
        `<rect x="36" y="40" width="24" height="2" fill="rgba(45,74,26,0.15)"/>` +
        `<circle cx="8" cy="4" r="2" fill="rgba(255,255,255,0.15)"/>` +
        `<circle cx="52" cy="5" r="2.5" fill="rgba(255,255,255,0.12)"/>`,
      ),
    },
    {
      id: 19, name: 'sun-rays',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(0,0,0,0)"/>` +
        `<circle cx="32" cy="18" r="16" fill="url(#jg-sun)"/>` +
        `<polygon points="32,18 26,-10 30,-6" fill="rgba(255,228,181,0.1)"/>` +
        `<polygon points="32,18 38,-10 34,-6" fill="rgba(255,228,181,0.08)"/>` +
        `<polygon points="32,18 60,12 56,14" fill="rgba(255,228,181,0.06)"/>` +
        `<polygon points="32,18 4,12 8,14" fill="rgba(255,228,181,0.06)"/>` +
        `<polygon points="32,18 55,50 52,46" fill="rgba(255,228,181,0.05)"/>` +
        `<polygon points="32,18 9,50 12,46" fill="rgba(255,228,181,0.05)"/>`,
      ),
    },
    {
      id: 20, name: 'rock-small',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<ellipse cx="24" cy="50" rx="14" ry="9" fill="url(#jg-rock)"/>` +
        `<ellipse cx="22" cy="48" rx="10" ry="6" fill="url(#jg-rock-round)"/>` +
        `<ellipse cx="46" cy="54" rx="10" ry="6" fill="url(#jg-rock)"/>` +
        `<ellipse cx="44" cy="52" rx="7" ry="4" fill="#7B7B7B"/>` +
        `<ellipse cx="19" cy="46" rx="5" ry="2" fill="rgba(255,255,255,0.12)"/>` +
        `<ellipse cx="42" cy="50" rx="4" ry="1.5" fill="rgba(255,255,255,0.1)"/>` +
        `<line x1="16" y1="56" x2="20" y2="58" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>` +
        `<line x1="40" y1="58" x2="44" y2="60" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>`,
      ),
    },
  ];
}

// ─── VILLAGE TILES ───

function villageTiles(): TileDef[] {
  const G = villageGradients();
  return [
    {
      id: 1, name: 'cobble-ground',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-cobble)"/>` +
        `<rect x="2" y="2" width="17" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="2" y="1" width="17" height="4" fill="rgba(255,255,255,0.12)" rx="2"/>` +
        `<rect x="22" y="3" width="12" height="12" fill="#4A4A4A" rx="2"/>` +
        `<rect x="38" y="2" width="20" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="38" y="1" width="20" height="4" fill="rgba(255,255,255,0.1)" rx="2"/>` +
        `<rect x="6" y="20" width="14" height="14" fill="#4A4A4A" rx="2"/>` +
        `<rect x="24" y="22" width="16" height="12" fill="#6A6A6A" rx="2"/>` +
        `<rect x="24" y="21" width="16" height="4" fill="rgba(255,255,255,0.1)" rx="2"/>` +
        `<rect x="44" y="20" width="14" height="14" fill="#4A4A4A" rx="2"/>` +
        `<rect x="8" y="38" width="18" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="8" y="37" width="18" height="4" fill="rgba(255,255,255,0.1)" rx="2"/>` +
        `<rect x="30" y="40" width="16" height="12" fill="#4A4A4A" rx="2"/>` +
        `<rect x="50" y="38" width="12" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="4" y="56" width="22" height="6" fill="#4A4A4A" rx="2"/>` +
        `<rect x="34" y="58" width="26" height="5" fill="#5A5A5A" rx="2"/>`,
      ),
    },
    {
      id: 2, name: 'road-edge',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-road)"/>` +
        `<rect x="4" y="6" width="12" height="8" fill="rgba(139,114,64,0.4)"/>` +
        `<rect x="36" y="14" width="18" height="10" fill="rgba(139,114,64,0.3)"/>` +
        `<rect x="10" y="30" width="14" height="8" fill="rgba(107,82,16,0.35)"/>` +
        `<rect x="44" y="40" width="12" height="8" fill="rgba(139,114,64,0.3)"/>` +
        `<ellipse cx="50" cy="56" rx="8" ry="4" fill="rgba(107,82,16,0.3)"/>` +
        `<line x1="4" y1="2" x2="56" y2="2" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>` +
        `<line x1="24" y1="20" x2="48" y2="20" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>`,
      ),
    },
    {
      id: 3, name: 'wood-plank-h',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#3A2510"/>` +
        `<rect y="0" width="64" height="10" fill="url(#vg-wood-h)"/>` +
        `<rect y="0" width="64" height="3" fill="rgba(255,255,255,0.1)"/>` +
        `<rect y="12" width="64" height="10" fill="url(#vg-wood-h)"/>` +
        `<rect y="12" width="64" height="3" fill="rgba(255,255,255,0.08)"/>` +
        `<rect y="24" width="64" height="10" fill="url(#vg-wood-h)"/>` +
        `<rect y="24" width="64" height="3" fill="rgba(255,255,255,0.1)"/>` +
        `<rect y="36" width="64" height="10" fill="url(#vg-wood-h)"/>` +
        `<rect y="36" width="64" height="3" fill="rgba(255,255,255,0.08)"/>` +
        `<rect y="48" width="64" height="10" fill="url(#vg-wood-h)"/>` +
        `<rect y="48" width="64" height="3" fill="rgba(255,255,255,0.06)"/>` +
        `<line x1="0" y1="10" x2="64" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
        `<line x1="0" y1="22" x2="64" y2="22" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
        `<line x1="0" y1="34" x2="64" y2="34" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
        `<line x1="0" y1="46" x2="64" y2="46" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
        `<circle cx="8" cy="5" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="56" cy="5" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="8" cy="17" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="56" cy="17" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="8" cy="41" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="56" cy="41" r="1.5" fill="rgba(0,0,0,0.2)"/>`,
      ),
    },
    {
      id: 4, name: 'wood-plank-v',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#3A2510"/>` +
        `<rect x="0" y="0" width="10" height="64" fill="url(#vg-wood-v)"/>` +
        `<rect x="0" y="0" width="3" height="64" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="12" y="0" width="10" height="64" fill="url(#vg-wood-v)"/>` +
        `<rect x="12" y="0" width="3" height="64" fill="rgba(255,255,255,0.06)"/>` +
        `<rect x="24" y="0" width="10" height="64" fill="url(#vg-wood-v)"/>` +
        `<rect x="24" y="0" width="3" height="64" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="36" y="0" width="10" height="64" fill="url(#vg-wood-v)"/>` +
        `<rect x="36" y="0" width="3" height="64" fill="rgba(255,255,255,0.06)"/>` +
        `<rect x="48" y="0" width="10" height="64" fill="url(#vg-wood-v)"/>` +
        `<rect x="48" y="0" width="3" height="64" fill="rgba(255,255,255,0.05)"/>` +
        `<line x1="10" y1="0" x2="10" y2="64" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>` +
        `<line x1="22" y1="0" x2="22" y2="64" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>` +
        `<line x1="34" y1="0" x2="34" y2="64" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>` +
        `<line x1="46" y1="0" x2="46" y2="64" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>` +
        `<circle cx="5" cy="8" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="5" cy="56" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="17" cy="24" r="1.5" fill="rgba(0,0,0,0.2)"/>` +
        `<circle cx="17" cy="40" r="1.5" fill="rgba(0,0,0,0.2)"/>`,
      ),
    },
    {
      id: 5, name: 'house-wall',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-wall)"/>` +
        `<rect y="0" width="64" height="4" fill="rgba(184,152,114,0.6)"/>` +
        `<rect y="16" width="64" height="4" fill="rgba(184,152,114,0.4)"/>` +
        `<rect y="32" width="64" height="4" fill="rgba(184,152,114,0.4)"/>` +
        `<rect y="48" width="64" height="4" fill="rgba(184,152,114,0.4)"/>` +
        `<rect x="16" y="4" width="4" height="12" fill="rgba(184,152,114,0.5)"/>` +
        `<rect x="44" y="4" width="4" height="12" fill="rgba(184,152,114,0.5)"/>` +
        `<circle cx="10" cy="8" r="2" fill="rgba(255,255,255,0.12)"/>` +
        `<circle cx="50" cy="24" r="2" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="14" cy="42" r="1.5" fill="rgba(255,255,255,0.08)"/>` +
        `<circle cx="54" cy="56" r="2" fill="rgba(255,255,255,0.1)"/>` +
        `<line x1="0" y1="4" x2="64" y2="4" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>` +
        `<line x1="0" y1="20" x2="64" y2="20" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`,
      ),
    },
    {
      id: 6, name: 'house-roof',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-roof)"/>` +
        `<polygon points="0,10 32,-8 64,10" fill="url(#vg-roof)"/>` +
        `<polygon points="0,10 32,-8 16,6" fill="rgba(180,60,45,0.4)"/>` +
        `<rect x="0" y="14" width="64" height="5" fill="rgba(139,42,26,0.5)"/>` +
        `<rect x="0" y="10" width="64" height="3" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="4" y="22" width="56" height="3" fill="rgba(120,40,20,0.4)"/>` +
        `<rect x="2" y="30" width="60" height="3" fill="rgba(120,40,20,0.3)"/>` +
        `<line x1="32" y1="-8" x2="32" y2="10" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>`,
      ),
    },
    {
      id: 7, name: 'window',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-wall)"/>` +
        `<rect x="12" y="10" width="40" height="44" fill="#3A5070" rx="2"/>` +
        `<rect x="12" y="10" width="40" height="44" fill="url(#vg-wood-v)" opacity="0.3" rx="2"/>` +
        `<rect x="12" y="10" width="40" height="44" fill="none" stroke="#8B6B4A" stroke-width="3" rx="2"/>` +
        `<rect x="30" y="10" width="4" height="44" fill="#8B6B4A"/>` +
        `<rect x="30" y="10" width="2" height="44" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="12" y="30" width="40" height="4" fill="#8B6B4A"/>` +
        `<rect x="12" y="30" width="40" height="2" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="16" y="14" width="10" height="12" fill="rgba(106,170,238,0.2)"/>` +
        `<rect x="36" y="14" width="12" height="12" fill="rgba(106,170,238,0.2)"/>` +
        `<polygon points="16,14 21,10 26,14" fill="rgba(255,255,255,0.4)"/>` +
        `<polygon points="36,14 42,10 48,14" fill="rgba(255,255,255,0.35)"/>`,
      ),
    },
    {
      id: 8, name: 'door',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-wall)"/>` +
        `<rect x="8" y="4" width="48" height="56" fill="url(#vg-wood-v)" rx="3"/>` +
        `<rect x="10" y="6" width="22" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="10" y="5" width="22" height="4" fill="rgba(255,255,255,0.1)" rx="1"/>` +
        `<rect x="34" y="6" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="34" y="5" width="20" height="4" fill="rgba(255,255,255,0.1)" rx="1"/>` +
        `<rect x="10" y="34" width="22" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="10" y="33" width="22" height="4" fill="rgba(255,255,255,0.08)" rx="1"/>` +
        `<rect x="34" y="34" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="34" y="33" width="20" height="4" fill="rgba(255,255,255,0.08)" rx="1"/>` +
        `<circle cx="40" cy="32" r="4" fill="url(#vg-straw)"/>` +
        `<circle cx="40" cy="31" r="2" fill="rgba(255,255,255,0.3)"/>` +
        `<line x1="8" y1="4" x2="8" y2="60" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>`,
      ),
    },
    {
      id: 9, name: 'fence-h',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="0" y="16" width="64" height="6" fill="url(#vg-fence)"/>` +
        `<rect x="0" y="16" width="64" height="2" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="2" y="14" width="5" height="28" fill="url(#vg-fence)"/>` +
        `<rect x="2" y="14" width="2" height="28" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="16" y="14" width="5" height="28" fill="url(#vg-fence)"/>` +
        `<rect x="30" y="14" width="5" height="28" fill="url(#vg-fence)"/>` +
        `<rect x="44" y="14" width="5" height="28" fill="url(#vg-fence)"/>` +
        `<rect x="58" y="14" width="5" height="28" fill="url(#vg-fence)"/>` +
        `<rect x="0" y="36" width="64" height="6" fill="url(#vg-fence)"/>` +
        `<rect x="0" y="36" width="64" height="2" fill="rgba(255,255,255,0.07)"/>` +
        `<circle cx="4" cy="12" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="18" cy="12" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="32" cy="12" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="46" cy="12" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="60" cy="12" r="2" fill="rgba(150,120,80,0.4)"/>`,
      ),
    },
    {
      id: 10, name: 'fence-v',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(0,0,0,0)"/>` +
        `<rect x="8" y="0" width="7" height="64" fill="url(#vg-fence)"/>` +
        `<rect x="8" y="0" width="3" height="64" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="28" y="0" width="7" height="64" fill="url(#vg-fence)"/>` +
        `<rect x="28" y="0" width="3" height="64" fill="rgba(255,255,255,0.06)"/>` +
        `<rect x="50" y="0" width="7" height="64" fill="url(#vg-fence)"/>` +
        `<rect x="50" y="0" width="3" height="64" fill="rgba(255,255,255,0.06)"/>` +
        `<circle cx="11" cy="6" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="31" cy="6" r="2" fill="rgba(150,120,80,0.4)"/>` +
        `<circle cx="53" cy="6" r="2" fill="rgba(150,120,80,0.4)"/>`,
      ),
    },
    {
      id: 11, name: 'sky-village',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-sky)"/>` +
        `<circle cx="14" cy="10" r="1.2" fill="rgba(255,255,255,0.2)"/>` +
        `<circle cx="48" cy="6" r="1" fill="rgba(255,255,255,0.18)"/>` +
        `<circle cx="10" cy="26" r="0.8" fill="rgba(255,255,255,0.12)"/>` +
        `<circle cx="56" cy="18" r="1.2" fill="rgba(255,255,255,0.15)"/>` +
        `<circle cx="32" cy="4" r="0.8" fill="rgba(255,255,255,0.22)"/>` +
        `<circle cx="58" cy="34" r="0.8" fill="rgba(255,255,255,0.1)"/>`,
      ),
    },
    {
      id: 12, name: 'hills',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<ellipse cx="32" cy="52" rx="42" ry="24" fill="url(#vg-hills)"/>` +
        `<ellipse cx="18" cy="54" rx="24" ry="18" fill="#5A6A4A"/>` +
        `<ellipse cx="18" cy="50" rx="18" ry="12" fill="rgba(130,160,110,0.2)"/>` +
        `<ellipse cx="52" cy="56" rx="20" ry="14" fill="#3A4A2A"/>` +
        `<ellipse cx="52" cy="52" rx="14" ry="8" fill="rgba(100,130,80,0.2)"/>` +
        `<circle cx="14" cy="44" r="2" fill="rgba(100,130,80,0.4)"/>` +
        `<circle cx="30" cy="38" r="2" fill="rgba(100,130,80,0.3)"/>` +
        `<circle cx="50" cy="46" r="2" fill="rgba(100,130,80,0.35)"/>`,
      ),
    },
    {
      id: 13, name: 'chimney',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="18" y="0" width="28" height="48" fill="url(#vg-chimney)"/>` +
        `<rect x="16" y="0" width="32" height="6" fill="#7B4A3A"/>` +
        `<rect x="16" y="0" width="32" height="3" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="16" y="48" width="32" height="6" fill="#7B4A3A"/>` +
        `<rect x="16" y="48" width="32" height="3" fill="rgba(0,0,0,0.15)"/>` +
        `<line x1="22" y1="6" x2="22" y2="48" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>` +
        `<line x1="32" y1="6" x2="32" y2="48" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>` +
        `<line x1="42" y1="6" x2="42" y2="48" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>` +
        `<circle cx="32" cy="16" r="8" fill="rgba(170,170,170,0.2)"/>` +
        `<circle cx="30" cy="10" r="6" fill="rgba(180,180,180,0.15)"/>` +
        `<circle cx="34" cy="6" r="4" fill="rgba(200,200,200,0.12)"/>`,
      ),
    },
    {
      id: 14, name: 'straw-bale',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="8" y="20" width="48" height="38" fill="url(#vg-straw)" rx="4"/>` +
        `<rect x="8" y="20" width="48" height="6" fill="rgba(255,240,180,0.25)" rx="4"/>` +
        `<line x1="10" y1="26" x2="54" y2="26" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="30" x2="54" y2="30" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="34" x2="54" y2="34" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="38" x2="54" y2="38" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="42" x2="54" y2="42" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="46" x2="54" y2="46" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<line x1="10" y1="50" x2="54" y2="50" stroke="rgba(160,136,48,0.3)" stroke-width="1"/>` +
        `<rect x="8" y="54" width="48" height="4" fill="rgba(0,0,0,0.15)" rx="2"/>`,
      ),
    },
    emptyTile(15, 'empty-village'),
    {
      id: 16, name: 'roof-corner',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<polygon points="0,10 32,-8 64,10" fill="url(#vg-roof)"/>` +
        `<polygon points="0,10 32,-8 16,6" fill="rgba(160,50,35,0.4)"/>` +
        `<polygon points="46,4 64,10 52,8" fill="rgba(0,0,0,0.15)"/>` +
        `<line x1="32" y1="-8" x2="32" y2="10" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>`,
      ),
    },
    {
      id: 17, name: 'market-canopy',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="0" y="6" width="64" height="20" fill="url(#vg-canopy)" rx="2"/>` +
        `<rect x="0" y="6" width="64" height="4" fill="rgba(255,255,255,0.12)" rx="2"/>` +
        `<polygon points="0,6 14,-6 32,6" fill="#DD9944"/>` +
        `<polygon points="0,6 14,-6 18,6" fill="rgba(255,255,255,0.08)"/>` +
        `<polygon points="32,6 46,-6 64,6" fill="#DD9944"/>` +
        `<polygon points="32,6 46,-6 50,6" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="4" y="10" width="56" height="3" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="4" y="16" width="56" height="3" fill="rgba(255,255,255,0.06)"/>` +
        `<rect x="8" y="22" width="48" height="3" fill="rgba(0,0,0,0.1)"/>` +
        `<line x1="14" y1="-6" x2="14" y2="6" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>` +
        `<line x1="46" y1="-6" x2="46" y2="6" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>`,
      ),
    },
    {
      id: 18, name: 'market-counter',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect x="4" y="24" width="56" height="8" fill="#8B6B3A" rx="1"/>` +
        `<rect x="4" y="24" width="56" height="3" fill="rgba(255,255,255,0.12)" rx="1"/>` +
        `<rect x="6" y="32" width="52" height="28" fill="url(#vg-wood-v)"/>` +
        `<rect x="6" y="32" width="52" height="3" fill="rgba(255,255,255,0.06)"/>` +
        `<circle cx="16" cy="18" r="4" fill="#D44A2A"/>` +
        `<circle cx="16" cy="17" r="2" fill="rgba(255,255,255,0.3)"/>` +
        `<circle cx="38" cy="16" r="5" fill="#4A8A44"/>` +
        `<circle cx="38" cy="15" r="2.5" fill="rgba(255,255,255,0.25)"/>` +
        `<circle cx="52" cy="19" r="3" fill="#D4A800"/>` +
        `<circle cx="52" cy="18" r="1.5" fill="rgba(255,255,255,0.3)"/>`,
      ),
    },
    {
      id: 19, name: 'road-corner-l',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-cobble)"/>` +
        `<polygon points="0,64 64,0 64,64" fill="url(#vg-road)"/>` +
        `<polygon points="0,64 64,0 64,48" fill="rgba(139,114,64,0.2)"/>` +
        `<ellipse cx="46" cy="50" rx="10" ry="6" fill="rgba(107,82,16,0.3)"/>` +
        `<ellipse cx="54" cy="60" rx="8" ry="4" fill="rgba(107,82,16,0.25)"/>`,
      ),
    },
    {
      id: 20, name: 'road-corner-r',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#vg-cobble)"/>` +
        `<polygon points="0,0 64,64 0,64" fill="url(#vg-road)"/>` +
        `<polygon points="0,0 64,64 0,48" fill="rgba(139,114,64,0.2)"/>` +
        `<ellipse cx="18" cy="50" rx="10" ry="6" fill="rgba(107,82,16,0.3)"/>` +
        `<ellipse cx="10" cy="60" rx="8" ry="4" fill="rgba(107,82,16,0.25)"/>`,
      ),
    },
  ];
}

// ─── PALACE TILES ───

function palaceTiles(): TileDef[] {
  const G = palaceGradients();
  return [
    {
      id: 1, name: 'marble-floor',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-marble)"/>` +
        `<rect x="2" y="2" width="28" height="28" fill="#D8D0C0"/>` +
        `<rect x="2" y="2" width="28" height="4" fill="rgba(255,255,255,0.12)"/>` +
        `<rect x="34" y="2" width="28" height="28" fill="#E8E0D0"/>` +
        `<rect x="34" y="2" width="28" height="4" fill="rgba(255,255,255,0.15)"/>` +
        `<rect x="2" y="34" width="28" height="28" fill="#E8E0D0"/>` +
        `<rect x="2" y="34" width="28" height="4" fill="rgba(255,255,255,0.12)"/>` +
        `<rect x="34" y="34" width="28" height="28" fill="#D8D0C0"/>` +
        `<rect x="30" y="0" width="4" height="64" fill="rgba(200,192,176,0.4)"/>` +
        `<rect x="0" y="30" width="64" height="4" fill="rgba(200,192,176,0.4)"/>` +
        `<path d="M6 10 Q12 12 10 16 Q14 20 8 22" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.8"/>` +
        `<path d="M38 38 Q44 40 40 44 Q48 48 42 50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.8"/>` +
        `<circle cx="14" cy="14" r="1" fill="rgba(255,255,255,0.2)"/>` +
        `<circle cx="48" cy="48" r="1.5" fill="rgba(255,255,255,0.15)"/>`,
      ),
    },
    {
      id: 2, name: 'pillar-shaft',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="url(#pg-pillar)" rx="3"/>` +
        `<line x1="16" y1="0" x2="16" y2="64" stroke="rgba(200,192,176,0.3)" stroke-width="1"/>` +
        `<line x1="22" y1="0" x2="22" y2="64" stroke="rgba(200,192,176,0.25)" stroke-width="1"/>` +
        `<line x1="30" y1="0" x2="30" y2="64" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>` +
        `<line x1="34" y1="0" x2="34" y2="64" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>` +
        `<line x1="40" y1="0" x2="40" y2="64" stroke="rgba(200,192,176,0.25)" stroke-width="1"/>` +
        `<line x1="46" y1="0" x2="46" y2="64" stroke="rgba(200,192,176,0.3)" stroke-width="1"/>` +
        `<rect x="16" y="12" width="32" height="2" fill="rgba(200,192,176,0.25)"/>` +
        `<rect x="16" y="28" width="32" height="2" fill="rgba(200,192,176,0.25)"/>` +
        `<rect x="16" y="44" width="32" height="2" fill="rgba(200,192,176,0.25)"/>` +
        `<rect x="16" y="60" width="32" height="2" fill="rgba(200,192,176,0.25)"/>`,
      ),
    },
    {
      id: 3, name: 'pillar-capital',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="8" y="0" width="48" height="16" fill="url(#pg-gold)" rx="5"/>` +
        `<rect x="8" y="0" width="48" height="6" fill="rgba(255,255,255,0.3)" rx="5"/>` +
        `<rect x="6" y="8" width="52" height="4" fill="url(#pg-gold)" rx="2"/>` +
        `<polygon points="8,12 14,8 20,12" fill="url(#pg-gold)"/>` +
        `<polygon points="44,12 50,8 56,12" fill="url(#pg-gold)"/>` +
        `<rect x="12" y="16" width="40" height="6" fill="#E8E0D0" rx="2"/>` +
        `<rect x="12" y="16" width="40" height="3" fill="rgba(255,255,255,0.2)" rx="2"/>` +
        `<rect x="14" y="22" width="36" height="4" fill="rgba(255,215,0,0.25)"/>` +
        `<circle cx="32" cy="4" r="3" fill="rgba(255,255,255,0.3)"/>`,
      ),
    },
    {
      id: 4, name: 'pillar-base',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="6" y="44" width="52" height="20" fill="#D8C8A8" rx="4"/>` +
        `<rect x="6" y="44" width="52" height="6" fill="rgba(255,255,255,0.2)" rx="4"/>` +
        `<rect x="4" y="40" width="56" height="6" fill="url(#pg-gold)" rx="2"/>` +
        `<rect x="4" y="40" width="56" height="3" fill="rgba(255,255,255,0.25)" rx="2"/>` +
        `<rect x="8" y="50" width="48" height="4" fill="rgba(200,184,152,0.4)"/>` +
        `<rect x="10" y="56" width="44" height="6" fill="rgba(0,0,0,0.08)" rx="2"/>`,
      ),
    },
    {
      id: 5, name: 'stone-wall',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-stone)"/>` +
        `<rect x="2" y="2" width="28" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="2" y="2" width="28" height="3" fill="rgba(255,255,255,0.08)" rx="1"/>` +
        `<rect x="34" y="4" width="18" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="6" y="20" width="22" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="32" y="22" width="28" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="32" y="22" width="28" height="3" fill="rgba(255,255,255,0.06)" rx="1"/>` +
        `<rect x="4" y="38" width="18" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="4" y="38" width="18" height="3" fill="rgba(255,255,255,0.07)" rx="1"/>` +
        `<rect x="26" y="40" width="34" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="8" y="56" width="26" height="7" fill="#5A5A6A" rx="1"/>` +
        `<line x1="2" y1="2" x2="30" y2="2" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>` +
        `<line x1="32" y1="22" x2="60" y2="22" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>`,
      ),
    },
    {
      id: 6, name: 'carpet-red',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-marble)"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="url(#pg-carpet)"/>` +
        `<rect x="14" y="0" width="36" height="64" fill="rgba(155,42,58,0.4)"/>` +
        `<rect x="16" y="10" width="32" height="4" fill="rgba(212,168,0,0.35)"/>` +
        `<rect x="16" y="26" width="32" height="4" fill="rgba(212,168,0,0.35)"/>` +
        `<rect x="16" y="42" width="32" height="4" fill="rgba(212,168,0,0.35)"/>` +
        `<rect x="16" y="58" width="32" height="4" fill="rgba(212,168,0,0.35)"/>` +
        `<circle cx="24" cy="16" r="1.5" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="40" cy="32" r="1.5" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="24" cy="48" r="1.5" fill="rgba(255,255,255,0.1)"/>`,
      ),
    },
    {
      id: 7, name: 'curtain',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#3A1040"/>` +
        `<rect x="2" y="0" width="30" height="64" fill="url(#pg-curtain)" rx="2"/>` +
        `<rect x="32" y="0" width="30" height="64" fill="url(#pg-curtain)" rx="2"/>` +
        `<line x1="17" y1="0" x2="17" y2="64" stroke="rgba(80,50,90,0.3)" stroke-width="2"/>` +
        `<line x1="47" y1="0" x2="47" y2="64" stroke="rgba(80,50,90,0.3)" stroke-width="2"/>` +
        `<rect x="0" y="0" width="64" height="4" fill="rgba(0,0,0,0.2)"/>` +
        `<rect x="0" y="60" width="64" height="4" fill="rgba(0,0,0,0.15)"/>`,
      ),
    },
    {
      id: 8, name: 'candle',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(10,10,30,0)"/>` +
        `<circle cx="32" cy="40" r="18" fill="url(#pg-candle-glow)"/>` +
        `<ellipse cx="32" cy="32" rx="4" ry="10" fill="#FFAA00"/>` +
        `<ellipse cx="32" cy="30" rx="2" ry="6" fill="#FFDD44"/>` +
        `<ellipse cx="31" cy="28" rx="1" ry="3" fill="rgba(255,255,255,0.6)"/>` +
        `<rect x="30" y="42" width="4" height="10" fill="#D4A800"/>` +
        `<rect x="30" y="42" width="2" height="10" fill="rgba(255,255,255,0.2)"/>` +
        `<rect x="28" y="52" width="8" height="8" fill="#B88800" rx="1"/>` +
        `<rect x="28" y="52" width="8" height="3" fill="rgba(255,255,255,0.15)" rx="1"/>` +
        `<path d="M30 46 Q28 48 30 50" fill="none" stroke="rgba(180,130,0,0.4)" stroke-width="1"/>`,
      ),
    },
    {
      id: 9, name: 'sky-palace',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-sky)"/>` +
        `<circle cx="12" cy="8" r="1.2" fill="rgba(255,255,255,0.2)"/>` +
        `<circle cx="52" cy="12" r="1" fill="rgba(255,255,255,0.18)"/>` +
        `<circle cx="32" cy="4" r="1.5" fill="rgba(255,255,255,0.25)"/>` +
        `<circle cx="8" cy="22" r="0.8" fill="rgba(255,255,255,0.12)"/>` +
        `<circle cx="58" cy="20" r="1" fill="rgba(255,255,255,0.15)"/>` +
        `<circle cx="18" cy="34" r="0.8" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="48" cy="38" r="1" fill="rgba(255,255,255,0.13)"/>` +
        `<circle cx="38" cy="16" r="0.6" fill="rgba(255,255,255,0.15)"/>`,
      ),
    },
    {
      id: 10, name: 'star',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(10,10,36,0)"/>` +
        `<circle cx="20" cy="16" r="2" fill="rgba(255,255,255,0.55)"/>` +
        `<circle cx="20" cy="16" r="3.5" fill="rgba(255,255,255,0.12)"/>` +
        `<circle cx="48" cy="28" r="1.5" fill="rgba(255,255,255,0.45)"/>` +
        `<circle cx="12" cy="42" r="1.8" fill="rgba(255,255,255,0.4)"/>` +
        `<circle cx="12" cy="42" r="3" fill="rgba(255,255,255,0.1)"/>` +
        `<circle cx="56" cy="12" r="1.5" fill="rgba(255,255,255,0.5)"/>` +
        `<circle cx="36" cy="50" r="1.2" fill="rgba(255,255,255,0.35)"/>` +
        `<line x1="18" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>` +
        `<line x1="20" y1="14" x2="20" y2="18" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>` +
        `<line x1="54" y1="12" x2="58" y2="12" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>` +
        `<line x1="56" y1="10" x2="56" y2="14" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>`,
      ),
    },
    {
      id: 11, name: 'moon',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(10,10,36,0)"/>` +
        `<circle cx="45" cy="16" r="18" fill="url(#pg-moon-glow)"/>` +
        `<circle cx="45" cy="16" r="12" fill="rgba(200,200,255,0.35)"/>` +
        `<circle cx="43" cy="14" r="11" fill="rgba(10,10,36,0.85)"/>` +
        `<circle cx="46" cy="12" r="8" fill="rgba(220,220,255,0.2)"/>` +
        `<circle cx="42" cy="20" r="2.5" fill="rgba(180,180,220,0.15)"/>` +
        `<circle cx="50" cy="18" r="1.5" fill="rgba(180,180,220,0.12)"/>` +
        `<circle cx="44" cy="10" r="2" fill="rgba(180,180,220,0.1)"/>`,
      ),
    },
    {
      id: 12, name: 'palace-far',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<polygon points="0,64 16,20 32,64" fill="rgba(58,58,90,0.35)"/>` +
        `<polygon points="0,64 16,20 20,64" fill="rgba(80,80,110,0.15)"/>` +
        `<polygon points="28,64 44,18 64,64" fill="rgba(58,58,90,0.3)"/>` +
        `<polygon points="28,64 44,18 48,64" fill="rgba(80,80,110,0.12)"/>` +
        `<rect x="14" y="56" width="4" height="8" fill="rgba(74,74,106,0.25)"/>` +
        `<rect x="42" y="50" width="4" height="14" fill="rgba(74,74,106,0.25)"/>` +
        `<circle cx="22" cy="28" r="2" fill="rgba(255,200,0,0.2)"/>` +
        `<circle cx="50" cy="26" r="2.5" fill="rgba(255,200,0,0.18)"/>` +
        `<polygon points="14,20 18,26 12,26 Z" fill="rgba(200,180,255,0.15)"/>` +
        `<polygon points="40,20 44,26 36,26 Z" fill="rgba(200,180,255,0.12)"/>`,
      ),
    },
    {
      id: 13, name: 'marble-platform',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#C8C0B0"/>` +
        `<rect y="0" width="64" height="8" fill="url(#pg-marble)"/>` +
        `<rect y="0" width="64" height="3" fill="rgba(255,255,255,0.15)"/>` +
        `<rect x="4" y="14" width="18" height="3" fill="rgba(216,208,192,0.35)"/>` +
        `<rect x="36" y="24" width="22" height="3" fill="rgba(216,208,192,0.3)"/>` +
        `<rect x="10" y="38" width="20" height="3" fill="rgba(184,176,160,0.25)"/>` +
        `<rect x="40" y="48" width="18" height="3" fill="rgba(184,176,160,0.2)"/>` +
        `<path d="M12 6 Q16 8 14 10" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>` +
        `<path d="M48 4 Q52 6 50 8" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>`,
      ),
    },
    {
      id: 14, name: 'gold-trim',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect y="0" width="64" height="8" fill="url(#pg-gold)"/>` +
        `<rect y="0" width="64" height="3" fill="rgba(255,255,255,0.3)"/>` +
        `<rect y="56" width="64" height="8" fill="url(#pg-gold)"/>` +
        `<rect y="56" width="64" height="3" fill="rgba(255,255,255,0.25)"/>` +
        `<rect y="56" width="64" height="1" fill="rgba(0,0,0,0.15)"/>` +
        `<circle cx="16" cy="4" r="2" fill="rgba(255,50,50,0.4)"/>` +
        `<circle cx="32" cy="4" r="2" fill="rgba(50,150,255,0.4)"/>` +
        `<circle cx="48" cy="4" r="2" fill="rgba(50,255,100,0.4)"/>` +
        `<circle cx="16" cy="60" r="2" fill="rgba(255,50,50,0.35)"/>` +
        `<circle cx="32" cy="60" r="2" fill="rgba(50,150,255,0.35)"/>` +
        `<circle cx="48" cy="60" r="2" fill="rgba(50,255,100,0.35)"/>`,
      ),
    },
    emptyTile(15, 'empty-palace'),
    {
      id: 16, name: 'pillar-mid',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="url(#pg-pillar-simple)" rx="2"/>` +
        `<line x1="18" y1="0" x2="18" y2="64" stroke="rgba(200,192,176,0.2)" stroke-width="1"/>` +
        `<line x1="28" y1="0" x2="28" y2="64" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>` +
        `<line x1="36" y1="0" x2="36" y2="64" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>` +
        `<line x1="44" y1="0" x2="44" y2="64" stroke="rgba(200,192,176,0.2)" stroke-width="1"/>`,
      ),
    },
    {
      id: 17, name: 'marble-dark',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-marble-dark)"/>` +
        `<rect x="2" y="2" width="28" height="28" fill="#B8B0A0"/>` +
        `<rect x="2" y="2" width="28" height="4" fill="rgba(255,255,255,0.08)"/>` +
        `<rect x="34" y="2" width="28" height="28" fill="#C8C0B0"/>` +
        `<rect x="34" y="2" width="28" height="4" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="2" y="34" width="28" height="28" fill="#C8C0B0"/>` +
        `<rect x="34" y="34" width="28" height="28" fill="#B8B0A0"/>` +
        `<rect x="30" y="0" width="4" height="64" fill="rgba(168,160,144,0.3)"/>` +
        `<rect x="0" y="30" width="64" height="4" fill="rgba(168,160,144,0.3)"/>` +
        `<path d="M10 40 Q14 42 12 46" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.7"/>`,
      ),
    },
    {
      id: 18, name: 'rug-edge',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="url(#pg-marble)"/>` +
        `<rect x="0" y="0" width="64" height="8" fill="url(#pg-carpet)"/>` +
        `<rect x="0" y="0" width="64" height="3" fill="rgba(255,255,255,0.15)"/>` +
        `<rect x="0" y="0" width="64" height="1" fill="rgba(212,168,0,0.4)"/>` +
        `<line x1="0" y1="4" x2="64" y2="4" stroke="rgba(212,168,0,0.3)" stroke-width="0.5"/>` +
        `<line x1="0" y1="7" x2="64" y2="7" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>`,
      ),
    },
    {
      id: 19, name: 'throne',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="rgba(10,10,30,0)"/>` +
        `<rect x="4" y="8" width="56" height="14" fill="url(#pg-gold)" rx="3"/>` +
        `<rect x="4" y="8" width="56" height="5" fill="rgba(255,255,255,0.35)" rx="3"/>` +
        `<circle cx="14" cy="15" r="4" fill="url(#pg-gold)"/>` +
        `<circle cx="50" cy="15" r="4" fill="url(#pg-gold)"/>` +
        `<circle cx="12" cy="14" r="2" fill="rgba(255,255,255,0.4)"/>` +
        `<circle cx="48" cy="14" r="2" fill="rgba(255,255,255,0.4)"/>` +
        `<rect x="14" y="22" width="36" height="38" fill="url(#pg-throne-velvet)" rx="2"/>` +
        `<rect x="16" y="24" width="32" height="4" fill="rgba(255,255,255,0.1)"/>` +
        `<rect x="18" y="32" width="28" height="14" fill="rgba(255,215,0,0.15)"/>` +
        `<rect x="10" y="24" width="8" height="34" fill="url(#pg-gold-h)" rx="2"/>` +
        `<rect x="46" y="24" width="8" height="34" fill="url(#pg-gold-h)" rx="2"/>` +
        `<rect x="10" y="56" width="8" height="4" fill="rgba(0,0,0,0.15)" rx="1"/>` +
        `<rect x="46" y="56" width="8" height="4" fill="rgba(0,0,0,0.15)" rx="1"/>`,
      ),
    },
    {
      id: 20, name: 'platform-marble',
      svg: makeTile(
        `<defs>${G}</defs>` +
        `<rect width="64" height="64" fill="#D0C8B8"/>` +
        `<rect y="0" width="64" height="6" fill="url(#pg-marble)"/>` +
        `<rect y="0" width="64" height="2" fill="rgba(255,255,255,0.2)"/>` +
        `<rect x="4" y="12" width="20" height="3" fill="rgba(192,184,168,0.35)"/>` +
        `<rect x="34" y="24" width="24" height="3" fill="rgba(192,184,168,0.3)"/>` +
        `<rect x="10" y="40" width="26" height="3" fill="rgba(180,172,156,0.25)"/>` +
        `<rect x="44" y="50" width="14" height="3" fill="rgba(180,172,156,0.2)"/>`,
      ),
    },
  ];
}

// ─── Composition ───

function getWorldName(worldNum: number): string {
  return worldNum === 1 ? 'jungle' : worldNum === 2 ? 'village' : 'palace';
}

function getTiles(worldNum: number): TileDef[] {
  if (worldNum === 1) return jungleTiles();
  if (worldNum === 2) return villageTiles();
  return palaceTiles();
}

async function composeTileset(worldNum: number): Promise<string> {
  const tiles = getTiles(worldNum);
  const worldName = getWorldName(worldNum);
  const outPath = resolve(OUTPUT_DIR, `${worldName}-tiles.png`);

  const canvasW = COLS * TILE;
  const canvasH = ROWS * TILE;
  const canvas = Buffer.alloc(canvasW * canvasH * 4, 0);

  for (const tile of tiles) {
    if (
      !tile.svg.includes('rect') &&
      !tile.svg.includes('ellipse') &&
      !tile.svg.includes('circle') &&
      !tile.svg.includes('polygon') &&
      !tile.svg.includes('path') &&
      !tile.svg.includes('line')
    ) {
      continue;
    }
    const gid = tile.id;
    const idx = gid - 1;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const ox = col * TILE;
    const oy = row * TILE;

    const tileBuf = await sharp(Buffer.from(tile.svg))
      .resize(TILE, TILE)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { data, info } = tileBuf;
    for (let y = 0; y < TILE; y++) {
      const dstRow = (oy + y) * canvasW * 4;
      const srcRow = y * TILE * 4;
      for (let x = 0; x < TILE * 4; x++) {
        canvas[dstRow + ox * 4 + x] = (data as Buffer)[srcRow + x];
      }
    }
    console.log(`  [${worldName}] tile ${tile.id}: ${tile.name}`);
  }

  await sharp(canvas, {
    raw: { width: canvasW, height: canvasH, channels: 4 },
  })
    .png()
    .toFile(outPath);

  console.log(`\n  → ${outPath} (${canvasW}×${canvasH})\n`);
  return worldName;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Generating tileset spritesheets for tilemap...\n');

  for (let w = 1; w <= 3; w++) {
    const name = await composeTileset(w);
    console.log(`  ✓ ${name}-tiles.png\n`);
  }

  console.log('All tileset spritesheets generated!');
}

main().catch(console.error);
