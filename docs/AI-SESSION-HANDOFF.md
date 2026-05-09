# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 2026) — Tiled Level Maps Complete: Rich visual environments, 5 levels across 3 worlds

### Mobile Testing Results (iPhone 12 iOS 18.7.8 + OnePlus Nord CE3 Android 15)
| Feature | iPhone | Android Phone | Status |
|---------|--------|---------------|--------|
| HUD (hearts, score, gems) | ✓ | ✓ | Done |
| Floating joystick move | ✓ | ✓ | Done |
| Right-half tap-to-jump | ✓ | ✓ | Done |
| Dynamic interact button (NPCs/guards) | ✓ | ✓ | Done |
| Drag-to-spell (WordPuzzle) | ✓ | ✓ | Done |
| Boss fights | ✓ | ✓ | Done |
| Fullscreen button | ✓ (Standalone hides tip) | ✓ Fullscreen works | Done |
| Sound (letter pronunciation) | ✓ | ✓ | Done |
| Landscape lock + rotate prompt | ✓ | ✓ | Done |
| Bottom crop / blank space | ✓ No crop | ✓ No crop | Done |
| Tiled level maps | ⌛ Pending test | ⌛ Pending test | Done (code + assets) |

### NEXT: Screen Transitions
| Order | Task | Why |
|-------|------|-----|
| ~~1~~ | ~~Enemy difficulty balancing~~ ✓ | Per-level speed/cooldown config |
| ~~2~~ | ~~Boss sprites (proper art)~~ ✓ | 3 unique 128×128 designs |
| ~~3~~ | ~~Real audio assets~~ ✓ | 9 WAV tracks + synthesized SFX |
| ~~4~~ | ~~NPC dialogue choice UI~~ ✓ | Choice buttons + game-state-aware dynamic hints |
| ~~5~~ | ~~Dialogue audio~~ ✓ | 5 monkey, 3 owl, 2 deer voice MP3s (Lekha TTS) |
| ~~6~~ | ~~Tiled level maps~~ ✓ | 5 levels × 3 worlds, proper tileset spritesheets, parallax backgrounds |
| 7 | Screen transitions | Iris wipe / dissolve between scenes — small effort, big polish |

### What's Working
- All 9 Phaser scenes load and function
- Platformer, keyboard controls (WASD/arrows), Devanagari rendering, letter collection, WordBar
- WordPuzzle overlay with drag-to-spell + caller param for boss integration
- Doors + guards + letter consumption flow
- Level completion → stars → save
- **Tiled level maps**: 5 tilemap JSONs with structured terrain, parallax background layers, tile-based collision. Procedural rectangle-based platform fallback on tilemap load failure.
- **NPC dialogue with choice UI**: 2+ choice nodes render tappable gold-bordered buttons in dialogue box. Space/Enter blocked during choices to prevent accidental auto-pick
- **Dynamic NPC hints**: Monkey, Wise Owl, and Deer Mother each give **game-state-aware hints** after their initial interaction — they inspect `activeDoors`, `activeGuards`, and `defeatedGuards` at runtime to tell the player exactly which doors remain, which have guards, and what letters to collect
- **Dialogue audio**: All NPC dialogue nodes have high-quality Hindi TTS audio (macOS Lekha voice, 140 wpm, MP3). 5 monkey nodes, 3 owl nodes, 2 deer nodes
- **NPC game-state tracking**: `monkeyGemGiven`, `owlTaught`, `deerTaught` flags + `completedDoorWords` Set.
- **Monkey gem reward**: Choosing "Sure!" spawns a WisdomGem at monkey's position. Permanent NPC state change — future talks give hints, not choices
- Shadow Creeper enemies, stolen letter respawn
- Player animations, checkpoint/respawn
- Health pickups, WisdomGems, star rating
- World-specific parallax backgrounds, LevelSelectScene
- Letter Guard enemies (5 guards, word-specific door blocking)
- Boss fights — 3 unique bosses, per-attack SFX, escalating tension music
- Boss sprites: 3 unique 128×128 designs, 6-frame animations, per-boss scaling/spotlights/particles
- Touch controls: left half = floating joystick, right half = tap-anywhere-jump
- Dynamic interact button: appears near NPCs/guards/boss vulnerable phase
- Landscape lock + rotate prompt overlay
- DOM fullscreen button (Android) / Add-to-Home-Screen tip (iPhone)
- Audio unlock for iOS Safari (silent buffer + Howler context resume)
- **B** key = skip to boss (dev shortcut on boss levels)
- **`window.game`** exposed for console access

---

## Audio Architecture (May 2026 — Final)

### AudioManager (`src/systems/AudioManager.ts`)
Single singleton class. Replaced all scattered `this.sound.play()` / `new Howl()` calls.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **SFX** | Web Audio API oscillators | 15 synthesized sounds: jump, collect, door-open, hurt, success, checkpoint, health-pickup, guard-spell, fanfare, boss-attack (fire sweep+crackle), boss-slam (boom+noise), boss-minion (magical sparkle), boss-hit, boss-defeated |
| **Music** | Pre-rendered WAV loops via Howler.js | 9 tracks, 44100Hz 10s loops, rich additive synthesis (bells/kicks/pads/sparkles) |
| **Speech** | Howler.js with caching + 500ms debounce | Hindi word pronunciations + dialogue (real MP3s, pre-generated) |
| **Controls** | Mute toggle in pause menu | Persisted to localStorage `shabd_saga_audio_muted` |

### Music Tracks (9 total — `public/assets/audio/music/`)

| Track | Key | Tempo | Character |
|-------|-----|-------|-----------|
| `menu-loop.wav` | C major pent | 120 BPM | Calm pads + bell melody |
| `world-1-loop.wav` | E minor pent | 130 BPM | Triangle melody + rhythmic kicks |
| `world-2-loop.wav` | G major | 115 BPM | Warm sine melody + gentle kicks |
| `world-3-loop.wav` | D harm minor | 100 BPM | Bell arpeggios over pads |
| `boss-jungle-loop.wav` | D minor | 120 BPM | Double kicks, dissonant bells, sweeps |
| `boss-village-loop.wav` | C# minor | 140 BPM | Triple kicks, faster arpeggios |
| `boss-palace-loop.wav` | E minor | 160 BPM | Quad kicks, rapid arpeggios, dense sweeps |
| `victory-loop.wav` | C major | 100 BPM | Grand fanfare + bell melody + sparkles |
| `puzzle-loop.wav` | C major pent | 108 BPM | Soft twinkling bells over pad bed |

### Boss SFX — Per Attack Type

| Attack | SFX Method | Per-Instance? | Technique |
|--------|-----------|---------------|-----------|
| Shadow Bolts | `playBossAttack()` | Yes (3×, once per bolt) | Dual sawtooth sweep + 6× crackle burst |
| Ground Slam impact | `playBossSlam()` | Once | 45Hz boom + noise explosion + sweep |
| Ground Slam waves | `playBossAttack()` | Yes (2×, left+right) | Per-wave fire whoosh |
| Shadow Minions | `playBossMinion()` | Yes (3×, once per minion) | Sine+tangent sweep + crackle |

### Music Playback Rules

| Event | Action |
|-------|--------|
| Level start | `startWorldMusic(world)` |
| NPC dialogue | `fadeOutMusic(400)` before launch, `startWorldMusic()` after |
| Door puzzle | `fadeOutMusic(400)`, `startWorldMusic()` on correct spell |
| Guard spell | `playGuardSpell()` + `fadeOutMusic(400)`, `startWorldMusic()` after defeat |
| Boss arena | `startBossMusic(world)` — escalating per world |
| Boss spelling (WordPuzzle) | Boss music continues — puzzle music skipped for BossScene caller |
| Boss defeat | `stopMusic()` + `startVictoryMusic()` — plays until Continue clicked |
| Continue clicked | `stopMusic()` in BossScene → GameScene resume → level complete |
| Level complete | `stopMusic()` + `playFanfare()` + `startVictoryMusic()` |
| Next Level / Level Select clicked | `stopMusic()` |

### To Regenerate Music
```bash
npx tsx scripts/generate-music.ts
```
Creates all 9 WAV files using offline PCM synthesis (additive waveforms, bell harmonics, kicks, pads, sparkles, sweeps). 44100Hz, 10s loops, ~861KB each.

---

## Dialogue Architecture (May 2026 — Complete)

### DialogueScene Flow
1. NPC approached → E key or interact button → `handleNPCInteraction()`
2. Music fades out (400ms)
3. DialogueScene launches with dialogue nodes array
4. `showNode()` plays audio via `AudioManager.speakDialogue()`, cancels previous typewriter timer
5. Typewriter effect renders Hindi text character-by-character (30ms/char)
6. Tap/Space/Enter to advance: first tap skips typewriter, second tap advances to next node
7. When a node has 2+ choices → `onTypewriterComplete()` calls `showChoices()` which renders tappable gold-bordered buttons (160×48px, dark blue fill, gold border, 18px Hindi text). `showingChoices` flag blocks Space/Enter from auto-advancing.
8. Player taps a choice button → `handleChoice(nextNodeId)` → navigates to chosen node
9. After last node → `endDialogue()` → passes `finalNodeId` to `onComplete` callback → GameScene resumes + applies per-choice outcomes

### Choice UI
- Rendered dynamically in `showChoices()` — `Container` (Rectangle bg + Text label) added to `dialogueBox`
- Hover: `pointerover`/`pointerout` tint change (desktop only, no-op on touch)
- Touch: `pointerdown` fires on all platforms
- Buttons adapt to box width: `Math.min(160, (boxWidth - 80) / count - 12)` px wide

### NPC Game-State Awareness (3 NPCs)
All 3 NPCs give **runtime dynamic hints** after their initial interaction. Each has a dedicated method
in `GameScene.ts` that inspects `activeDoors`, `activeGuards`, and `defeatedGuards`:

| NPC | Flag | Method | Hint audio | All-done audio |
|-----|------|--------|------------|----------------|
| Monkey (`monkey_friend`) | `monkeyGemGiven` | `buildMonkeyHintNode()` | `monkey_hint.mp3` | `monkey_done.mp3` |
| Wise Owl (`wise_owl`) | `owlTaught` | `buildOwlHintNode()` | `owl_hint.mp3` | `owl_teach.mp3` |
| Deer Mother (`deer_mother`) | `deerTaught` | `buildDeerHintNode()` | `deer_hint.mp3` | `deer_intro.mp3` |

**Hint logic (shared across all 3):**
- 1 remaining door + guard: `"The {word} door has a guard! Collect '{letters}' and spell '{word}'!"`
- 1 remaining door, no guard: `"Collect {word}'s letters and open the door!"`
- 2 remaining doors: lists both, marks guarded ones
- 3+ remaining doors: count summary — `"{n} doors remain. {g} have guards — defeat them first!"`
- 0 remaining doors: congratulatory message

### Monkey Dialogue (5 nodes + 5 audio files)
```
monkey_intro → [2 choices: "ज़रूर!" / "बाद में"]
  ├── monkey_help (gem reward, once) → onComplete('monkey_help') → spawnMonkeyGem()
  └── monkey_later (no reward, retryable)
monkeyGemGiven=true → monkey_helped (hint — door not open) / monkey_done (congrats — door open)
```

### Owl Dialogue (2 nodes + 3 audio files)
```
owl_intro → [1 choice: "चलो सीखें!"] → owl_teach → onComplete('owl_teach') → owlTaught=true
owlTaught=true → buildOwlHintNode() (dynamic hints)
```

### Deer Dialogue (1 node + 2 audio files)
```
deer_intro → onComplete('deer_intro') → deerTaught=true
deerTaught=true → buildDeerHintNode() (dynamic hints)
```

### Speech Audio Files (11 total — `public/assets/audio/speech/hindi/dialogue/`)
| File | NPC | Size | Trigger |
|------|-----|------|---------|
| `monkey_intro.mp3` | Monkey | 50KB | First talk |
| `monkey_help.mp3` | Monkey | 64KB | "Sure!" choice |
| `monkey_later.mp3` | Monkey | 25KB | "Maybe later" choice |
| `monkey_helped.mp3` | Monkey | 40KB | Hint (door not open) |
| `monkey_done.mp3` | Monkey | 43KB | All doors open |
| `monkey_hint.mp3` | Monkey | 18KB | Dynamic hint prelude |
| `owl_intro.mp3` | Owl | 51KB | First talk |
| `owl_teach.mp3` | Owl | 50KB | "Let's learn!" → teaches baagh |
| `owl_hint.mp3` | Owl | 24KB | Dynamic hint prelude |
| `deer_intro.mp3` | Deer | 51KB | First talk |
| `deer_hint.mp3` | Deer | 23KB | Dynamic hint prelude |

Audio generated via `say -v "Lekha (Enhanced)" -r 140` → AIFF → ffmpeg MP3 (qscale:a 2).

---

## Boss Skip Shortcut
On any boss level, press **B** key to skip directly to the boss fight. Calls `launchBossFight()` which pre-resolves word data and launches BossScene immediately. Works only when `levelBoss` is loaded.

---

## Current Bugs / Pending
- [x] Boss fights: tested on mobile — working
- [x] WordPuzzle drag-to-spell: tested on mobile — working
- [x] All 3 levels: tested end-to-end on mobile — working
- [x] Touch controls: verified on both platforms
- [x] Standalone mode: "Add to Home Screen" button hidden when PWA launched — fixed
- [x] Enemy difficulty balancing per level — DONE
- [x] Cross-world progression — DONE
- [x] Boss sprites: 3 unique 128×128 designs — DONE
- [x] Music/SFX: 9 WAV tracks + synthesized SFX — DONE
- [x] Dialogue choices: visible tappable buttons with audio — DONE
- [x] NPC dynamic hints: Monkey, Owl, Deer give game-state-aware hints — DONE
- [x] Typewriter timer race condition: old timer cancelled before new — fixed
- [x] Monkey gem reward: permanent NPC state change, no stale hints — fixed
- [x] Tiled level maps — DONE (5 levels, 3 world-specific tilesets, parallax layers, procedural fallback)
- [ ] Tilemap mobile testing — pending
- [ ] Screen transitions — pending (small polish item)

---

## Tilemap Architecture (May 2026)

### Overview
Replaced hardcoded procedural platforms (rectangles) and procedural parallax backgrounds (colored rectangles + Graphics primitives) with **Tiled JSON tilemaps** loaded via Phaser's built-in `load.tilemapTiledJSON()` API.

### Tilesets
3 world-specific spritesheet images (320×256px, 5×4 grid of 64×64 tiles):
| World | Tileset File | Tile Count | Key Tiles |
|-------|-------------|------------|-----------|
| Jungle (world 1) | `jungle-tiles.png` | 20 | grass-ground, dirt-ground, grass-platform, rock, bush, vine, flower, tree-trunk, sky, cloud, mountain, grass-tuft |
| Village (world 2) | `village-tiles.png` | 20 | cobble-ground, wood-plank, house-wall, house-roof, window, door, fence, market, straw-bale, chimney |
| Palace (world 3) | `palace-tiles.png` | 20 | marble-floor, pillar-shaft/capital/base, stone-wall, carpet, curtain, candle, star, moon, throne |

### Tilemap JSONs
5 tilemap JSON files (one per level), each 60×12 tiles (3840×768px):
| File | Level | Theme | Terrain Features |
|------|-------|-------|-----------------|
| `world-1-level-1.json` | Jungle Path (tutorial) | Jungle | Full ground, 5-step staircase, bushes/flowers/rocks |
| `world-1-level-2.json` | Jungle Challenge (boss) | Jungle | Ground with 2 gaps, 7 platforms, complex jumps |
| `world-2-level-1.json` | Village Journey | Village | Cobblestone ground, wood platforms, houses, fences |
| `world-2-level-2.json` | Village Challenge (boss) | Village | Ground with gap, 7 platforms, market decor |
| `world-3-level-1.json` | Royal Palace (boss) | Palace | Marble ground, pillar platforms, curtains, red carpet |

### Layer Structure (per tilemap)
| Layer | Type | ScrollFactor | Purpose |
|-------|------|-------------|---------|
| `sky` | tilelayer | 0 | Far background (sky gradient + clouds/stars) |
| `mountains` | tilelayer | 0.1 | Distant scenery (mountains, hills, palace silhouette) |
| `decoration-bg` | tilelayer | 0.3 | Midground (bushes, vines, houses, pillars) |
| `platforms` | tilelayer | 1.0 | **Physics collision layer** — ground + floating platforms |
| `decoration-fg` | tilelayer | 1.0 | Foreground details (grass tufts, carpet) |
| `objects` | objectgroup | N/A | Entity positions (future use) |

### Loading Flow
1. **PreloadScene**: `this.load.tilemapTiledJSON(levelId, 'path.json')` + `this.load.image('jungle-tiles', 'path.png')` for all 5 levels + 3 tilesets
2. **GameScene.create()**: Calls `createTilemap()` before player creation
3. **createTilemap()**: `this.make.tilemap({ key: levelId })` → `addTilesetImage()` → `createLayer()` for each layer with scroll factors → `platformsLayer.setCollisionByExclusion([-1])` → `this.platforms = platformsLayer`
4. **Fallback**: If tilemap/tileset not found, calls `createProceduralLevel()` which uses the old rectangle-based approach

### Collision
- `this.platforms` type: `Phaser.Physics.Arcade.StaticGroup | Phaser.Tilemaps.TilemapLayer`
- Player and letters group collide with `this.platforms` regardless of which type it is
- `physics.add.collider()` accepts both StaticGroup and TilemapLayer

### Regeneration
```bash
npx tsx scripts/generate-tilesets.ts   # Generates 3 tileset PNGs
npx tsx scripts/generate-tilemaps.ts   # Generates 5 tilemap JSONs
npm run build                           # TypeScript + Vite with updated PreloadScene
```

### File Index (updated)
| File | Purpose |
|------|---------|
| `scripts/generate-tilesets.ts` | Generates 3 world-specific tileset spritesheets (20 tiles each, 320×256) |
| `scripts/generate-tilemaps.ts` | Programmatic level designer — generates 5 tilemap JSONs with terrain + object layers |
| `public/assets/tilesets/*.png` | 3 tileset sprite sheets (jungle, village, palace) |
| `public/assets/tilesets/*.json` | 5 Tiled JSON tilemaps (one per level) |

---

## How to Test
```bash
npm run dev        # http://localhost:5174 (also at LAN IP for mobile)
npm run lint       # tsc --noEmit (type-check)
npm run build      # Vite production build
```

**Skip to boss** (browser console, one-liner):
```js
game.scene.getScene('GameScene')?.launchBossFight()
```
Or just press **B** key during any boss level.

**Pre-set progress** (unlocks level 2):
```js
localStorage.setItem('shabd_saga_progress', JSON.stringify({languages:{hindi:{completedLevels:{"world-1-level-1":{levelId:"world-1-level-1",stars:3,wordsLearned:["baagh","haathi","mor","ped","nadee","phool"],gemsCollected:5,timeSpent:0,attempts:1,completedAt:"2026-05-05T00:00:00.000Z"}}}}));
```

---

## File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, audio unlock, DOM fullscreen, orientation, `window.game` export |
| `src/scenes/GameScene.ts` | Core gameplay (~2100 lines) — NPC dynamic hints (3 methods), monkey gem reward, `completedDoorWords`, enemy config, cross-world progression, `launchBossFight()` |
| `src/scenes/BossScene.ts` | Boss fights (~1272 lines) — per-attack SFX, per-world boss music, victory celebration |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay — puzzle music only for GameScene caller |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu with mute toggle |
| `src/scenes/DialogueScene.ts` | NPC conversation (~240 lines) — choice UI (`showChoices`, `handleChoice`), `onComplete(finalNodeId)`, typewriter timer fix |
| `src/scenes/MenuScene.ts` | Animated title menu with AudioManager music |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading (sprites only — no audio preloads needed) |
| `src/systems/TouchControls.ts` | Left-half joystick + right-half jump zone + dynamic interact button |
| `src/systems/AudioManager.ts` | Unified audio: Web Audio SFX synthesis + Howler WAV music + Howler speech cache |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `src/config/GameConfig.ts` | Phaser config, Scale.FIT, activePointers:3 |
| `src/config/languages/hindi.json` | Hindi words + enemies + guards + boss data + NPC dialogues (5 monkey, 2 owl, 1 deer) |
| `public/data/hindi.json` | Runtime copy of hindi.json |
| `public/assets/audio/speech/hindi/dialogue/` | 11 NPC voice MP3s (monkey×6, owl×3, deer×2) |
| `scripts/generate-sprites.ts` | Procedural sprite generation |
| `scripts/generate-music.ts` | 9-track WAV music generator (offline PCM synthesis) |
| `scripts/generate-speech.sh` | Hindi TTS generation (macOS `say` + Lekha voice + ffmpeg MP3) |
| `index.html` | DOM: viewport meta, #fs-btn, #rotate-prompt |
| `vite.config.ts` | host:'0.0.0.0' for LAN mobile testing |
| `docs/AI-SESSION-HANDOFF.md` | This file — quick start for new AI sessions |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

---

## Recommended Next Task
### Tiled Level Maps
The biggest visual/design upgrade remaining. Create proper `.tmx` tile map files for each level with terrain, platforms, decorations, and enemy/NPC/collectible placement. Currently levels use procedural platform generation — tile maps would bring rich, hand-crafted environments.

### Secondary: Screen Transitions
Small polish item — iris wipe or dissolve between scenes instead of instant cuts. Would improve the overall feel significantly with minimal effort.
