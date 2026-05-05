# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 6, 2026) — Mobile Bugfixes: HUD, Blank Space, Auto-Move

### NEXT TASK: Mobile Testing Round 2 (iPhone Safari + Android Chrome)
1. Verify HUD (hearts, diamonds, score) now visible at top of screen on mobile
2. Verify no blank space on left side — canvas fills full screen including notch area
3. Verify player does NOT auto-move after closing WordPuzzle or Dialogue overlays
4. Verify floating joystick + jump/interact buttons work correctly
5. Fix any remaining mobile-specific bugs

### Priority After Mobile
| Order | Task | Why |
|-------|------|-----|
| 1 | Mobile testing + fixes | Critical for target audience (kids on phones) |
| 2 | Enemy difficulty balancing | Quick JSON data tweaks |
| 3 | Boss sprites (proper art) | Currently scaled-up placeholder |
| 4 | Real audio assets | Big creative project |
| 5 | Tiled level maps | Big creative project |

### What's Working
- All 9 Phaser scenes load and function
- Platformer, keyboard controls (WASD/arrows), Devanagari rendering, letter collection, WordBar
- WordPuzzle overlay with drag-to-spell + caller param for boss integration
- Doors + guards + letter consumption flow
- Level completion → stars → save
- NPC dialogue, Shadow Creeper enemies, stolen letter respawn
- Player animations, checkpoint/respawn, SFX/music placeholders
- Health pickups, WisdomGems, star rating
- World-specific parallax backgrounds, LevelSelectScene
- Letter Guard enemies (5 guards, word-specific door blocking, verify-not-consume)
- Boss fights — 3 bosses with real WordPuzzleScene integration, polished visuals
- **Floating joystick touch controls** (replaced old ◀ ▶ ▲ d-pad)
- **Browser resize fix** — no longer breaks layout when resizing desktop window
- **Landscape lock + rotate prompt** — portrait shows "Please rotate your device" overlay

### Touch Controls Architecture (NEW May 6)
- `src/systems/TouchControls.ts` — reusable class for all touch input (~170 lines)
- **Mobile detection**: `TouchControls.isTouchDevice(scene)` — uses Phaser device API + `navigator.maxTouchPoints` fallback. Works on Chrome, Safari, Android, iPhone.
- **Floating joystick**: Left half of screen (bottom 48%), touch anywhere → ring + knob appear. Drag → `movementForce.x` (-1 to 1). 12px dead zone. PointerId tracking for multitouch.
- **Jump button**: Right side, bottom area, 72px circle, ▲ label. Hold for full jump, release early for variable-height jump (cuts velocity at `-150`).
- **Interact button**: Right side, above jump, 60px circle, 💬 label. One-shot — consumer resets via `touchControls.interactPressed = false`.
- **Multitouch**: Left thumb (joystick) + right thumb (buttons) work simultaneously via independent pointerId tracking.
- Scene integration: `GameScene.ts` and `BossScene.ts` each have `private touchControls?: TouchControls`. Initialized in `setupInput()` only if `TouchControls.isTouchDevice()` returns true. Cleaned up in `shutdown` handler.
- Desktop: No on-screen controls (keyboard only). Touch laptops: controls appear alongside keyboard.

### Controls Mapping
| Old (d-pad) | New (TouchControls) | Consumer |
|-------------|---------------------|----------|
| `touchLeft` | `touchControls.movementForce.x < -0.3` | `handleMovement()` |
| `touchRight` | `touchControls.movementForce.x > 0.3` | `handleMovement()` |
| `touchJump` | `touchControls.jumpHeld` | `handleMovement()` |
| `touchInteract` | `touchControls.interactPressed` (then set to false) | `handleNPCInteraction()` / Boss update |

### Resize Fix
- **Root cause**: `game.scale.resize(window.innerWidth, window.innerHeight)` in `main.ts` forced game internal resolution to window size, breaking camera + UI.
- **Fix**: Removed `scale.resize()` call. Phaser's `Scale.FIT` + `CENTER_BOTH` handles canvas scaling natively.
- **Added**: `min: { 640, 360 }` and `max: { 1920, 1080 }` to scale config in `GameConfig.ts`.

### Landscape Lock + Rotate Prompt
- `<meta name="screen-orientation" content="landscape">` in `index.html` + `lockOrientation('landscape')` in BootScene
- `#rotate-prompt` overlay div in `index.html` — shown when `innerWidth < innerHeight`
- `main.ts` — `checkOrientation()` called on `resize` and `orientationchange` (with 50ms defer for Safari)
- Works on Chrome, Safari, Android Chrome, iPhone Safari
- Also shows on desktop if browser window is taller than wide

### Boss Fight Architecture (Post-Polish)
- `BossScene.ts` (~1100 lines after touch control migration)
- **State machine**: ATTACKING → VULNERABLE → (SPELLING) → repeat until HP=0
- **3 attack patterns** — all originate visibly from the boss:

| Attack | Visual | Behavior |
|--------|--------|----------|
| Shadow Bolts | Red-orange arrows, muzzle flash, fire trails | 3 bolts with spread, mild homing (curves toward player), accelerates |
| Ground Slam | Boss drops to floor, vertical beam, impact explosion, rock burst | 2 shockwaves sweep left + right across full arena edges |
| Shadow Minions | Magenta orbs, pink trails, spawn from boss | 3 minions burst outward, then home in on player, burst on expire |

- **Boss slam animation**: boss shakes (telegraph), drops 250px to floor, vertical crack beam, impact particles, rises back up
- **Vulnerability phase**: 6s window, boss glows amber, sentence + required words shown, E/tap → WordPuzzleScene with `caller: 'BossScene'`
- **Word data**: Pre-resolved by GameScene (LanguageManager.getWord cross-level) before launching BossScene
- **Touch controls**: Floating joystick + jump/interact buttons (same TouchControls class as GameScene)
- **Puzzle close handling**: Detects `!this.scene.isActive('WordPuzzleScene')` in update loop → attack cycle resumes
- **Player death**: Arena reset, full HP, boss sentences reset (no progress lost)
- **cleanupAttack()**: Fades projectiles/minions at full velocity (waves reach edges), guarded against destroyed groups
- **Continue button**: Click OR Enter/Space. GameScene listens for its own `'resume'` event → calls `completeLevelAndProgress()`

### Boss Fight Flow
1. All doors opened → `levelComplete()` detects `level.boss`
2. GameScene pauses itself + UIScene, registers `this.events.once('resume', ...)` for post-boss
3. Async pre-resolves word data (LanguageManager.getWord) → launches BossScene
4. Boss attack cycle: 4-6s attacks → 6s vulnerable → repeat
5. Player spells key words during vulnerability → each correct = 1 HP damage
6. 3 correct spells = boss defeated → victory particles + VICTORY text
7. Click Continue (or Enter/Space) → stops BossScene → resumes GameScene → `'resume'` event → `completeLevelAndProgress()` → stars + save

### Current Bugs / Pending
- [ ] Boss fights NOT tested on mobile (iPhone/Android) — floating joystick controls may need tweaks
- [ ] Music/SFX: silent placeholders (need real audio)
- [ ] Tiled level maps not created
- [ ] Enemy difficulty balancing per level
- [ ] Boss sprites: uses scaled-up 'enemy-placeholder'

### How to Test
```bash
npm run dev        # http://localhost:5174 (also at LAN IP for mobile)
```
**Pre-set progress** (browser console) to skip to boss level:
```js
localStorage.setItem('shabd_saga_progress', JSON.stringify({languages:{hindi:{completedLevels:{"world-1-level-1":{levelId:"world-1-level-1",stars:3,wordsLearned:["baagh","haathi","mor","ped","nadee","phool"],gemsCollected:5,timeSpent:0,attempts:1,completedAt:"2026-05-05T00:00:00.000Z"}}}}}));
```
Then refresh → Level Select → World 1 → Level 2 → complete doors → Boss Fight triggers.

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap, orientation detection |
| `src/scenes/GameScene.ts` | Core gameplay (~1790 lines, TouchControls integration) |
| `src/scenes/BossScene.ts` | Boss fight (~1100 lines, TouchControls integration) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle overlay (caller param supports boss) |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score, gem count, letterConsumed handler) |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World + level select with sub-menus |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/systems/TouchControls.ts` | **NEW** — Floating joystick + jump/interact buttons |
| `src/config/languages/hindi.json` | Source of truth: Hindi words + enemies + guards + boss data |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, interfaces, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `vite.config.ts` | `host: '0.0.0.0'` for LAN mobile testing |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |

(End of file - total 164 lines)
