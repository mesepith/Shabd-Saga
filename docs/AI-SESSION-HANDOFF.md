# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 7, 2026) — Enemy Difficulty Balanced, Cross-World Progression Fixed

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

### NEXT: Boss Sprites (Proper Art)
| Order | Task | Why |
|-------|------|-----|
| ~~1~~ | ~~Enemy difficulty balancing~~ ✓ DONE May 7 | Per-level speed/cooldown config, ~1860→~1860 lines GameScene |
| 2 | **Boss sprites (proper art)** | Currently scaled-up 'enemy-placeholder' ×3 |
| 3 | Real audio assets | Big creative project |
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
- Boss fights — 3 bosses with WordPuzzleScene integration, polished attack visuals
- Touch controls: left half = floating joystick, right half = tap-anywhere-jump
- Dynamic interact button: appears only near NPCs/guards/boss vulnerable phase
- Landscape lock + rotate prompt overlay
- DOM fullscreen button (Android) / Add-to-Home-Screen tip (iPhone, hidden in standalone)
- Cross-browser audio unlock (iOS Safari: silent buffer + Howler context resume)

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
- `BossScene.ts` (~1100 lines)
- **State machine**: ATTACKING → VULNERABLE → (SPELLING) → repeat until HP=0
- **3 attack patterns** (all originate visibly from boss):

| Attack | Visual | Behavior |
|--------|--------|----------|
| Shadow Bolts | Red-orange arrows, muzzle flash, fire trails | 3 bolts, mild homing (3% blend/frame), accelerates |
| Ground Slam | Boss drops to floor, vertical beam, impact explosion, rock burst | 2 shockwaves sweep left+right at full arena width |
| Shadow Minions | Magenta orbs, pink trails | 3 minions burst outward then home in on player |

- **Vulnerability**: 6s window, boss glows amber, sentence shown, dynamic interact button appears → tap → WordPuzzleScene(`caller:'BossScene'`)
- **Word data**: Pre-resolved by GameScene (LanguageManager.getWord cross-level) before launching BossScene
- **Continue button**: Click or Enter/Space. GameScene uses `this.events.once('resume', ...)` pattern (NOT `time.delayedCall` on paused scene — wouldn't fire).
- **Cleanup**: `cleanupAttack()` has null guards on destroyed groups. Shutdown listener removed (Phaser auto-cleans).

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
- [ ] Music/SFX: silent placeholders (need real audio)
- [ ] Boss sprites: uses scaled-up 'enemy-placeholder' (next priority)
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
| `src/scenes/BossScene.ts` | Boss fights (~1120 lines) |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay (caller param) |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated title menu |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/systems/TouchControls.ts` | Left-half joystick + right-half jump zone + dynamic interact button |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `src/config/GameConfig.ts` | Phaser config, Scale.FIT, activePointers:3 |
| `src/config/languages/hindi.json` | Hindi words + enemies + guards + boss data |
| `public/data/hindi.json` | Runtime copy of hindi.json |
| `index.html` | DOM: viewport meta, #fs-btn, #rotate-prompt, #fs-tip |
| `vite.config.ts` | host:'0.0.0.0' for LAN mobile testing |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

(End of file)
