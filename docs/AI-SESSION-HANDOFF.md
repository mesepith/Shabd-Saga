# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 8, 2026) — Real Audio: Web Audio Synthesis, Unified AudioManager

### Mobile Testing Results (iPhone 12 iOS 18.7.8 + OnePlus Nord CE3 Android 15)
| Feature | iPhone | Android Phone | Status |
|---------|--------|---------------|--------|
| HUD (hearts, score, gems) | ✓ | ✓ | Done |
| Floating joystick move | ✓ | ✓ | Done |
| Right-half tap-to-jump | ✓ | ✓ | Done |
| Dynamic interact button (NPCs/guards) | ✓ | ✓ | Done |
| Drag-to-spell (WordPuzzle) | ✓ | ✓ | Done |
| Boss fights | ✓ | ✓ | Done |
| Fullscreen button | ✓ (Standalone hides tip) | ✓ ⛶ Fullscreen works | Done |
| Sound (letter pronunciation) | ✓ | ✓ | Done |
| Landscape lock + rotate prompt | ✓ | ✓ | Done |
| Bottom crop / blank space | ✓ No crop | ✓ No crop | Done |

### NEXT: Tiled Level Maps
| Order | Task | Why |
|-------|------|-----|
| ~~1~~ | ~~Enemy difficulty balancing~~ ✓ DONE May 7 | Per-level speed/cooldown config |
| ~~2~~ | ~~Boss sprites (proper art)~~ ✓ DONE May 8 | 3 unique 128×128 designs, gradients, per-boss scaling |
| ~~3~~ | ~~Real audio assets~~ ✓ DONE May 8 | Web Audio API synthesis — zero file downloads |
| 4 | Tiled level maps | Big creative project |

### What's Working
- All 9 Phaser scenes load and function
- Platformer, keyboard controls (WASD/arrows), Devanagari rendering, letter collection, WordBar
- WordPuzzle overlay with drag-to-spell + caller param for boss integration
- Doors + guards + letter consumption flow
- Level completion → stars → save
- NPC dialogue, Shadow Creeper enemies, stolen letter respawn
- Player animations, checkpoint/respawn
- Health pickups, WisdomGems, star rating
- World-specific parallax backgrounds, LevelSelectScene
- Letter Guard enemies (5 guards, word-specific door blocking, verify-not-consume)
- Boss fights — 3 unique bosses with WordPuzzleScene integration, polished attack visuals
- **Boss sprites**: 3 unique 128×128 designs (SVG + gradients), 6-frame idle anims, per-boss scale (2.0/2.2/2.4), per-boss spotlight glow, per-boss ambient particles
- **Real audio**: Web Audio API synthesis for all SFX (12 sounds) and music (4 procedural tracks). Zero MP3 downloads. Unified AudioManager singleton handles SFX, music, and speech (Howler.js cached). Mute toggle in pause menu persisted to localStorage.
- Touch controls: left half = floating joystick, right half = tap-anywhere-jump
- Dynamic interact button: appears only near NPCs/guards/boss vulnerable phase
- Landscape lock + rotate prompt overlay
- DOM fullscreen button (Android) / Add-to-Home-Screen tip (iPhone, hidden in standalone)
- Cross-browser audio unlock (iOS Safari: silent buffer + Howler context resume) — now delegates to AudioManager

---
## Audio Architecture (May 8)

### AudioManager (`src/systems/AudioManager.ts`)
Single singleton class replacing all scattered `this.sound.play()` / `new Howl()` calls across the codebase.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **SFX** | Web Audio API oscillators | 12 synthesized sounds: jump, collect, door-open, hurt, success, checkpoint, boss-attack, boss-slam, boss-minion, boss-hit, boss-defeated |
| **Music** | Web Audio API procedural patterns | 4 looping tracks: menu (C pentatonic 70bpm), world-1 jungle (E minor 90bpm), world-2 village (G major 80bpm), world-3 palace (D harmonic minor 75bpm) |
| **Speech** | Howler.js (cached) | Hindi word pronunciations + dialogue (real MP3s, already generated) |
| **Controls** | Master/sfx/music GainNodes | Mute/unmute toggled via pause menu, persisted to localStorage `shabd_saga_audio_muted` |

### SFX Synthesis
Each SFX creates transient oscillator chains — created per-call, no pre-buffering. 12 unique sound effects covering all game events.

### Music Generation
Procedural looping using `setInterval` at beat tempo, scheduling oscillator nodes ahead of playback position. Each track uses a different scale, tempo, and instrument profile.

### Speech Caching
Howler instances cached in `Map<string, Howl>`. 500ms debounce per path prevents spam on repeated collect/dialogue triggers.

---

## Touch Controls Architecture (May 7)

### Screen Layout (landscape 1280x720)
| Screen Half | Action | Behavior |
|-------------|--------|----------|
| **Left** (x < midX) | Touch anywhere → floating joystick | Drag to move, 12px dead zone, pointerId multitouch |
| **Right** (x >= midX) | Touch anywhere → jump | Hold for variable-height jump, pointerId multitouch |
| **Dynamic interact button** (center-right) | Appears only when actionable | 170x72px, "⚡ Interact", present near NPCs/guards/boss vulnerable |

### Controls Mapping
| Property | Consumer | How |
|----------|----------|-----|
| `touchControls.movementForce.x < -0.3` | `handleMovement()` | Move left |
| `touchControls.movementForce.x > 0.3` | `handleMovement()` | Move right |
| `touchControls.jumpHeld` | `handleMovement()` | Jump (hold = higher) |
| `touchControls.interactPressed` | `handleNPCInteraction()` / Boss update | Interact, then set `false` |

### Interact Button Visibility (GameScene)
- `showInteractButton()` called when nearGuard detected (updateGuards) or NPC overlap fires
- `hideInteractButton()` called via `manageInteractButton()` when neither is active
- **600ms grace period**: `nearNPC` survives short disconnects (jumping) — only clears after 600ms of no overlap
- BossScene: shown during VULNERABLE, hidden on ATTACKING/DEFEATED

### Movement Reset on Overlay Open
Before pausing for ANY overlay, the code calls:
```ts
this.player.setVelocityX(0);
this.player.setVelocityY(0);
this.touchControls?.reset();
```
This is in `openDoor()`, `openGuardPuzzle()`, `handleNPCInteraction()` (GameScene) and `launchBossPuzzle()` (BossScene).

---

## Mobile/Viewport Architecture

### CSS (index.html)
- `html, body`: `margin:0; padding:0; overflow:hidden; overscroll-behavior:none`
- `#game-container`: `position:fixed; top:0; left:0; right:0; bottom:0` — fills viewport on all browsers
- No flexbox centering — Phaser's `Scale.FIT` + `CENTER_BOTH` handles canvas scaling natively
- `#fs-btn`: DOM button, `position:fixed` top-left, respects `env(safe-area-inset-*)`
- `#rotate-prompt`: Fullscreen overlay when `innerWidth < innerHeight`

### Viewport Meta (index.html)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="screen-orientation" content="landscape" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Audio Unlock (main.ts)
- **Direct import**: `import { Howler } from 'howler'` (NOT `window.Howler` — doesn't work with Vite bundler)
- **Mechanism**: On first `touchend`/`pointerdown` on `document.body`:
  1. Resume Phaser's AudioContext + play silent buffer (required by iOS)
  2. Resume Howler's AudioContext
- Retries on every tap until contexts are running
- Also resumes on `visibilitychange` (tab switch back)

### Fullscreen (main.ts + index.html)
- **Real DOM `<button id="fs-btn">`** in `index.html`, NOT a Phaser game object
- **Why**: `requestFullscreen()` requires genuine DOM click event on Android Chrome
- **Standalone detection**: `navigator.standalone` + `(display-mode: standalone)` media query — button hidden when already in PWA mode (iOS "Add to Home Screen")
- **Android**: Button "⛶ Fullscreen" → enters fullscreen → hides status bar + nav bar
- **iPhone**: Button "📲 Add to Home Screen" → shows tip. Hidden if already in standalone.
- On `fullscreenchange` event: re-show button when exiting fullscreen (swipe-to-exit), unless standalone

---

## Boss Fight Architecture
- `BossScene.ts` (~1240 lines, includes boss sprite + particle systems)
- **State machine**: ATTACKING → VULNERABLE → (SPELLING) → repeat until HP=0
- **3 attack patterns** (all originate visibly from boss):

| Attack | Visual | Behavior |
|--------|--------|----------|
| Shadow Bolts | Red-orange arrows, muzzle flash, fire trails | 3 bolts, mild homing (3% blend/frame), accelerates |
| Ground Slam | Boss drops to floor, vertical beam, impact explosion, rock burst | 2 shockwaves sweep left+right at full arena width |
| Shadow Minions | Magenta orbs, pink trails | 3 minions burst outward then home in on player |

- **Vulnerability**: 6s window, boss glows amber (`0x997744`), sentence shown at y=100-170 (above boss), dynamic interact button appears → tap → WordPuzzleScene(`caller:'BossScene'`)
- **Word data**: Pre-resolved by GameScene (LanguageManager.getWord cross-level) before launching BossScene
- **Continue button**: Click or Enter/Space. GameScene uses `this.events.once('resume', ...)` pattern (NOT `time.delayedCall` on paused scene — wouldn't fire).
- **Cleanup**: `cleanupAttack()` has null guards on destroyed groups. Shutdown listener removed (Phaser auto-cleans).

### Boss Sprite Architecture (May 8)
- **Base sprites**: 128×128 SVG → PNG, 6-frame spritesheets (768×128), generated by `scripts/generate-sprites.ts`
- **Rendering**: `bossConfig.spriteKey` dynamically selects spritesheet; scale varies by world: jungle 2.0, village 2.2, palace 2.4
- **No default tint** — natural sprite colors visible (was `0x440000` dark red crush). Tint only for: vulnerable amber, attack telegraph flash, damage white flash
- **Animation keys**: Unique per boss (`boss-idle-boss-jungle`, etc.) — NOT a shared global key. 6 frames at 6fps.
- **Ambient effects**: Per-boss spotlight (concentric circles behind boss, green/amber/purple palette) + orbiting particles (10/14/18 count by level)
- **Idle motion**: ±20px floating tween + scale pulse 2.0↔2.1 (or bossScale↔bossScale+0.1)

### Boss Tint State Machine
| State | Tint | Visual |
|-------|------|--------|
| ATTACKING (default) | **none** | Natural sprite colors + spotlight + particles |
| Attack telegraph | `0xFF2200`/`0xFF4400` (300ms) | Brief red flash, then clear |
| VULNERABLE | `0x997744` | Warm amber glow |
| Damage hit | `0xFFFFFF` (150ms) | White flash, then state tint |
| DEFEATED | `0xFFFFFF` then alpha 0 | Flash → spin + shrink over 1.5s |

### Boss Fight Flow
1. All doors opened → `levelComplete()` detects `level.boss`
2. GameScene pauses itself + UIScene, registers `this.events.once('resume', ...)`
3. Async pre-resolves word data → launches BossScene
4. Attack cycle: 4-6s attacks → 6s vulnerable (interact button shown) → repeat
5. 3 correct spells = boss defeated → victory particles + VICTORY text
6. Continue → stops BossScene → resumes GameScene → `'resume'` event → `completeLevelAndProgress()` → stars + save

---

## Enemy Difficulty Architecture (May 7)

### Per-Enemy Configurable Fields (in hindi.json)
Each `shadow-creeper` enemy entry now supports:
| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `speed` | number | 60-100 random | Patrol speed (px/sec) |
| `damage` | number | 1 | HP per hit |
| `contactCooldown` | number | 1500 | Minimum ms between hits from same enemy |
| `hitboxWidth` | number | 40 | Contact detection width (px) |
| `hitboxHeight` | number | 44 | Contact detection height (px) |
| `knockbackX` | number | 250 | Horizontal knockback force |
| `knockbackY` | number | -280 | Vertical knockback force |

### Difficulty Progression Per Level
| Level | Difficulty | Speed | Cooldown | Creepers |
|-------|-----------|-------|----------|----------|
| world-1-1 | 1 | 65-70 | 1800ms | 2 |
| world-2-1 | 1 | 75-80 | 1700ms | 2 |
| world-1-2 | 2 | 85-95 | 1400ms | 3 |
| world-2-2 | 2 | 95-100 | 1300-1350ms | 2 |
| world-3-1 | 3 | 110-120 | 1100-1200ms | 2 |

### Code Changed
- `spawnEnemies()` reads `speed`, `hitboxWidth`, `hitboxHeight` from JSON per enemy
- `updateEnemies()` reads `contactCooldown`, hitbox, knockback from `enemy.enemyData`
- `damagePlayer(amount?)` now accepts configurable damage (default 1)
- All fields backward-compatible — fall back to hardcoded defaults when absent in JSON

### Cross-World Progression Fix
- `getNextLevelId()` now checks `LanguageManager.getLevel()` to verify next level exists
- Falls through: `world-1-level-2` → `world-1-level-3` (missing) → `world-2-level-1` (valid)
- Next Level button extracts world from `nextLevelId` rather than current level's world
- End-of-game: `world-3-level-1` → `null` → only "Level Select" button shown

---

## Current Bugs / Pending
- [x] Boss fights: tested on mobile (iPhone + Android) — working
- [x] WordPuzzle drag-to-spell: tested on mobile — working
- [x] All 3 levels: tested end-to-end on mobile — working
- [x] Touch controls: right-half jump zone + dynamic interact button — verified on both platforms
- [x] Standalone mode: "Add to Home Screen" button hidden when PWA launched — fixed
- [x] Enemy difficulty balancing per level — DONE May 7 (per-creeper speed, cooldown, hitbox from JSON)
- [x] Cross-world progression: `getNextLevelId()` now navigates across worlds (was returning non-existent `world-1-level-3`)
- [x] Boss sprites: 3 unique 128×128 designs with gradients, per-boss scaling — DONE May 8
- [x] Music/SFX: real audio via Web Audio API synthesis, zero MP3 downloads — DONE May 8
- [ ] Tiled level maps not created

---

## How to Test
```bash
npm run dev        # http://localhost:5174 (also at LAN IP for mobile)
```

**Pre-set progress** (browser console) to skip to boss level:
```js
localStorage.setItem('shabd_saga_progress', JSON.stringify({languages:{hindi:{completedLevels:{"world-1-level-1":{levelId:"world-1-level-1",stars:3,wordsLearned:["baagh","haathi","mor","ped","nadee","phool"],gemsCollected:5,timeSpent:0,attempts:1,completedAt:"2026-05-05T00:00:00.000Z"}}}}}));
```
Then refresh → Level Select → World 1 → Level 2 → complete doors → Boss Fight triggers.

## How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```
```bash
npm run lint       # tsc --noEmit (type-check)
npm run build      # Vite production build
```

## File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, audio unlock, DOM fullscreen, orientation, iOS scroll-hide, standalone detection |
| `src/scenes/GameScene.ts` | Core gameplay (~1860 lines) — includes enemy difficulty config, cross-world progression |
| `src/scenes/BossScene.ts` | Boss fights (~1240 lines) — unique sprites, per-boss scaling, spotlights, particles |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay (caller param) |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated title menu |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading (includes boss spritesheets at 128×128) |
| `src/systems/TouchControls.ts` | Left-half joystick + right-half jump zone + dynamic interact button |
| `src/systems/AudioManager.ts` | Web Audio API SFX synthesis + procedural music + Howler speech cache |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `src/config/GameConfig.ts` | Phaser config, Scale.FIT, activePointers:3 |
| `src/config/languages/hindi.json` | Hindi words + enemies + guards + boss data |
| `public/data/hindi.json` | Runtime copy of hindi.json |
| `scripts/generate-sprites.ts` | Procedural sprite generation — player, NPCs, 3× boss designs (128×128, 6-frame, gradients) |
| `index.html` | DOM: viewport meta, #fs-btn, #rotate-prompt, #fs-tip |
| `vite.config.ts` | host:'0.0.0.0' for LAN mobile testing |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

(End of file)
