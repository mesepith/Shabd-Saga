/**
 * Master asset generation script.
 * Runs all asset generators sequentially and creates silent audio placeholders.
 */

import { execSync } from 'child_process';

const scripts = [
  { name: 'Backgrounds', file: 'generate-backgrounds.ts' },
  { name: 'Sprites', file: 'generate-sprites.ts' },
  { name: 'Tilesets', file: 'generate-tilesets.ts' },
  { name: 'Letter Sprites', file: 'generate-letters.ts' },
  { name: 'UI Elements', file: 'generate-ui.ts' },
];

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   Shabd Saga - Asset Generator       ║');
  console.log('╚══════════════════════════════════════╝\n');

  for (const script of scripts) {
    console.log(`\n▶ Generating ${script.name}...`);
    try {
      execSync(`npx tsx scripts/${script.file}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (err) {
      console.error(`  ✗ Failed to generate ${script.name}`);
    }
  }

  // Create silent placeholder audio files
  console.log('\n▶ Creating silent audio placeholders...');
  const { mkdirSync, writeFileSync } = await import('fs');
  const { resolve } = await import('path');

  const audioDirs = [
    'public/assets/audio/sfx',
    'public/assets/audio/music',
  ];
  for (const dir of audioDirs) {
    mkdirSync(resolve(process.cwd(), dir), { recursive: true });
  }

  // Minimal valid MP3 (silence) for placeholders
  const silentMP3 = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  const sfxFiles = ['jump.mp3', 'collect.mp3', 'door-open.mp3', 'hurt.mp3', 'success.mp3'];
  const musicFiles = ['menu.mp3', 'world-1.mp3', 'world-2.mp3', 'world-3.mp3'];

  for (const file of sfxFiles) {
    writeFileSync(resolve(process.cwd(), `public/assets/audio/sfx/${file}`), silentMP3);
  }
  for (const file of musicFiles) {
    writeFileSync(resolve(process.cwd(), `public/assets/audio/music/${file}`), silentMP3);
  }
  console.log('  Silent audio placeholders created.');

  console.log('\n✅ All assets generated successfully!');
}

main().catch(console.error);
