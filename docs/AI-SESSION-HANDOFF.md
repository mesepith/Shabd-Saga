# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 2026) — Tileset Visual Polish Complete: All 60 tiles across 3 worlds now have SVG gradients, highlights, texture patterns, and depth cues. Next: Progressive Difficulty.

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
| Tiled level maps | ✓ Verified | ✓ Verified | Done |

### NEXT: Progressive Difficulty
| Order | Task | Why |
|-------|------|-----|
| ~~1~~ | ~~Enemy difficulty balancing~~ ✓ | Per-level speed/cooldown config |
| ~~2~~ | ~~Boss sprites (proper art)~~ ✓ | 3 unique 128×128 designs |
| ~~3~~ | ~~Real audio assets~~ ✓ | 9 WAV tracks + synthesized SFX |
| ~~4~~ | ~~NPC dialogue choice UI~~ ✓ | Choice buttons + game-state-aware dynamic hints |
| ~~5~~ | ~~Dialogue audio~~ ✓ | 5 monkey, 3 owl, 2 deer voice MP3s (Lekha TTS) |
| ~~6~~ | ~~Tiled level maps~~ ✓ | 5 levels × 3 worlds, proper tileset spritesheets, parallax backgrounds |
| ~~7~~ | ~~Screen transitions~~ ✓ | Unified 600ms branded fades, overlay close transitions, pause menu fix |
| ~~8~~ | ~~Object layer integration~~ ✓ | Tilemap `objects` layer drives all entity spawning |
| ~~9~~ | ~~Tileset visual polish~~ ✓ | SVG gradients, highlights, texture patterns, depth cues for all 60 tiles |
| 10 | Progressive difficulty | Entity positions, enemy escalation, platform challenge vary per level |

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
- Shadow Creeper enemies, **stolen letter respawn** (fixed: deferred destroy+respawn outside forEach to prevent silent abort; respawn Y placed near ground for reachability)
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
- **Screen transitions**: Unified `TransitionManager` — 600ms branded fades (#1a1a2e), all 11 scene transitions consistent (Boot→Preload→Menu→LevelSelect→Game, pause menu restart/quit, overlay open/close)
- **Object Layer Integration**: All 9 entity types (player spawn, letters, doors, NPCs, creepers, guards, checkpoints, health pickups, gems) are now spawned from tilemap `objects` layer. Each spawn method falls back to hardcoded/config positions when tilemap unavailable (procedural mode). Positions from tilemap byte-identical to previous hardcoded arrays — zero behavioral change.

---

## Object Layer Integration (May 2026 — Complete)

### Overview
All entity spawning is now driven by the tilemap `objects` layer. `parseTilemapObjects()` reads the object layer and returns a typed `TilemapEntities` struct. Each spawn method accepts optional tilemap data and falls back to hardcoded/config positions when unavailable.

### TilemapEntities Interface (`src/scenes/GameScene.ts`)
| Field | Type | Tilemap Object Type |
|-------|------|---------------------|
| `playerSpawn` | `{x,y} \| null` | `player-spawn` |
| `letters` | `{x,y}[]` | `letter` (×20) |
| `doors` | `{x,y,wordId}[]` | `door` (×5-6, matched by wordId) |
| `npcs` | `{x,y,npcId,spriteKey}[]` | `npc` (×1, matched by npcId) |
| `creepers` | `{x,y,patrolRange,speed,contactCooldown}[]` | `enemy-creeper` (×2-3) |
| `guards` | `{x,y,guardWordId}[]` | `enemy-guard` (×1) |
| `checkpoints` | `{x,y,id,activated}[]` | `checkpoint` (×1-2) |
| `healthPickups` | `{x,y}[]` | `health-pickup` (×2) |
| `gems` | `{x,y}[]` | `gem` (×5) |

### Spawn Priority
For each entity type, tilemap positions take priority over hindi.json positions, which take priority over hardcoded defaults. When `createProceduralLevel()` is called (tilemap load failure), `tilemapEntities` is set to `undefined`, triggering all fallbacks.

### Entity Cross-Referencing
- **Doors**: Tilemap `wordId` property matched against `hindi.json` words array. Unmatched doors skipped; unmatched words fall back to default positions.
- **NPCs**: Tilemap `npcId` matched against `hindi.json` npcs array. NPC only spawns if it exists in both (dialogue config comes from hindi.json).
- **Creepers/Guards**: When tilemap data exists, it completely replaces hindi.json enemy configs. Guard `guardWordId` links to word for door-blocking mechanic.
- **Monkey gem**: Spawns at monkey NPC's tilemap position (or hardcoded 600,410 fallback).

### Stolen Letter Respawn Fix
- **Bug**: `letter.destroy()` inside `forEach` over `lettersGroup.getChildren()` silently aborted the callback, so `respawnLetter()` was never called when stolen letters expired.
- **Fix**: Collect expired letter data + references in forEach, destroy + respawn in separate passes after iteration.
- **Position fix**: Respawn Y changed from `cam.height * 0.25` (y≈180-300, unreachable) to `cam.height - 150` (y≈530-570, near ground).

---

## Tileset Visual Polish (May 2026 — Complete)

### Overview
All 60 tiles across 3 world-specific spritesheets now use SVG gradients, highlights, texture patterns, and depth cues instead of flat colors. No runtime changes — only the build-time generator script (`scripts/generate-tilesets.ts`).

### Techniques Used
| Technique | Purpose | Example |
|-----------|---------|---------|
| `linearGradient` / `radialGradient` | Depth shading (lit tops, shadowed bottoms) | Ground tiles, rocks, pillars, carpets |
| Semi-transparent highlight rects/ellipses | Edge highlights, polished surfaces | Cobblestone tops, door panels, marble veins |
| Darkened noise dots/small shapes | Surface texture, grittiness | Dirt pebbles, grass dots, wall imperfections |
| Overlapping layered shapes | Complex forms with depth | Cloud layering, bush clusters, rock cracks |
| Radial glow | Atmospheric lighting | Candle flame, sun rays, moonlight halo |
| Metallic gradient | Gold/metal shine | Throne crown, door knob, pillar capitals, gold trim |
| Wood grain lines | Natural wood texture | Planks, fences, tree trunks |

### Gradient Banks
| World | Gradients | Key additions |
|-------|-----------|---------------|
| Jungle | 14 | `jg-grass`, `jg-dirt`, `jg-wood`, `jg-rock`, `jg-rock-round`, `jg-bush`, `jg-sky`, `jg-sun`, `jg-cloud`, `jg-mtn`, `jg-mtn-far`, `jg-flower`, `jg-gold` |
| Village | 12 | `vg-cobble`, `vg-road`, `vg-wood-h`, `vg-wood-v`, `vg-wall`, `vg-roof`, `vg-sky`, `vg-hills`, `vg-straw`, `vg-canopy`, `vg-chimney`, `vg-fence` |
| Palace | 13 | `pg-marble`, `pg-marble-dark`, `pg-pillar`, `pg-pillar-simple`, `pg-gold`, `pg-gold-h`, `pg-stone`, `pg-carpet`, `pg-curtain`, `pg-sky`, `pg-candle-glow`, `pg-moon-glow`, `pg-throne-velvet` |

### Per-Tile Polish Summary
- **Jungle**: Gradient ground/dirt/platform bodies, rock cracks + highlight arcs, bush radial gradients + dappled light, vine layered leaves, flower radial petals + gold center, tree bark ridges, layered cloud shapes, mountain snow caps + ridge lines, sun rays, grass blades with yellow tips
- **Village**: Cobblestone highlight tops, wood grain nails + shadow gaps, house wall plaster dots, roof tile rows + ridge highlight, window glass sheen + interior glow, door panel bevels, fence post caps, chimney brick lines + smoke, straw texture lines, market canopy scallops + goods silhouettes
- **Palace**: Cylindrical pillar fluting lines, marble vein paths + polish dots, stone wall individual stone highlights, carpet gold stripe patterns, curtain fold gradients, candle radial glow + flame teardrop + wax drip, star cross-rays + varied sizes, moonlight halo + craters, throne metallic gradients + velvet + gold armrests, gold trim gem inlays

### Build Verification
```bash
npx tsx scripts/generate-tilesets.ts   # All 57 active tiles rendered, 3 empty tiles skipped
npm run lint                           # Zero TypeScript errors
npm run build                          # Clean build (2.89s)
```
No runtime code changes — tilesets load identically to before via Phaser's tilemap loader.

---

## Transition Architecture (May 2026 — Complete)

### TransitionManager (`src/systems/TransitionManager.ts`)
Static utility class. Single source of truth for all scene transition timing and color.

| Constant | Value | Meaning |
|----------|-------|---------|
| `FADE_DURATION` | 600ms | All full-scene and overlay transitions |
| `FADE_COLOR` | `{ r: 0x1a, g: 0x1a, b: 0x2e }` | Game's branded deep blue (#1a1a2e) — matches background |

| Method | Used When |
|--------|-----------|
| `toScene(from, target, data?)` | Fade out → scene.start (full page transitions) |

### Scene Transition Map
| From | To | Method | Duration |
|------|----|--------|----------|
| BootScene | PreloadScene | `TransitionManager.toScene()` | 600ms |
| PreloadScene | MenuScene | `TransitionManager.toScene()` | 600ms |
| MenuScene | LevelSelectScene | `TransitionManager.toScene()` | 600ms |
| LevelSelectScene | MenuScene (back) | `TransitionManager.toScene()` | 600ms |
| LevelSelectScene | GameScene | `TransitionManager.toScene()` | 600ms |
| GameScene | LevelSelectScene (quit) | `TransitionManager.toScene()` | 600ms |
| GameScene | GameScene (next level) | `TransitionManager.toScene()` | 600ms |
| UIScene pause | Restart/Quit | UIScene camera fade + scene.start | 600ms |
| WordPuzzleScene | Caller (close) | FadeOut WordPuzzle + fadeIn caller | 600ms |
| WordPuzzleScene | Caller (success) | FadeOut WordPuzzle + fadeIn caller | 600ms |
| DialogueScene | GameScene (close) | FadeOut Dialogue + fadeIn GameScene | 600ms |
| GameScene | BossScene (launch) | BossScene.fadeIn() on create | 600ms |
| GameScene | WordPuzzleScene (launch) | WordPuzzleScene.fadeIn() on create | 600ms |
| GameScene | DialogueScene (launch) | DialogueScene.fadeIn() on create | 600ms |

### Key Design Decisions
1. **UIScene pause menu uses UIScene's own camera** for fade (not GameScene's — GameScene is paused, so its camera tweens don't animate)
2. **`scene.restart()` replaced with `scene.start('GameScene')`** for Next Level — restart kills the camera mid-fade; scene.start cleanly shuts down old scene and creates new one that fades in
3. **Overlay close → fade out overlay camera, then fade in caller camera** — smooth cross-fade effect
4. **Pause menu buttons tracked in array** — all destroyed on Resume/Restart/Quit; `createPauseBtn` returns objects for cleanup
5. **LevelSelectScene starts menu music in `create()`** — `playMusicLoop` is a no-op when same track already playing, so it only kicks in when arriving from Quit (where music was stopped)
6. **All fade durations unified at 600ms** with branded #1a1a2e color — feels intentional, matches game palette

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
- [x] Screen transitions — DONE (unified TransitionManager, 600ms branded fades, all 11 scene transitions, overlay open/close fades, pause menu fix, music stop on quit)
- [x] Tileset visual polish — DONE (SVG gradients, highlights, texture patterns, depth cues — all 60 tiles across 3 worlds)
- [ ] Tilemap mobile testing — pending
- [ ] Progressive difficulty — pending (entity positions, enemy escalation, platform challenge vary per level)

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
3. **createTilemap()**: Checks `cache.tilemap.get()` + `textures.exists()` → `this.make.tilemap({ key, insertNull: true })` → `addTilesetImage()` → `createLayer()` × 5 layers with scroll factors → `platformsLayer.setCollisionByExclusion([-1])` → `this.platforms = platformsLayer`
4. **Fallback**: If tilemap/tileset not found or parse fails, calls `createProceduralLevel()` which uses the old rectangle-based approach

### Phaser 3.90 Compatibility (Critical)
Phaser 3.90 has stricter Tiled JSON parsing than 3.80. The tilemap JSON MUST include:
- `orientation: 'orthogonal'` — Phaser calls `toLowerCase()` on this; missing = crash
- `renderorder: 'right-down'` — required by parser
- Tileset must have `imagewidth`/`imageheight` (explicit, not inferred)
- Layer `id` fields must be present on each layer
- `insertNull: true` must be passed to `this.make.tilemap()` to handle gid 0 empty tiles
- `version`, `tiledversion`, `nextlayerid`, `nextobjectid` should be present
- Tileset `spacing` and `margin` should be explicit (0, not undefined)

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
| `src/scenes/GameScene.ts` | Core gameplay (~2250 lines) — `createTilemap()`, `createProceduralLevel()`, NPC dynamic hints (3 methods), monkey gem reward, `completedDoorWords`, enemy config, cross-world progression, `launchBossFight()` |
| `src/scenes/BossScene.ts` | Boss fights (~1272 lines) — per-attack SFX, per-world boss music, victory celebration |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay — puzzle music only for GameScene caller |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu with mute toggle |
| `src/scenes/DialogueScene.ts` | NPC conversation (~240 lines) — choice UI (`showChoices`, `handleChoice`), `onComplete(finalNodeId)`, typewriter timer fix |
| `src/scenes/MenuScene.ts` | Animated title menu with AudioManager music |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading — 5 tilemap JSONs + 3 tileset PNGs + sprites/UI |
| `src/systems/TouchControls.ts` | Left-half joystick + right-half jump zone + dynamic interact button |
| `src/systems/AudioManager.ts` | Unified audio: Web Audio SFX synthesis + Howler WAV music + Howler speech cache |
| `src/systems/TransitionManager.ts` | Screen transitions: `toScene()`, 600ms branded fades (#1a1a2e), FADE_DURATION/FADE_COLOR constants |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `src/config/GameConfig.ts` | Phaser config, Scale.FIT, activePointers:3 |
| `src/config/languages/hindi.json` | Hindi words + enemies + guards + boss data + NPC dialogues (5 monkey, 2 owl, 1 deer) |
| `public/data/hindi.json` | Runtime copy of hindi.json |
| `public/assets/audio/speech/hindi/dialogue/` | 11 NPC voice MP3s (monkey×6, owl×3, deer×2) |
| `public/assets/tilesets/jungle-tiles.png` | Jungle tileset spritesheet (320×256, 20 tiles) |
| `public/assets/tilesets/village-tiles.png` | Village tileset spritesheet (320×256, 20 tiles) |
| `public/assets/tilesets/palace-tiles.png` | Palace tileset spritesheet (320×256, 20 tiles) |
| `public/assets/tilesets/world-*-level-*.json` | 5 tilemap JSON files |
| `scripts/generate-sprites.ts` | Procedural sprite generation |
| `scripts/generate-tilesets.ts` | Generates 3 world-specific tileset spritesheets (20 tiles each, 320×256) |
| `scripts/generate-tilemaps.ts` | Programmatic level designer — generates 5 tilemap JSONs with terrain + object layers |
| `scripts/generate-music.ts` | 9-track WAV music generator (offline PCM synthesis) |
| `scripts/generate-speech.sh` | Hindi TTS generation (macOS `say` + Lekha voice + ffmpeg MP3) |
| `index.html` | DOM: viewport meta, #fs-btn, #rotate-prompt |
| `vite.config.ts` | host:'0.0.0.0' for LAN mobile testing |
| `docs/AI-SESSION-HANDOFF.md` | This file — quick start for new AI sessions |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

---

## Next Session: Start Here

The AI should read this file and `docs/12-progress-log.md`, then continue with the next task.

### Recommended Next Task: Progressive Difficulty
Entity positions in `scripts/generate-tilemaps.ts` currently reuse the same coordinates across all 5 levels (identical letter splays, door positions, gem/health locations). The layout functions already support per-level customization. Vary entity placement, enemy speed/cooldown escalation, and platform challenge per level to create a real difficulty curve:
- **World 1 Level 1** (tutorial): Easy — spread letters near ground, slow enemies, generous platforms
- **World 1 Level 2** (boss): Medium — letters on platforms, faster enemies, gap jumps
- **World 2 Level 1**: Medium — letters across wider area, mid-speed enemies
- **World 2 Level 2** (boss): Hard — high/tricky letter placement, fast enemies, complex platforms
- **World 3 Level 1** (boss): Hard — most challenging layout, fastest enemies, pillar jumps

### Secondary Tasks (in priority order)
1. **Tilemap Mobile Testing** — Full playthrough of all 5 tilemap-based levels on real iPhone/Android to verify tilemap rendering and performance.
2. **Mobile Testing** — Run `npm run dev` and test full game flow (all scenes, transitions, music) on iPhone 12 (iOS 18.7.8) + OnePlus Nord CE3 (Android 15).
