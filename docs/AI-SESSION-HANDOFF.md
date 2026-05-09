# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 2026) — Audio Complete: 9 WAV Music Tracks, Boss SFX, Dialogue Fixed

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

### NEXT: NPC Dialogue Choice UI → Tiled Level Maps
| Order | Task | Why |
|-------|------|-----|
| ~~1~~ | ~~Enemy difficulty balancing~~ ✓ | Per-level speed/cooldown config |
| ~~2~~ | ~~Boss sprites (proper art)~~ ✓ | 3 unique 128×128 designs |
| ~~3~~ | ~~Real audio assets~~ ✓ | 9 WAV tracks + synthesized SFX |
| 4 | **NPC dialogue choice UI** | Monkey has 2 choices, currently auto-picks first. Small scope, completes dialogue system |
| 5 | Tiled level maps | Big creative project |

### What's Working
- All 9 Phaser scenes load and function
- Platformer, keyboard controls (WASD/arrows), Devanagari rendering, letter collection, WordBar
- WordPuzzle overlay with drag-to-spell + caller param for boss integration
- Doors + guards + letter consumption flow
- Level completion → stars → save
- NPC dialogue (choices auto-advance, audio plays per node)
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

## Dialogue Architecture (Fixed May 2026)

### DialogueScene Flow
1. NPC approached → E key or interact button → `handleNPCInteraction()`
2. Music fades out (400ms)
3. DialogueScene launches with `npcData.dialogues` array
4. `showNode()` plays audio via `AudioManager.speakDialogue()`
5. Typewriter effect renders Hindi text character-by-character
6. Tap/Space/Enter to advance: first tap skips typewriter, second tap advances to next node
7. After last node → `endDialogue()` → fade out → resume GameScene + music

### Node Navigation
```typescript
const nextId = this.currentNode.choices?.[0]?.nextNodeId || this.currentNode.nextNodeId;
```
Supports both JSON formats: `nextNodeId` directly on node, OR `choices[0].nextNodeId`.

### Known: Choice UI Not Yet Built
Monkey NPC has 2 dialogue choices ("Sure!" / "Maybe later"). Current code picks the first one automatically. A visible choice button row inside the dialogue box is the recommended next task.

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
- [x] Dialogue choices: `advance()` now reads `choices[0].nextNodeId` — working
- [x] Dialogue audio: `Howler.stop()` global call removed, speech plays fully — fixed
- [ ] NPC dialogue choice UI — monkey's 2 choices need visible buttons
- [ ] Tiled level maps not created

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
| `src/scenes/GameScene.ts` | Core gameplay (~1846 lines) — enemy config, cross-world progression, `launchBossFight()` |
| `src/scenes/BossScene.ts` | Boss fights (~1272 lines) — per-attack SFX, per-world boss music, victory celebration |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay — puzzle music only for GameScene caller |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu with mute toggle |
| `src/scenes/DialogueScene.ts` | NPC conversation — choices support, persistent keyboard keys, audio per node |
| `src/scenes/MenuScene.ts` | Animated title menu with AudioManager music |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading (sprites only — no audio preloads needed) |
| `src/systems/TouchControls.ts` | Left-half joystick + right-half jump zone + dynamic interact button |
| `src/systems/AudioManager.ts` | Unified audio: Web Audio SFX synthesis + Howler WAV music + Howler speech cache |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `src/config/GameConfig.ts` | Phaser config, Scale.FIT, activePointers:3 |
| `src/config/languages/hindi.json` | Hindi words + enemies + guards + boss data |
| `public/data/hindi.json` | Runtime copy of hindi.json |
| `scripts/generate-sprites.ts` | Procedural sprite generation |
| `scripts/generate-music.ts` | 9-track WAV music generator (offline PCM synthesis) |
| `index.html` | DOM: viewport meta, #fs-btn, #rotate-prompt |
| `vite.config.ts` | host:'0.0.0.0' for LAN mobile testing |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

---

## Recommended Next Task
### NPC Dialogue Choice UI
The monkey NPC has 2 dialogue choices but the UI auto-picks the first one. Adding clickable choice buttons inside `DialogueScene` would complete the dialogue system (~50 lines of code). Small scope, high impact.

After that: Tiled Level Maps — the biggest visual/design upgrade remaining.
