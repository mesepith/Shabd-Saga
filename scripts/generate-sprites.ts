import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../public/assets/sprites');
const SIZE = 64;
const BOSS_SIZE = 128;

function generateSprite(type: string, color: string, shape: string, size: number = SIZE): string {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${shape}
  </svg>`;
}

async function generateSprites() {
  console.log('Generating sprite placeholders...\n');

  const sprites: Array<{ category: string; name: string; color: string; shape: string; size?: number }> = [
    // Player sprites — idle
    {
      category: 'player',
      name: 'idle',
      color: '#E8750A',
      shape: `<rect x="12" y="8" width="40" height="48" rx="12" fill="#E8750A"/><circle cx="32" cy="20" r="14" fill="#E8750A"/><circle cx="24" cy="16" r="4" fill="white"/><circle cx="40" cy="16" r="4" fill="white"/><circle cx="26" cy="15" r="2" fill="black"/><circle cx="42" cy="15" r="2" fill="black"/><rect x="24" y="28" width="8" height="20" rx="4" fill="#FFd700"/><polygon points="8,20 16,12 16,28" fill="#E8750A"/><polygon points="56,20 48,12 48,28" fill="#E8750A"/>`,
    },
    // Player sprites — run frames
    {
      category: 'player',
      name: 'run-frame-0',
      color: '#E8750A',
      shape: `<rect x="12" y="6" width="42" height="50" rx="12" fill="#E8750A"/><circle cx="33" cy="19" r="14" fill="#E8750A"/><circle cx="24" cy="15" r="4" fill="white"/><circle cx="42" cy="15" r="4" fill="white"/><circle cx="26" cy="14" r="2" fill="black"/><circle cx="44" cy="14" r="2" fill="black"/><rect x="26" y="28" width="8" height="18" rx="4" fill="#FFd700"/><polygon points="8,19 18,11 18,27" fill="#E8750A"/><polygon points="58,19 48,11 48,27" fill="#E8750A"/><rect x="16" y="48" width="10" height="14" rx="5" fill="#CC6600"/><rect x="42" y="42" width="10" height="14" rx="5" fill="#CC6600"/>`,
    },
    {
      category: 'player',
      name: 'run-frame-1',
      color: '#E8750A',
      shape: `<rect x="12" y="4" width="40" height="52" rx="12" fill="#E8750A"/><circle cx="32" cy="17" r="14" fill="#E8750A"/><circle cx="24" cy="13" r="4" fill="white"/><circle cx="40" cy="13" r="4" fill="white"/><circle cx="26" cy="12" r="2" fill="black"/><circle cx="42" cy="12" r="2" fill="black"/><rect x="24" y="26" width="8" height="20" rx="4" fill="#FFd700"/><polygon points="8,18 16,10 16,26" fill="#E8750A"/><polygon points="56,18 48,10 48,26" fill="#E8750A"/><rect x="10" y="44" width="12" height="14" rx="6" fill="#CC6600"/><rect x="46" y="48" width="12" height="14" rx="6" fill="#CC6600"/>`,
    },
    {
      category: 'player',
      name: 'run-frame-2',
      color: '#E8750A',
      shape: `<rect x="10" y="6" width="44" height="50" rx="12" fill="#E8750A"/><circle cx="32" cy="19" r="14" fill="#E8750A"/><circle cx="24" cy="15" r="4" fill="white"/><circle cx="40" cy="15" r="4" fill="white"/><circle cx="26" cy="14" r="2" fill="black"/><circle cx="42" cy="14" r="2" fill="black"/><rect x="24" y="28" width="8" height="18" rx="4" fill="#FFd700"/><polygon points="6,19 14,11 14,27" fill="#E8750A"/><polygon points="58,19 50,11 50,27" fill="#E8750A"/><rect x="42" y="48" width="10" height="14" rx="5" fill="#CC6600"/><rect x="16" y="42" width="10" height="14" rx="5" fill="#CC6600"/>`,
    },
    {
      category: 'player',
      name: 'run-frame-3',
      color: '#E8750A',
      shape: `<rect x="12" y="4" width="40" height="52" rx="12" fill="#E8750A"/><circle cx="32" cy="17" r="14" fill="#E8750A"/><circle cx="24" cy="13" r="4" fill="white"/><circle cx="40" cy="13" r="4" fill="white"/><circle cx="26" cy="12" r="2" fill="black"/><circle cx="42" cy="12" r="2" fill="black"/><rect x="24" y="26" width="8" height="20" rx="4" fill="#FFd700"/><polygon points="8,18 16,10 16,26" fill="#E8750A"/><polygon points="56,18 48,10 48,26" fill="#E8750A"/><rect x="14" y="44" width="12" height="14" rx="6" fill="#CC6600"/><rect x="40" y="48" width="12" height="14" rx="6" fill="#CC6600"/>`,
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
    // ── Jungle Boss (128×128, 6 frames) — Shadow Demon ──
    ...Array.from({ length: 6 }, (_, i) => {
      const bodyW = [68, 72, 70, 68, 66, 64][i];
      const bodyH = [76, 80, 78, 76, 74, 72][i];
      const bodyY = [56, 54, 55, 56, 57, 58][i];
      const glowR = [46, 52, 49, 46, 43, 40][i];
      const eyeR = [7, 8, 8, 7, 6, 6][i];
      const pupilH = [3.5, 4, 4, 3.5, 3, 3][i];
      const armAngle = [-12, -18, -15, -8, -3, 0][i];
      const tendrilSway = [0, 4, 3, 0, -3, -4][i];
      return {
        category: 'boss',
        name: `boss-jungle-idle-${i}`,
        color: '#2a8a1a',
        size: BOSS_SIZE,
        shape: `<defs>
  <radialGradient id="ja${i}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22FF22" stop-opacity="0.35"/>
    <stop offset="40%" stop-color="#11AA11" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="#22FF22" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="jb${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#3a8a1a"/>
    <stop offset="30%" stop-color="#2a6a10"/>
    <stop offset="70%" stop-color="#1a4a08"/>
    <stop offset="100%" stop-color="#0a2202"/>
  </linearGradient>
  <linearGradient id="jl${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#5ac840"/>
    <stop offset="100%" stop-color="#3a8a1a"/>
  </linearGradient>
</defs>
<circle cx="64" cy="64" r="${glowR}" fill="url(#ja${i})"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2 + 2}" ry="${bodyH / 2 + 2}" fill="#55FF33" opacity="0.08"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="url(#jb${i})"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="none" stroke="#55CC33" stroke-width="1.5" opacity="0.4"/>
<ellipse cx="64" cy="${bodyY - 2}" rx="${bodyW / 2 - 8}" ry="${bodyH / 2 - 2}" fill="#44AA22" opacity="0.4"/>
<polygon points="${32 - tendrilSway * 0.5},${26 + tendrilSway * 0.5} ${10},${14 + tendrilSway} ${38 - tendrilSway * 0.5},${22 + tendrilSway * 0.5}" fill="url(#jl${i})"/>
<polygon points="${96 + tendrilSway * 0.5},${26 + tendrilSway * 0.5} ${118},${14 + tendrilSway} ${90 + tendrilSway * 0.5},${22 + tendrilSway * 0.5}" fill="url(#jl${i})"/>
<polygon points="40,${36 + tendrilSway * 0.5} 24,${28 + tendrilSway} 44,${32 + tendrilSway * 0.5}" fill="#3a8a1a"/>
<polygon points="88,${36 + tendrilSway * 0.5} 104,${28 + tendrilSway} 84,${32 + tendrilSway * 0.5}" fill="#3a8a1a"/>
<polygon points="${28 - tendrilSway * 0.5},${38 + tendrilSway * 0.5} ${14},${32 + tendrilSway} ${34 - tendrilSway * 0.5},${36 + tendrilSway * 0.5}" fill="#2a6a10"/>
<polygon points="${100 + tendrilSway * 0.5},${38 + tendrilSway * 0.5} ${114},${32 + tendrilSway} ${94 + tendrilSway * 0.5},${36 + tendrilSway * 0.5}" fill="#2a6a10"/>
<ellipse cx="36" cy="${bodyY - 12 + tendrilSway * 0.3}" rx="18" ry="14" fill="url(#jb${i})" transform="rotate(${armAngle}, 36, ${bodyY - 12})"/>
<ellipse cx="92" cy="${bodyY - 10 + tendrilSway * 0.3}" rx="18" ry="14" fill="url(#jb${i})" transform="rotate(${-armAngle}, 92, ${bodyY - 10})"/>
<ellipse cx="36" cy="${bodyY - 12 + tendrilSway * 0.3}" rx="18" ry="14" fill="none" stroke="#55CC33" stroke-width="1.2" opacity="0.3" transform="rotate(${armAngle}, 36, ${bodyY - 12})"/>
<ellipse cx="92" cy="${bodyY - 10 + tendrilSway * 0.3}" rx="18" ry="14" fill="none" stroke="#55CC33" stroke-width="1.2" opacity="0.3" transform="rotate(${-armAngle}, 92, ${bodyY - 10})"/>
<polygon points="${20 + armAngle * 0.5},${bodyY - 2 + tendrilSway * 0.3} ${28 + armAngle * 0.5},${bodyY - 4 + tendrilSway * 0.3} ${18 + armAngle * 0.5},${bodyY - 6 + tendrilSway * 0.3}" fill="#5ac840"/>
<polygon points="${108 - armAngle * 0.5},${bodyY - 2 + tendrilSway * 0.3} ${100 - armAngle * 0.5},${bodyY - 4 + tendrilSway * 0.3} ${110 - armAngle * 0.5},${bodyY - 6 + tendrilSway * 0.3}" fill="#5ac840"/>
<ellipse cx="44" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="62" cy="${bodyY - 14 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="78" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="50" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="68" cy="${bodyY - 14 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="84" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${pupilH}" fill="#33FF33"/>
<ellipse cx="44" cy="${bodyY - 11 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="62" cy="${bodyY - 15 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="78" cy="${bodyY - 11 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="50" cy="${bodyY - 11 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="68" cy="${bodyY - 15 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="84" cy="${bodyY - 11 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${pupilH - 1.5}" fill="white" opacity="0.9"/>
<ellipse cx="43.5" cy="${bodyY - 11.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<ellipse cx="61.5" cy="${bodyY - 15.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<ellipse cx="77.5" cy="${bodyY - 11.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<ellipse cx="49.5" cy="${bodyY - 11.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<ellipse cx="67.5" cy="${bodyY - 15.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<ellipse cx="83.5" cy="${bodyY - 11.5 + ((i % 3) - 1) * 3}" rx="1.8" ry="1.8" fill="#CCFFCC"/>
<polygon points="50,${bodyY + 6 + tendrilSway * 0.3} 58,${bodyY + 14 + tendrilSway * 0.3} 56,${bodyY + 5 + tendrilSway * 0.3}" fill="#55FF33"/>
<polygon points="54,${bodyY + 6 + tendrilSway * 0.3} 62,${bodyY + 14 + tendrilSway * 0.3} 50,${bodyY + 14 + tendrilSway * 0.3}" fill="#55FF33"/>
<polygon points="66,${bodyY + 6 + tendrilSway * 0.3} 74,${bodyY + 14 + tendrilSway * 0.3} 72,${bodyY + 5 + tendrilSway * 0.3}" fill="#55FF33"/>
<polygon points="62,${bodyY + 6 + tendrilSway * 0.3} 70,${bodyY + 14 + tendrilSway * 0.3} 78,${bodyY + 14 + tendrilSway * 0.3}" fill="#55FF33"/>
<rect x="52" y="${bodyY + 8 + tendrilSway * 0.3}" width="6" height="4" rx="1" fill="#3a8a1a"/>
<rect x="70" y="${bodyY + 8 + tendrilSway * 0.3}" width="6" height="4" rx="1" fill="#3a8a1a"/>
<path d="M${18 + tendrilSway} ${bodyY + 18 + tendrilSway} Q${14},${bodyY + 28} ${22 + tendrilSway * 0.5},${bodyY + 36 + tendrilSway}" stroke="#44CC22" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M${110 - tendrilSway} ${bodyY + 18 + tendrilSway} Q${114},${bodyY + 28} ${106 - tendrilSway * 0.5},${bodyY + 36 + tendrilSway}" stroke="#44CC22" stroke-width="3" fill="none" stroke-linecap="round"/>
<ellipse cx="64" cy="${bodyY + bodyH / 2}" rx="14" ry="5" fill="#000000" opacity="0.25"/>`,
      };
    }).flat(),
    // ── Village Boss (128×128, 6 frames) — Shadow Cook ──
    ...Array.from({ length: 6 }, (_, i) => {
      const bellyW = [54, 58, 56, 54, 52, 50][i];
      const bellyH = [48, 52, 50, 48, 46, 44][i];
      const bellyY = [50, 48, 49, 50, 51, 52][i];
      const potY = [-2, -4, -3, -2, -1, 0][i];
      const eyeR = [6, 7, 7, 6, 5, 5][i];
      const eyeH = [5, 6, 6, 5, 4, 4][i];
      const ladleAngle = [18, 24, 21, 14, 8, 3][i];
      const steamY = [-10, -14, -12, -8, -5, -3][i];
      return {
        category: 'boss',
        name: `boss-village-idle-${i}`,
        color: '#5a5a70',
        size: BOSS_SIZE,
        shape: `<defs>
  <radialGradient id="va${i}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#FF8800" stop-opacity="0.22"/>
    <stop offset="40%" stop-color="#FF6600" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="#FF8800" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="vb${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#6a6a80"/>
    <stop offset="30%" stop-color="#555568"/>
    <stop offset="70%" stop-color="#3a3a48"/>
    <stop offset="100%" stop-color="#1a1a25"/>
  </linearGradient>
  <linearGradient id="vh${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#8888A0"/>
    <stop offset="30%" stop-color="#666678"/>
    <stop offset="100%" stop-color="#444450"/>
  </linearGradient>
</defs>
<circle cx="64" cy="64" r="50" fill="url(#va${i})"/>
<ellipse cx="64" cy="${bellyY}" rx="${bellyW / 2 + 2}" ry="${bellyH / 2 + 2}" fill="#AA8866" opacity="0.06"/>
<ellipse cx="64" cy="${bellyY}" rx="${bellyW / 2}" ry="${bellyH / 2}" fill="url(#vb${i})"/>
<ellipse cx="64" cy="${bellyY}" rx="${bellyW / 2}" ry="${bellyH / 2}" fill="none" stroke="#8888A0" stroke-width="1.5" opacity="0.3"/>
<ellipse cx="64" cy="${bellyY - 2}" rx="${bellyW / 2 - 6}" ry="${bellyH / 2 - 2}" fill="#6a6a80" opacity="0.35"/>
<path d="M${64 - bellyW / 2 + 6} ${bellyY - bellyH / 2 + 4} Q${64},${bellyY - bellyH / 2 - 8} ${64 + bellyW / 2 - 6},${bellyY - bellyH / 2 + 4}" fill="#7a7a90" opacity="0.4"/>
<rect x="${64 - 17}" y="${8 + potY}" width="34" height="26" rx="5" fill="url(#vh${i})"/>
<rect x="${64 - 17}" y="${8 + potY}" width="34" height="26" rx="5" fill="none" stroke="#9999B0" stroke-width="1.5" opacity="0.4"/>
<rect x="${64 - 15}" y="${6 + potY}" width="30" height="4" rx="2" fill="#AAAACC"/>
<path d="M${64 + 17} ${12 + potY} Q${64 + 26} ${18 + potY} ${64 + 22} ${24 + potY}" stroke="#666678" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="${64 - 7}" y="${6 + potY - 4}" width="14" height="5" rx="2" fill="#AAAACC"/>
<rect x="${64 - 7}" y="${6 + potY - 4}" width="14" height="5" rx="2" fill="none" stroke="#CCCCEE" stroke-width="0.8"/>
<ellipse cx="46" cy="${30 + potY * 0.5}" rx="${eyeR}" ry="${eyeH}" fill="#FF8800"/>
<ellipse cx="76" cy="${30 + potY * 0.5}" rx="${eyeR}" ry="${eyeH}" fill="#FF8800"/>
<ellipse cx="45" cy="${29 + potY * 0.5}" rx="${eyeR - 2}" ry="2.5" fill="white" opacity="0.85"/>
<ellipse cx="75" cy="${29 + potY * 0.5}" rx="${eyeR - 2}" ry="2.5" fill="white" opacity="0.85"/>
<circle cx="45.5" cy="${29.5 + potY * 0.5}" r="1.5" fill="#FFFF88"/>
<circle cx="75.5" cy="${29.5 + potY * 0.5}" r="1.5" fill="#FFFF88"/>
<rect x="38" y="${36 + potY * 0.5}" width="10" height="20" rx="4" fill="#444458" stroke="#777790" stroke-width="1"/>
<rect x="74" y="${36 + potY * 0.5}" width="10" height="20" rx="4" fill="#444458" stroke="#777790" stroke-width="1"/>
<rect x="34" y="${50 + bellyY * 0.1}" width="22" height="7" rx="2" fill="#5a5a70"/>
<rect x="66" y="${50 + bellyY * 0.1}" width="22" height="7" rx="2" fill="#5a5a70"/>
<ellipse cx="36" cy="${55 + bellyY * 0.1}" rx="3" ry="2" fill="#AAAACC" opacity="0.5"/>
<ellipse cx="68" cy="${55 + bellyY * 0.1}" rx="3" ry="2" fill="#AAAACC" opacity="0.5"/>
<rect x="${64 + 24}" y="${32 + potY}" width="10" height="${34 + bellyY * 0.2}" rx="4" fill="#8B6914" stroke="#B8960A" stroke-width="1" transform="rotate(${ladleAngle}, ${64 + 29}, ${32 + potY})"/>
<ellipse cx="${64 + 29 + ladleAngle * 0.5}" cy="${32 + potY + 8 + ladleAngle * 0.3}" rx="10" ry="7" fill="#A0782C" stroke="#C0984A" stroke-width="1" transform="rotate(${ladleAngle}, ${64 + 29}, ${32 + potY})"/>
<circle cx="${64 + 29 + ladleAngle * 0.5}" cy="${32 + potY + 6 + ladleAngle * 0.3}" r="5" fill="#C0984A" opacity="0.5"/>
<path d="M${64 - 20} ${bellyY + bellyH / 2} L${64 - 14} ${bellyY + bellyH / 2 + 16}" stroke="#444458" stroke-width="8" stroke-linecap="round"/>
<path d="M${64 + 14} ${bellyY + bellyH / 2} L${64 + 10} ${bellyY + bellyH / 2 + 16}" stroke="#444458" stroke-width="8" stroke-linecap="round"/>
<rect x="${64 - 16}" y="${bellyY + bellyH / 2 - 3}" width="32" height="12" rx="3" fill="#5a5a70" opacity="0.6"/>
<ellipse cx="64" cy="${bellyY + bellyH / 2 + 14}" rx="18" ry="5" fill="#1a1a25" opacity="0.4"/>
<circle cx="58" cy="${2 + potY + steamY}" r="5" fill="#9999BB" opacity="0.2"/>
<circle cx="70" cy="${steamY - 2}" r="6" fill="#9999BB" opacity="0.15"/>
<circle cx="64" cy="${steamY - 6}" r="7" fill="#9999BB" opacity="0.08"/>`,
      };
    }).flat(),
    // ── Palace Boss (128×128, 6 frames) — Royal Shadow Guardian ──
    ...Array.from({ length: 6 }, (_, i) => {
      const bodyW = [44, 48, 46, 44, 42, 40][i];
      const bodyH = [68, 72, 70, 68, 66, 64][i];
      const bodyY = [46, 44, 45, 46, 47, 48][i];
      const crownY = [-4, -6, -5, -4, -3, -2][i];
      const eyeR = [6, 7, 7, 6, 5, 5][i];
      const eyeH = [5, 6, 6, 5, 4, 4][i];
      const scepterAngle = [-18, -24, -21, -14, -8, -3][i];
      const capeFlow = [0, 3, 2, 0, -2, -3][i];
      return {
        category: 'boss',
        name: `boss-palace-idle-${i}`,
        color: '#4a2080',
        size: BOSS_SIZE,
        shape: `<defs>
  <radialGradient id="pa${i}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#9944FF" stop-opacity="0.25"/>
    <stop offset="40%" stop-color="#7722DD" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="#9944FF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="pb${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#5a2088"/>
    <stop offset="30%" stop-color="#4a1870"/>
    <stop offset="70%" stop-color="#2a1040"/>
    <stop offset="100%" stop-color="#150822"/>
  </linearGradient>
  <linearGradient id="pg${i}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#FFD700"/>
    <stop offset="50%" stop-color="#DDAA00"/>
    <stop offset="100%" stop-color="#AA6600"/>
  </linearGradient>
</defs>
<circle cx="64" cy="64" r="54" fill="url(#pa${i})"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2 + 2}" ry="${bodyH / 2 + 2}" fill="#9944FF" opacity="0.06"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="url(#pb${i})"/>
<ellipse cx="64" cy="${bodyY}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="none" stroke="#8844CC" stroke-width="1.5" opacity="0.35"/>
<ellipse cx="64" cy="${bodyY - 2}" rx="${bodyW / 2 - 6}" ry="${bodyH / 2 - 2}" fill="#5a2088" opacity="0.35"/>
<polygon points="${64 - bodyW / 2 + 2},${bodyY - bodyH / 2 + 2} ${64 + bodyW / 2 - 2},${bodyY - bodyH / 2 + 2} ${64 + bodyW / 2 + 4},${bodyY - bodyH / 2 + 8} ${64 - bodyW / 2 - 4},${bodyY - bodyH / 2 + 8}" fill="#5a2088" opacity="0.5"/>
<rect x="${64 - 16}" y="${bodyY - bodyH / 2 + 8}" width="32" height="14" rx="4" fill="url(#pg${i})"/>
<rect x="${64 - 14}" y="${bodyY - bodyH / 2 + 10}" width="28" height="8" rx="2" fill="#EECC00" opacity="0.6"/>
<circle cx="64" cy="${bodyY - bodyH / 2 + 15}" r="4" fill="#FF2200"/>
<circle cx="64" cy="${bodyY - bodyH / 2 + 15}" r="2.5" fill="#FF6644"/>
<circle cx="64" cy="${bodyY - bodyH / 2 + 15}" r="1.2" fill="white" opacity="0.8"/>
<polygon points="${64 - 20},${5 + crownY} ${64 - 13},${13 + crownY} ${64 - 20},${13 + crownY}" fill="url(#pg${i})"/>
<polygon points="${64 - 20},${5 + crownY} ${64 - 13},${13 + crownY} ${64 - 20},${13 + crownY}" fill="none" stroke="#FFE840" stroke-width="1"/>
<polygon points="64,${1 + crownY} 64,${13 + crownY} 64,${1 + crownY}" fill="url(#pg${i})"/>
<polygon points="64,${1 + crownY} 64,${13 + crownY} 64,${1 + crownY}" fill="none" stroke="#FFE840" stroke-width="1"/>
<polygon points="${64 + 16},${5 + crownY} ${64 + 23},${13 + crownY} ${64 + 16},${13 + crownY}" fill="url(#pg${i})"/>
<polygon points="${64 + 16},${5 + crownY} ${64 + 23},${13 + crownY} ${64 + 16},${13 + crownY}" fill="none" stroke="#FFE840" stroke-width="1"/>
<rect x="${64 - 12}" y="${13 + crownY}" width="24" height="4" rx="1" fill="url(#pg${i})"/>
<circle cx="${64 - 18}" cy="${9 + crownY}" r="2.5" fill="#FF4444"/>
<circle cx="64" cy="${5 + crownY}" r="3" fill="#44FF44"/>
<circle cx="${64 + 18}" cy="${9 + crownY}" r="2.5" fill="#4444FF"/>
<ellipse cx="44" cy="${bodyY - 8 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${eyeH}" fill="#FF3333"/>
<ellipse cx="80" cy="${bodyY - 8 + ((i % 3) - 1) * 3}" rx="${eyeR}" ry="${eyeH}" fill="#FF3333"/>
<ellipse cx="44" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${eyeH - 2}" fill="white" opacity="0.85"/>
<ellipse cx="80" cy="${bodyY - 10 + ((i % 3) - 1) * 3}" rx="${eyeR - 2}" ry="${eyeH - 2}" fill="white" opacity="0.85"/>
<circle cx="43.5" cy="${bodyY - 9.5 + ((i % 3) - 1) * 3}" r="1.5" fill="#FFBBBB"/>
<circle cx="79.5" cy="${bodyY - 9.5 + ((i % 3) - 1) * 3}" r="1.5" fill="#FFBBBB"/>
<polygon points="${64 - bodyW / 2 + 2},${bodyY - 8 + ((i % 3) - 1) * 3} ${64 - bodyW / 2 - 20},${bodyY - 14 + ((i % 3) - 1) * 3} ${64 - bodyW / 2 + 6},${bodyY - 2 + ((i % 3) - 1) * 3}" fill="url(#pg${i})"/>
<polygon points="${64 + bodyW / 2 - 2},${bodyY - 8 + ((i % 3) - 1) * 3} ${64 + bodyW / 2 + 20},${bodyY - 14 + ((i % 3) - 1) * 3} ${64 + bodyW / 2 - 6},${bodyY - 2 + ((i % 3) - 1) * 3}" fill="url(#pg${i})"/>
<rect x="${64 + bodyW / 2 - 2}" y="${bodyY - 8}" width="18" height="4" rx="1" fill="url(#pg${i})" stroke="#FFE840" stroke-width="0.8" transform="rotate(${scepterAngle}, ${64 + bodyW / 2 + 7}, ${bodyY - 6})"/>
<circle cx="${64 + bodyW / 2 + 16 + scepterAngle * 0.2}" cy="${bodyY - 6 + scepterAngle * 0.2}" r="6" fill="url(#pg${i})"/>
<circle cx="${64 + bodyW / 2 + 16 + scepterAngle * 0.2}" cy="${bodyY - 6 + scepterAngle * 0.2}" r="4" fill="#FFAA00"/>
<circle cx="${64 + bodyW / 2 + 16 + scepterAngle * 0.2}" cy="${bodyY - 6 + scepterAngle * 0.2}" r="2" fill="white" opacity="0.7"/>
<path d="M${64 - bodyW / 2 + 6} ${bodyY + 6} Q${64 - bodyW / 2 - 10 + capeFlow} ${bodyY + 32} ${64 - bodyW / 2 + capeFlow},${bodyY + 48}" fill="#2a1050" opacity="0.7" stroke="#4a2080" stroke-width="1"/>
<path d="M${64 + bodyW / 2 - 6} ${bodyY + 6} Q${64 + bodyW / 2 + 10 - capeFlow} ${bodyY + 32} ${64 + bodyW / 2 - capeFlow},${bodyY + 48}" fill="#2a1050" opacity="0.7" stroke="#4a2080" stroke-width="1"/>
<rect x="${64 - bodyW / 2 + 4}" y="26" width="16" height="18" rx="4" fill="#3a1860" stroke="#8844CC" stroke-width="0.8"/>
<rect x="${64 + bodyW / 2 - 20}" y="26" width="16" height="18" rx="4" fill="#3a1860" stroke="#8844CC" stroke-width="0.8"/>
<rect x="${64 - bodyW / 4 - 10}" y="42" width="20" height="4" rx="1" fill="url(#pg${i})"/>
<ellipse cx="64" cy="${bodyY + bodyH / 2}" rx="16" ry="6" fill="#150822" opacity="0.5"/>`,
      };
    }).flat(),
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

  const generatedPaths: Map<string, string> = new Map();

  for (const sprite of sprites) {
    const dir = resolve(OUTPUT_DIR, sprite.category);
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `${sprite.name}.png`);
    const svg = Buffer.from(generateSprite(sprite.category, sprite.color, sprite.shape, sprite.size));
    await sharp(svg).png().toFile(path);
    generatedPaths.set(`${sprite.category}/${sprite.name}`, path);
    console.log(`  ${sprite.category}/${sprite.name}.png`);
  }

  // Compose player run spritesheet (4 frames side by side, 256x64)
  console.log('\nCompositing player run spritesheet...');
  const runFramePaths = [
    resolve(OUTPUT_DIR, 'player/run-frame-0.png'),
    resolve(OUTPUT_DIR, 'player/run-frame-1.png'),
    resolve(OUTPUT_DIR, 'player/run-frame-2.png'),
    resolve(OUTPUT_DIR, 'player/run-frame-3.png'),
  ];
  const runFrames = await Promise.all(
    runFramePaths.map(async (p, i) => {
      const buf = await sharp(p).resize(64, 64).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      return { ...buf, index: i };
    })
  );

  // Create composite image with frames side by side
  const frameWidth = 64;
  const frameHeight = 64;
  const totalWidth = frameWidth * 4;
  const totalHeight = frameHeight;
  const compositeBuffer = Buffer.alloc(totalWidth * totalHeight * 4, 0);

  for (const frame of runFrames) {
    const offsetX = frame.index * frameWidth * 4; // 4 channels per pixel
    for (let y = 0; y < frameHeight; y++) {
      const srcRow = y * frameWidth * 4;
      const dstRow = y * totalWidth * 4 + offsetX;
      for (let x = 0; x < frameWidth * 4; x++) {
        compositeBuffer[dstRow + x] = (frame.data as Buffer)[srcRow + x];
      }
    }
  }

  await sharp(compositeBuffer, {
    raw: { width: totalWidth, height: totalHeight, channels: 4 },
  }).png().toFile(resolve(OUTPUT_DIR, 'player/run-sheet.png'));
  console.log('  player/run-sheet.png (256x64, 4 frames)');

  // Also create idle spritesheet (2 frames: idle + idle-bob)
  console.log('Compositing player idle spritesheet...');
  const idleFramePath = resolve(OUTPUT_DIR, 'player/idle.png');
  const idleData = await sharp(idleFramePath).resize(64, 64).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const idleWidth = frameWidth * 2;
  const idleBuf = Buffer.alloc(idleWidth * frameHeight * 4, 0);
  for (let y = 0; y < frameHeight; y++) {
    const srcRow = y * frameWidth * 4;
    const dstRow0 = y * idleWidth * 4;
    const dstRow1 = y * idleWidth * 4 + frameWidth * 4;
    for (let x = 0; x < frameWidth * 4; x++) {
      idleBuf[dstRow0 + x] = (idleData.data as Buffer)[srcRow + x];
      idleBuf[dstRow1 + x] = (idleData.data as Buffer)[srcRow + x];
    }
  }

  await sharp(idleBuf, {
    raw: { width: idleWidth, height: frameHeight, channels: 4 },
  }).png().toFile(resolve(OUTPUT_DIR, 'player/idle-sheet.png'));
  console.log('  player/idle-sheet.png (128x64, 2 frames)');

  // Boss spritesheet compositing helper (128×128 frames, 6 per sheet)
  const BOSS_FRAME_COUNT = 6;
  const BOSS_FRAME = BOSS_SIZE;
  async function composeBossSheet(bossKey: string): Promise<void> {
    const framePaths = Array.from({ length: BOSS_FRAME_COUNT }, (_, i) =>
      resolve(OUTPUT_DIR, `boss/${bossKey}-idle-${i}.png`)
    );
    const frames = await Promise.all(
      framePaths.map(async (p, i) => {
        const buf = await sharp(p).resize(BOSS_FRAME, BOSS_FRAME).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        return { ...buf, index: i };
      })
    );

    const sheetWidth = BOSS_FRAME * BOSS_FRAME_COUNT;
    const sheetHeight = BOSS_FRAME;
    const sheetBuf = Buffer.alloc(sheetWidth * sheetHeight * 4, 0);
    for (const frame of frames) {
      const offsetX = frame.index * BOSS_FRAME * 4;
      for (let y = 0; y < BOSS_FRAME; y++) {
        const srcRow = y * BOSS_FRAME * 4;
        const dstRow = y * sheetWidth * 4 + offsetX;
        for (let x = 0; x < BOSS_FRAME * 4; x++) {
          sheetBuf[dstRow + x] = (frame.data as Buffer)[srcRow + x];
        }
      }
    }

    await sharp(sheetBuf, {
      raw: { width: sheetWidth, height: sheetHeight, channels: 4 },
    }).png().toFile(resolve(OUTPUT_DIR, `boss/${bossKey}-sheet.png`));
    console.log(`  boss/${bossKey}-sheet.png (${sheetWidth}x${sheetHeight}, ${BOSS_FRAME_COUNT} frames)`);
  }

  console.log('\nCompositing boss spritesheets...');
  await composeBossSheet('boss-jungle');
  await composeBossSheet('boss-village');
  await composeBossSheet('boss-palace');

  console.log('\nAll sprites generated!');
}

generateSprites().catch(console.error);
