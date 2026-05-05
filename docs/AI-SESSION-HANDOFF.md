# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should also read `docs/12-progress-log.md` for full history.

## Quick Status (May 6, 2026) — Mobile Verified, Ready for Next Phase

### Mobile Testing Results (iPhone 12 iOS 18.7.8 + OnePlus Nord CE3 Android 15)
| Feature | iPhone | Android Phone | Status |
|---------|--------|---------------|--------|
| HUD (hearts, score, gems) | ✓ Visible | ✓ Visible | Done |
| Floating joystick move/jump | ✓ | ✓ | Done |
| Interact button (guards/NPCs) | ✓ | ✓ | Done |
| Drag-to-spell (WordPuzzle) | Pending test | Pending test | **NEXT** |
| Boss fights | Pending test | Pending test | **NEXT** |
| Fullscreen button | 📲 Add to Home (iOS limitation) | ✓ ⛶ Fullscreen works | Done |
| Sound (letter pronunciation) | ✓ Working (after iOS unlock fix) | ✓ | Done |
| Landscape lock + rotate prompt | ✓ | ✓ | Done |
| Bottom crop / blank space | ✓ No crop | ✓ No crop (after fullscreen) | Done |

### NEXT: Complete Mobile Testing
1. Test drag-to-spell on both devices in WordPuzzleScene
2. Test boss fights on both devices (use pre-set progress below)
3. Test all 3 levels end-to-end on both devices
4. Fix any remaining touch/UI issues found

### Priority After Mobile Testing
| Order | Task | Why |
|-------|------|-----|
| 1 | Complete mobile testing | Verify boss fights + drag-to-spell |
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
- Player animations, checkpoint/respawn
- Health pickups, WisdomGems, star rating
- World-specific parallax backgrounds, LevelSelectScene
- Letter Guard enemies (5 guards, word-specific door blocking, verify-not-consume)
- Boss fights — 3 bosses with WordPuzzleScene integration, polished attack visuals
- Floating joystick touch controls (replaced old ◀ ▶ ▲ d-pad)
- Landscape lock + rotate prompt overlay
- DOM fullscreen button (Android) / Add-to-Home-Screen tip (iPhone)
- Cross-browser audio unlock (iOS Safari: silent buffer + Howler context resume)

---

## Mobile/Viewport Architecture (May 6)

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
- **Why**: `requestFullscreen()` requires genuine DOM click event on Android Chrome. Phaser's canvas `pointerdown` is NOT recognized as a user gesture on some devices.
- **Android**: Button "⛶ Fullscreen" → enters fullscreen → hides status bar + nav bar → full game visible
- **iPhone**: Button "📲 Add to Home Screen" → shows tip overlay ("Add to Home Screen for fullscreen")
- On `fullscreenchange` event: re-show button when exiting fullscreen (swipe-to-exit)

### Touch Controls (src/systems/TouchControls.ts)
- `TouchControls` class (~250 lines). Reusable across GameScene + BossScene.
- `TouchControls.isTouchDevice(scene)` — Phaser device API + `navigator.maxTouchPoints` fallback
- **Floating joystick**: Left half of screen, bottom 48%. Touch → ring+knob appear. Drag → `movementForce.x` (-1..1). 12px dead zone. pointerId multitouch.
- **Jump button**: Right side, y=620 (height-100), 72px, ▲. `jumpHeld` continuous for variable-height jump.
- **Interact button**: Right side, y=530 (height-190), 60px, 💬. `interactPressed` one-shot (consumer resets).
- **reset()**: Clears all state + hides joystick. Called before launching any overlay (WordPuzzle, Dialogue, Boss puzzle) to prevent auto-move after close.
- Desktop: controls not shown (keyboard only). Touch laptops: controls appear.

### Controls Mapping
| Property | Consumer | How |
|----------|----------|-----|
| `touchControls.movementForce.x < -0.3` | `handleMovement()` | Move left |
| `touchControls.movementForce.x > 0.3` | `handleMovement()` | Move right |
| `touchControls.jumpHeld` | `handleMovement()` | Jump (hold = higher) |
| `touchControls.interactPressed` | `handleNPCInteraction()` / Boss update | Interact, then set `false` |

### Movement Reset on Overlay Open
Before pausing for ANY overlay, the code calls:
```ts
this.player.setVelocityX(0);
this.player.setVelocityY(0);
this.touchControls?.reset();
```
This is in `openDoor()`, `openGuardPuzzle()`, `handleNPCInteraction()` (GameScene) and `launchBossPuzzle()` (BossScene).

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

- **Vulnerability**: 6s window, boss glows amber, sentence shown, E/tap → WordPuzzleScene(`caller:'BossScene'`)
- **Word data**: Pre-resolved by GameScene (LanguageManager.getWord cross-level) before launching BossScene
- **Continue button**: Click or Enter/Space. GameScene uses `this.events.once('resume', ...)` pattern (NOT `time.delayedCall` on paused scene — wouldn't fire).
- **Cleanup**: `cleanupAttack()` has null guards on destroyed groups. Shutdown listener removed (Phaser auto-cleans).

### Boss Fight Flow
1. All doors opened → `levelComplete()` detects `level.boss`
2. GameScene pauses itself + UIScene, registers `this.events.once('resume', ...)`
3. Async pre-resolves word data → launches BossScene
4. Attack cycle: 4-6s attacks → 6s vulnerable → repeat
5. 3 correct spells = boss defeated → victory particles + VICTORY text
6. Continue → stops BossScene → resumes GameScene → `'resume'` event → `completeLevelAndProgress()` → stars + save

---

## Current Bugs / Pending
- [ ] Boss fights: NOT tested on mobile (iPhone + Android)
- [ ] WordPuzzle drag-to-spell: NOT tested on mobile
- [ ] Music/SFX: silent placeholders (need real audio)
- [ ] Tiled level maps not created
- [ ] Enemy difficulty balancing per level
- [ ] Boss sprites: uses scaled-up 'enemy-placeholder'

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
| `src/main.ts` | Entry point, audio unlock, DOM fullscreen, orientation, iOS scroll-hide |
| `src/scenes/GameScene.ts` | Core gameplay (~1800 lines) |
| `src/scenes/BossScene.ts` | Boss fights (~1100 lines) |
| `src/scenes/WordPuzzleScene.ts` | Spelling overlay (caller param) |
| `src/scenes/UIScene.ts` | HUD: health, WordBar, score, gems, pause menu |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated title menu |
| `src/scenes/LevelSelectScene.ts` | World + level selection |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/systems/TouchControls.ts` | Floating joystick + jump/interact buttons |
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
