import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/tilesets');
const TILE = 64;
const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;

interface TileDef {
  id: number;
  name: string;
  svg: string;
}

function makeTile(svg: string): string {
  return `<svg width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
}

// ─── JUNGLE TILES ───
function jungleTiles(): TileDef[] {
  const tiles: TileDef[] = [
    {
      id: 1, name: 'grass-ground',
      svg: makeTile(
        `<rect width="64" height="64" fill="#3D5A27"/>` +
        `<rect y="0" width="64" height="7" fill="#4B7A33"/>` +
        `<rect x="2" y="8" width="60" height="3" fill="#2D4A1A"/>` +
        `<rect x="6" y="18" width="14" height="2" fill="#4B7A33" opacity="0.5"/>` +
        `<rect x="28" y="24" width="18" height="2" fill="#4B7A33" opacity="0.4"/>` +
        `<rect x="10" y="38" width="12" height="2" fill="#355A20" opacity="0.5"/>` +
        `<rect x="36" y="44" width="10" height="2" fill="#355A20" opacity="0.4"/>` +
        `<rect x="50" y="22" width="8" height="2" fill="#4B7A33" opacity="0.3"/>`
      ),
    },
    {
      id: 2, name: 'dirt-ground',
      svg: makeTile(
        `<rect width="64" height="64" fill="#6B4922"/>` +
        `<rect x="4" y="4" width="16" height="10" fill="#7B5932" opacity="0.5"/>` +
        `<rect x="36" y="14" width="14" height="8" fill="#5B3904" opacity="0.4"/>` +
        `<rect x="10" y="30" width="12" height="10" fill="#7B5932" opacity="0.3"/>` +
        `<rect x="42" y="38" width="16" height="6" fill="#5B3904" opacity="0.4"/>` +
        `<rect x="18" y="48" width="14" height="8" fill="#7B5932" opacity="0.3"/>`
      ),
    },
    {
      id: 3, name: 'grass-platform',
      svg: makeTile(
        `<rect width="64" height="64" fill="#4A3520"/>` +
        `<rect y="0" width="64" height="6" fill="#4B7A33"/>` +
        `<rect x="2" y="6" width="60" height="2" fill="#3D5A27"/>` +
        `<rect x="8" y="16" width="16" height="3" fill="#5B4530" opacity="0.5"/>` +
        `<rect x="38" y="28" width="14" height="3" fill="#5B4530" opacity="0.4"/>` +
        `<rect x="14" y="42" width="20" height="3" fill="#3A2510" opacity="0.4"/>` +
        `<rect x="44" y="50" width="10" height="3" fill="#3A2510" opacity="0.3"/>` +
        `<circle cx="10" cy="16" r="3" fill="#4B7A33" opacity="0.6"/>` +
        `<circle cx="48" cy="10" r="2" fill="#4B7A33" opacity="0.5"/>`
      ),
    },
    {
      id: 4, name: 'rock-boulder',
      svg: makeTile(
        `<ellipse cx="30" cy="38" rx="22" ry="18" fill="#6B6B6B"/>` +
        `<ellipse cx="28" cy="35" rx="18" ry="14" fill="#7B7B7B"/>` +
        `<ellipse cx="22" cy="30" rx="8" ry="6" fill="#8B8B8B" opacity="0.5"/>` +
        `<rect x="16" y="28" width="6" height="3" fill="#5B5B5B" opacity="0.4"/>` +
        `<rect x="36" y="34" width="8" height="3" fill="#5B5B5B" opacity="0.4"/>`
      ),
    },
    {
      id: 5, name: 'bush',
      svg: makeTile(
        `<ellipse cx="32" cy="42" rx="24" ry="16" fill="#2D5A27"/>` +
        `<ellipse cx="24" cy="42" rx="16" ry="14" fill="#3D7A37"/>` +
        `<ellipse cx="40" cy="44" rx="14" ry="12" fill="#3D6A30"/>` +
        `<ellipse cx="32" cy="34" rx="10" ry="8" fill="#4A8A44"/>` +
        `<circle cx="28" cy="32" r="2" fill="#5AAA50" opacity="0.5"/>` +
        `<circle cx="40" cy="36" r="2" fill="#5AAA50" opacity="0.4"/>`
      ),
    },
    {
      id: 6, name: 'vine',
      svg: makeTile(
        `<rect x="30" y="0" width="4" height="64" fill="#3D5A27" rx="2"/>` +
        `<rect x="28" y="4" width="8" height="3" fill="#4B7A33" rx="1"/>` +
        `<rect x="30" y="18" width="8" height="3" fill="#4B7A33" rx="1"/>` +
        `<rect x="26" y="32" width="8" height="3" fill="#4B7A33" rx="1"/>` +
        `<rect x="30" y="46" width="8" height="3" fill="#4B7A33" rx="1"/>`
      ),
    },
    {
      id: 7, name: 'flower',
      svg: makeTile(
        `<circle cx="32" cy="44" r="6" fill="#FF6B9D"/>` +
        `<circle cx="24" cy="40" r="5" fill="#FF8FB3"/>` +
        `<circle cx="40" cy="40" r="5" fill="#FF8FB3"/>` +
        `<circle cx="28" cy="34" r="5" fill="#FF8FB3"/>` +
        `<circle cx="36" cy="34" r="5" fill="#FF8FB3"/>` +
        `<circle cx="32" cy="40" r="4" fill="#FFD700"/>` +
        `<rect x="31" y="50" width="2" height="14" fill="#2D5A27"/>`
      ),
    },
    {
      id: 8, name: 'tree-trunk',
      svg: makeTile(
        `<rect x="22" y="0" width="20" height="64" fill="#5B3520"/>` +
        `<rect x="24" y="0" width="16" height="64" fill="#6B4520" opacity="0.6"/>` +
        `<rect x="22" y="10" width="20" height="3" fill="#4A2A15" opacity="0.4"/>` +
        `<rect x="22" y="30" width="20" height="3" fill="#4A2A15" opacity="0.4"/>` +
        `<rect x="22" y="50" width="20" height="3" fill="#4A2A15" opacity="0.4"/>`
      ),
    },
    {
      id: 9, name: 'sky',
      svg: makeTile(
        `<rect width="64" height="64" fill="#1B3A5C"/>` +
        `<rect y="0" width="64" height="16" fill="#264A7C" opacity="0.6"/>`
      ),
    },
    {
      id: 10, name: 'cloud',
      svg: makeTile(
        `<ellipse cx="32" cy="30" rx="18" ry="10" fill="#FFFFFF" opacity="0.3"/>` +
        `<ellipse cx="22" cy="32" rx="12" ry="8" fill="#FFFFFF" opacity="0.25"/>` +
        `<ellipse cx="44" cy="28" rx="14" ry="9" fill="#FFFFFF" opacity="0.22"/>`
      ),
    },
    {
      id: 11, name: 'mountain',
      svg: makeTile(
        `<polygon points="0,64 16,8 32,64" fill="#2D4A5A"/>` +
        `<polygon points="28,64 48,20 64,10 64,64" fill="#1D3A4A"/>` +
        `<polygon points="10,64 24,20 38,64" fill="#3D5A6A" opacity="0.6"/>`
      ),
    },
    {
      id: 12, name: 'grass-tuft',
      svg: makeTile(
        `<polygon points="20,64 24,40 28,64" fill="#3D5A27"/>` +
        `<polygon points="14,64 18,48 22,64" fill="#4B7A33"/>` +
        `<polygon points="26,64 30,44 34,64" fill="#3D6A30"/>` +
        `<polygon points="34,64 38,50 42,64" fill="#4B7A33"/>` +
        `<polygon points="40,64 44,45 48,64" fill="#2D5A27"/>`
      ),
    },
    {
      id: 13, name: 'empty',
      svg: makeTile(''), // transparent
    },
    {
      id: 14, name: 'ground-corner-l',
      svg: makeTile(
        `<rect width="64" height="64" fill="#2D5A27"/>` +
        `<rect y="0" width="64" height="7" fill="#4B7A33"/>` +
        `<polygon points="0,64 64,0 64,64" fill="#6B4922"/>` +
        `<rect x="2" y="8" width="30" height="3" fill="#2D4A1A" opacity="0.6"/>`
      ),
    },
    {
      id: 15, name: 'ground-corner-r',
      svg: makeTile(
        `<rect width="64" height="64" fill="#2D5A27"/>` +
        `<rect y="0" width="64" height="7" fill="#4B7A33"/>` +
        `<polygon points="0,0 64,64 0,64" fill="#6B4922"/>` +
        `<rect x="32" y="8" width="30" height="3" fill="#2D4A1A" opacity="0.6"/>`
      ),
    },
    {
      id: 16, name: 'grass-detail',
      svg: makeTile(
        `<rect width="64" height="64" fill="#3D5A27"/>` +
        `<circle cx="12" cy="20" r="4" fill="#4B7A33" opacity="0.4"/>` +
        `<circle cx="48" cy="30" r="3" fill="#4B7A33" opacity="0.3"/>` +
        `<circle cx="28" cy="44" r="5" fill="#4B7A33" opacity="0.35"/>` +
        `<rect x="6" y="10" width="8" height="2" fill="#355A20" opacity="0.5"/>` +
        `<rect x="42" y="50" width="14" height="2" fill="#355A20" opacity="0.4"/>`
      ),
    },
    {
      id: 17, name: 'mountain-far',
      svg: makeTile(
        `<polygon points="0,64 10,12 24,64" fill="#1A3A4A" opacity="0.5"/>` +
        `<polygon points="20,64 34,18 50,64" fill="#1A3A4A" opacity="0.4"/>` +
        `<polygon points="46,64 56,14 64,20 64,64" fill="#1A3A4A" opacity="0.45"/>`
      ),
    },
    {
      id: 18, name: 'top-grass',
      svg: makeTile(
        `<rect width="64" height="64" fill="#4B7A33"/>` +
        `<rect y="0" width="64" height="8" fill="#5A9A44"/>` +
        `<rect x="4" y="12" width="56" height="4" fill="#3D5A27" opacity="0.4"/>` +
        `<rect x="2" y="20" width="30" height="3" fill="#2D4A1A" opacity="0.3"/>` +
        `<rect x="36" y="24" width="24" height="3" fill="#2D4A1A" opacity="0.3"/>`
      ),
    },
    {
      id: 19, name: 'sun-rays',
      svg: makeTile(
        `<circle cx="32" cy="18" r="14" fill="#FFE4B5" opacity="0.15"/>` +
        `<circle cx="32" cy="18" r="8" fill="#FFD700" opacity="0.1"/>`
      ),
    },
    {
      id: 20, name: 'rock-small',
      svg: makeTile(
        `<ellipse cx="26" cy="50" rx="12" ry="8" fill="#7B7B7B"/>` +
        `<ellipse cx="24" cy="48" rx="9" ry="6" fill="#8B8B8B"/>` +
        `<ellipse cx="44" cy="54" rx="8" ry="5" fill="#6B6B6B"/>` +
        `<ellipse cx="43" cy="52" rx="6" ry="4" fill="#7B7B7B"/>`
      ),
    },
  ];
  return tiles;
}

// ─── VILLAGE TILES ───
function villageTiles(): TileDef[] {
  const tiles: TileDef[] = [
    {
      id: 1, name: 'cobble-ground',
      svg: makeTile(
        `<rect width="64" height="64" fill="#5A5A5A"/>` +
        `<rect x="2" y="2" width="16" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="20" y="4" width="12" height="12" fill="#4A4A4A" rx="2"/>` +
        `<rect x="36" y="2" width="18" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="6" y="20" width="14" height="14" fill="#4A4A4A" rx="2"/>` +
        `<rect x="24" y="22" width="16" height="12" fill="#6A6A6A" rx="2"/>` +
        `<rect x="44" y="20" width="14" height="14" fill="#4A4A4A" rx="2"/>` +
        `<rect x="8" y="38" width="18" height="14" fill="#6A6A6A" rx="2"/>` +
        `<rect x="30" y="40" width="16" height="12" fill="#4A4A4A" rx="2"/>` +
        `<rect x="48" y="38" width="12" height="14" fill="#6A6A6A" rx="2"/>`
      ),
    },
    {
      id: 2, name: 'road-edge',
      svg: makeTile(
        `<rect width="64" height="64" fill="#7B6230"/>` +
        `<rect x="4" y="4" width="12" height="8" fill="#8B7240" opacity="0.5"/>` +
        `<rect x="36" y="16" width="18" height="10" fill="#8B7240" opacity="0.4"/>` +
        `<rect x="10" y="32" width="14" height="8" fill="#6B5210" opacity="0.3"/>` +
        `<rect x="44" y="42" width="12" height="8" fill="#8B7240" opacity="0.4"/>`
      ),
    },
    {
      id: 3, name: 'wood-plank-h',
      svg: makeTile(
        `<rect width="64" height="64" fill="#3A2510"/>` +
        `<rect y="0" width="64" height="8" fill="#6B4520" rx="1"/>` +
        `<rect x="2" y="0" width="60" height="8" fill="#8B6B4A" opacity="0.4"/>` +
        `<rect y="12" width="64" height="8" fill="#5B3515" rx="1"/>` +
        `<rect y="24" width="64" height="8" fill="#6B4520" rx="1"/>` +
        `<rect y="36" width="64" height="8" fill="#5B3515" rx="1"/>` +
        `<rect y="48" width="64" height="8" fill="#6B4520" rx="1"/>`
      ),
    },
    {
      id: 4, name: 'wood-plank-v',
      svg: makeTile(
        `<rect width="64" height="64" fill="#3A2510"/>` +
        `<rect x="0" y="0" width="8" height="64" fill="#6B4520" rx="1"/>` +
        `<rect x="12" y="0" width="8" height="64" fill="#5B3515" rx="1"/>` +
        `<rect x="24" y="0" width="8" height="64" fill="#6B4520" rx="1"/>` +
        `<rect x="36" y="0" width="8" height="64" fill="#5B3515" rx="1"/>` +
        `<rect x="48" y="0" width="8" height="64" fill="#6B4520" rx="1"/>`
      ),
    },
    {
      id: 5, name: 'house-wall',
      svg: makeTile(
        `<rect width="64" height="64" fill="#C4A882"/>` +
        `<rect x="0" y="0" width="64" height="4" fill="#B89872"/>` +
        `<rect x="0" y="16" width="64" height="4" fill="#B89872"/>` +
        `<rect x="0" y="32" width="64" height="4" fill="#B89872"/>` +
        `<rect x="0" y="48" width="64" height="4" fill="#B89872"/>` +
        `<rect x="16" y="4" width="4" height="12" fill="#B89872"/>` +
        `<rect x="44" y="4" width="4" height="12" fill="#B89872"/>`
      ),
    },
    {
      id: 6, name: 'house-roof',
      svg: makeTile(
        `<rect width="64" height="64" fill="#9B3A2A"/>` +
        `<polygon points="0,10 32,-8 64,10" fill="#C44A3A"/>` +
        `<rect x="8" y="14" width="48" height="5" fill="#8B2A1A"/>` +
        `<rect x="0" y="14" width="8" height="5" fill="#9B3A2A"/>` +
        `<rect x="56" y="14" width="8" height="5" fill="#9B3A2A"/>`
      ),
    },
    {
      id: 7, name: 'window',
      svg: makeTile(
        `<rect width="64" height="64" fill="#C4A882"/>` +
        `<rect x="12" y="10" width="40" height="44" fill="#3A5070" rx="2"/>` +
        `<rect x="12" y="10" width="40" height="44" fill="none" stroke="#8B6B4A" stroke-width="3" rx="2"/>` +
        `<rect x="30" y="10" width="4" height="44" fill="#8B6B4A"/>` +
        `<rect x="12" y="30" width="40" height="4" fill="#8B6B4A"/>` +
        `<rect x="16" y="14" width="10" height="12" fill="#6AAAEE" opacity="0.3"/>` +
        `<rect x="36" y="14" width="12" height="12" fill="#6AAAEE" opacity="0.3"/>`
      ),
    },
    {
      id: 8, name: 'door',
      svg: makeTile(
        `<rect width="64" height="64" fill="#C4A882"/>` +
        `<rect x="8" y="4" width="48" height="56" fill="#6B3520" rx="3"/>` +
        `<rect x="10" y="6" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="34" y="6" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="10" y="34" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<rect x="34" y="34" width="20" height="24" fill="#7B4520" rx="1"/>` +
        `<circle cx="40" cy="32" r="3" fill="#FFD700"/>`
      ),
    },
    {
      id: 9, name: 'fence-h',
      svg: makeTile(
        `<rect x="0" y="16" width="64" height="6" fill="#6B4520"/>` +
        `<rect x="2" y="14" width="4" height="28" fill="#8B6B4A"/>` +
        `<rect x="16" y="14" width="4" height="28" fill="#8B6B4A"/>` +
        `<rect x="30" y="14" width="4" height="28" fill="#8B6B4A"/>` +
        `<rect x="44" y="14" width="4" height="28" fill="#8B6B4A"/>` +
        `<rect x="58" y="14" width="4" height="28" fill="#8B6B4A"/>` +
        `<rect x="0" y="36" width="64" height="6" fill="#6B4520"/>`
      ),
    },
    {
      id: 10, name: 'fence-v',
      svg: makeTile(
        `<rect width="64" height="64" fill="#8B6B4A"/>` +
        `<rect x="8" y="0" width="6" height="64" fill="#6B4520"/>` +
        `<rect x="28" y="0" width="6" height="64" fill="#6B4520"/>` +
        `<rect x="50" y="0" width="6" height="64" fill="#6B4520"/>`
      ),
    },
    {
      id: 11, name: 'sky-village',
      svg: makeTile(
        `<rect width="64" height="64" fill="#3D3060"/>` +
        `<rect y="0" width="64" height="18" fill="#4D4070" opacity="0.5"/>` +
        `<rect y="0" width="64" height="8" fill="#6D5080" opacity="0.3"/>`
      ),
    },
    {
      id: 12, name: 'hills',
      svg: makeTile(
        `<ellipse cx="32" cy="50" rx="40" ry="24" fill="#4A5A3A"/>` +
        `<ellipse cx="18" cy="52" rx="22" ry="18" fill="#5A6A4A"/>` +
        `<ellipse cx="50" cy="54" rx="18" ry="14" fill="#3A4A2A"/>`
      ),
    },
    {
      id: 13, name: 'chimney',
      svg: makeTile(
        `<rect x="18" y="0" width="28" height="48" fill="#6B3A2A"/>` +
        `<rect x="16" y="0" width="32" height="6" fill="#7B4A3A"/>` +
        `<rect x="16" y="48" width="32" height="6" fill="#7B4A3A"/>` +
        `<circle cx="32" cy="16" r="8" fill="#AAAAAA" opacity="0.2"/>` +
        `<circle cx="28" cy="12" r="6" fill="#BBBBBB" opacity="0.15"/>`
      ),
    },
    {
      id: 14, name: 'straw-bale',
      svg: makeTile(
        `<rect x="10" y="20" width="44" height="36" fill="#C4A840" rx="4"/>` +
        `<rect x="12" y="24" width="40" height="4" fill="#D4B850" opacity="0.6"/>` +
        `<rect x="12" y="32" width="40" height="4" fill="#D4B850" opacity="0.6"/>` +
        `<rect x="12" y="40" width="40" height="4" fill="#D4B850" opacity="0.6"/>` +
        `<rect x="12" y="48" width="40" height="4" fill="#D4B850" opacity="0.6"/>`
      ),
    },
    {
      id: 15, name: 'empty-village',
      svg: makeTile(''),
    },
    {
      id: 16, name: 'roof-corner',
      svg: makeTile(
        `<polygon points="0,10 32,-8 64,10" fill="#C44A3A"/>` +
        `<polygon points="0,10 32,-8 16,4" fill="#B43A2A"/>`
      ),
    },
    {
      id: 17, name: 'market-canopy',
      svg: makeTile(
        `<rect x="0" y="4" width="64" height="20" fill="#CC8833" rx="2"/>` +
        `<polygon points="0,4 16,-6 32,4" fill="#DD9944"/>` +
        `<polygon points="32,4 48,-6 64,4" fill="#DD9944"/>` +
        `<rect x="2" y="8" width="60" height="4" fill="#DDA84A" opacity="0.5"/>`
      ),
    },
    {
      id: 18, name: 'market-counter',
      svg: makeTile(
        `<rect x="4" y="24" width="56" height="8" fill="#8B6B3A" rx="1"/>` +
        `<rect x="6" y="32" width="52" height="28" fill="#6B4B20"/>` +
        `<rect x="4" y="24" width="56" height="4" fill="#9B7B4A" opacity="0.5"/>`
      ),
    },
    {
      id: 19, name: 'road-corner-l',
      svg: makeTile(
        `<rect width="64" height="64" fill="#5A5A5A"/>` +
        `<polygon points="0,64 64,0 64,64" fill="#7B6230"/>`
      ),
    },
    {
      id: 20, name: 'road-corner-r',
      svg: makeTile(
        `<rect width="64" height="64" fill="#5A5A5A"/>` +
        `<polygon points="0,0 64,64 0,64" fill="#7B6230"/>`
      ),
    },
  ];
  return tiles;
}

// ─── PALACE TILES ───
function palaceTiles(): TileDef[] {
  const tiles: TileDef[] = [
    {
      id: 1, name: 'marble-floor',
      svg: makeTile(
        `<rect width="64" height="64" fill="#E0D8C8"/>` +
        `<rect x="2" y="2" width="28" height="28" fill="#D8D0C0"/>` +
        `<rect x="34" y="2" width="28" height="28" fill="#E8E0D0"/>` +
        `<rect x="2" y="34" width="28" height="28" fill="#E8E0D0"/>` +
        `<rect x="34" y="34" width="28" height="28" fill="#D8D0C0"/>` +
        `<rect x="30" y="0" width="4" height="64" fill="#C8C0B0" opacity="0.5"/>` +
        `<rect x="0" y="30" width="64" height="4" fill="#C8C0B0" opacity="0.5"/>`
      ),
    },
    {
      id: 2, name: 'pillar-shaft',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="#E8E0D0" rx="3"/>` +
        `<rect x="14" y="0" width="36" height="64" fill="#F0E8D8" opacity="0.6"/>` +
        `<rect x="20" y="8" width="24" height="2" fill="#D0C8B8" opacity="0.4"/>` +
        `<rect x="20" y="24" width="24" height="2" fill="#D0C8B8" opacity="0.4"/>` +
        `<rect x="20" y="40" width="24" height="2" fill="#D0C8B8" opacity="0.4"/>` +
        `<rect x="20" y="56" width="24" height="2" fill="#D0C8B8" opacity="0.4"/>`
      ),
    },
    {
      id: 3, name: 'pillar-capital',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="8" y="0" width="48" height="14" fill="#FFD700" rx="4"/>` +
        `<rect x="10" y="2" width="44" height="10" fill="#FFE44D" opacity="0.5"/>` +
        `<rect x="12" y="14" width="40" height="6" fill="#E8E0D0" rx="2"/>` +
        `<rect x="14" y="20" width="36" height="4" fill="#FFD700" opacity="0.3"/>`
      ),
    },
    {
      id: 4, name: 'pillar-base',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="6" y="44" width="52" height="20" fill="#D8C8A8" rx="4"/>` +
        `<rect x="8" y="46" width="48" height="6" fill="#E8D8B8" opacity="0.5"/>` +
        `<rect x="4" y="40" width="56" height="6" fill="#FFD700" rx="2"/>` +
        `<rect x="10" y="52" width="44" height="4" fill="#C8B898" opacity="0.4"/>`
      ),
    },
    {
      id: 5, name: 'stone-wall',
      svg: makeTile(
        `<rect width="64" height="64" fill="#4A4A5A"/>` +
        `<rect x="2" y="2" width="28" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="34" y="4" width="18" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="6" y="20" width="22" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="32" y="22" width="28" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="4" y="38" width="18" height="14" fill="#5A5A6A" rx="1"/>` +
        `<rect x="26" y="40" width="34" height="14" fill="#4A4A5A" rx="1"/>` +
        `<rect x="8" y="56" width="26" height="7" fill="#5A5A6A" rx="1"/>`
      ),
    },
    {
      id: 6, name: 'carpet-red',
      svg: makeTile(
        `<rect width="64" height="64" fill="#E0D8C8"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="#8B1A2A"/>` +
        `<rect x="14" y="0" width="36" height="64" fill="#9B2A3A" opacity="0.6"/>` +
        `<rect x="16" y="12" width="32" height="4" fill="#D4A800" opacity="0.5"/>` +
        `<rect x="16" y="28" width="32" height="4" fill="#D4A800" opacity="0.5"/>` +
        `<rect x="16" y="44" width="32" height="4" fill="#D4A800" opacity="0.5"/>`
      ),
    },
    {
      id: 7, name: 'curtain',
      svg: makeTile(
        `<rect width="64" height="64" fill="#5A2060"/>` +
        `<rect x="4" y="0" width="28" height="64" fill="#6A3070" rx="2"/>` +
        `<rect x="32" y="0" width="28" height="64" fill="#5A2060" rx="2"/>` +
        `<line x1="18" y1="0" x2="18" y2="64" stroke="#7A4070" stroke-width="2" opacity="0.4"/>` +
        `<line x1="46" y1="0" x2="46" y2="64" stroke="#4A1050" stroke-width="2" opacity="0.4"/>`
      ),
    },
    {
      id: 8, name: 'candle',
      svg: makeTile(
        `<rect width="64" height="64" fill="#0A0A1E" opacity="0"/>` +
        `<ellipse cx="32" cy="44" rx="6" ry="4" fill="#FFD700" opacity="0.15"/>` +
        `<ellipse cx="32" cy="36" rx="4" ry="8" fill="#FFAA00" opacity="0.2"/>` +
        `<ellipse cx="32" cy="30" rx="2" ry="4" fill="#FFDD44" opacity="0.3"/>` +
        `<rect x="30" y="48" width="4" height="8" fill="#D4A800"/>` +
        `<rect x="28" y="56" width="8" height="6" fill="#B88800" rx="1"/>`
      ),
    },
    {
      id: 9, name: 'sky-palace',
      svg: makeTile(
        `<rect width="64" height="64" fill="#0A0A24"/>` +
        `<rect y="0" width="64" height="12" fill="#141438" opacity="0.5"/>`
      ),
    },
    {
      id: 10, name: 'star',
      svg: makeTile(
        `<rect width="64" height="64" fill="#0A0A24" opacity="0"/>` +
        `<circle cx="20" cy="16" r="1.5" fill="#FFFFFF" opacity="0.6"/>` +
        `<circle cx="48" cy="28" r="1" fill="#FFFFFF" opacity="0.5"/>` +
        `<circle cx="12" cy="42" r="1.5" fill="#FFFFFF" opacity="0.4"/>` +
        `<circle cx="56" cy="12" r="1" fill="#FFFFFF" opacity="0.5"/>` +
        `<circle cx="36" cy="50" r="1" fill="#FFFFFF" opacity="0.3"/>`
      ),
    },
    {
      id: 11, name: 'moon',
      svg: makeTile(
        `<rect width="64" height="64" fill="#0A0A24" opacity="0"/>` +
        `<circle cx="48" cy="16" r="12" fill="#CCCCFF" opacity="0.3"/>` +
        `<circle cx="44" cy="14" r="10" fill="#0A0A24"/>`
      ),
    },
    {
      id: 12, name: 'palace-far',
      svg: makeTile(
        `<polygon points="0,64 16,20 32,64" fill="#3A3A5A" opacity="0.4"/>` +
        `<polygon points="28,64 44,18 64,64" fill="#3A3A5A" opacity="0.35"/>` +
        `<rect x="14" y="56" width="4" height="8" fill="#4A4A6A" opacity="0.3"/>` +
        `<rect x="42" y="50" width="4" height="14" fill="#4A4A6A" opacity="0.3"/>`
      ),
    },
    {
      id: 13, name: 'marble-platform',
      svg: makeTile(
        `<rect width="64" height="64" fill="#C8C0B0"/>` +
        `<rect y="0" width="64" height="8" fill="#E0D8C8"/>` +
        `<rect x="2" y="2" width="60" height="4" fill="#F0E8D8" opacity="0.5"/>` +
        `<rect x="8" y="16" width="16" height="4" fill="#D8D0C0" opacity="0.4"/>` +
        `<rect x="40" y="30" width="18" height="4" fill="#D8D0C0" opacity="0.4"/>` +
        `<rect x="16" y="46" width="20" height="4" fill="#B8B0A0" opacity="0.3"/>`
      ),
    },
    {
      id: 14, name: 'gold-trim',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect y="0" width="64" height="6" fill="#FFD700"/>` +
        `<rect x="2" y="1" width="60" height="4" fill="#FFE44D" opacity="0.6"/>` +
        `<rect y="56" width="64" height="8" fill="#FFD700"/>` +
        `<rect x="2" y="57" width="60" height="5" fill="#FFE44D" opacity="0.6"/>`
      ),
    },
    {
      id: 15, name: 'empty-palace',
      svg: makeTile(''),
    },
    {
      id: 16, name: 'pillar-mid',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0D0D0"/>` +
        `<rect x="12" y="0" width="40" height="64" fill="#E8E0D0" rx="2"/>` +
        `<rect x="14" y="0" width="36" height="64" fill="#F0E8D8" opacity="0.6"/>`
      ),
    },
    {
      id: 17, name: 'marble-dark',
      svg: makeTile(
        `<rect width="64" height="64" fill="#C8C0B0"/>` +
        `<rect x="2" y="2" width="28" height="28" fill="#B8B0A0"/>` +
        `<rect x="34" y="2" width="28" height="28" fill="#C8C0B0"/>` +
        `<rect x="2" y="34" width="28" height="28" fill="#C8C0B0"/>` +
        `<rect x="34" y="34" width="28" height="28" fill="#B8B0A0"/>`
      ),
    },
    {
      id: 18, name: 'rug-edge',
      svg: makeTile(
        `<rect width="64" height="64" fill="#E0D8C8"/>` +
        `<rect x="0" y="0" width="64" height="6" fill="#8B1A2A"/>` +
        `<rect x="0" y="0" width="64" height="3" fill="#D4A800" opacity="0.6"/>`
      ),
    },
    {
      id: 19, name: 'throne',
      svg: makeTile(
        `<rect width="64" height="64" fill="#0A0A1E" opacity="0"/>` +
        `<rect x="8" y="8" width="48" height="10" fill="#FFD700" rx="2"/>` +
        `<rect x="6" y="6" width="52" height="6" fill="#FFE44D" opacity="0.5" rx="2"/>` +
        `<rect x="14" y="18" width="36" height="40" fill="#6B2020" rx="2"/>` +
        `<rect x="16" y="20" width="32" height="36" fill="#8B3030" rx="1"/>` +
        `<rect x="20" y="30" width="24" height="14" fill="#FFD700" opacity="0.2"/>`
      ),
    },
    {
      id: 20, name: 'platform-marble',
      svg: makeTile(
        `<rect width="64" height="64" fill="#D0C8B8"/>` +
        `<rect y="0" width="64" height="6" fill="#E0D8C8"/>` +
        `<rect x="4" y="14" width="20" height="4" fill="#C0B8A8" opacity="0.4"/>` +
        `<rect x="36" y="28" width="18" height="4" fill="#C0B8A8" opacity="0.4"/>` +
        `<rect x="12" y="44" width="26" height="4" fill="#C0B8A8" opacity="0.3"/>`
      ),
    },
  ];
  return tiles;
}

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

  // Create full canvas: COLS × ROWS of TILE×TILE
  const canvasW = COLS * TILE;
  const canvasH = ROWS * TILE;
  const canvas = Buffer.alloc(canvasW * canvasH * 4, 0);

  for (const tile of tiles) {
    if (!tile.svg.includes('rect') && !tile.svg.includes('ellipse') &&
        !tile.svg.includes('circle') && !tile.svg.includes('polygon') &&
        !tile.svg.includes('line')) {
      continue; // skip empty tiles
    }
    const gid = tile.id; // 1-based
    const idx = gid - 1;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const ox = col * TILE;
    const oy = row * TILE;

    const tileBuf = await sharp(Buffer.from(tile.svg)).resize(TILE, TILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
  }).png().toFile(outPath);

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
