# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 4, 2026) — Phase 4 In Progress

### What's Working
- All 9 Phaser scenes load and function
- Platformer: run, jump (variable height), staircase platforms
- Touch controls (virtual buttons for move/jump/interact)
- Devanagari letters render as text on sprites
- Letter collection with Howler.js pronunciation audio + SFX
- WordBar HUD showing collected letter tiles
- WordPuzzle overlay (drag letters to spell, close button, caller-aware)
- Doors auto-trigger puzzle on touch (6 door positions, all words covered)
- Collected letters consumed on door solve, tiles removed from WordBar
- Level completion saves to localStorage with star rating
- NPC dialogue triggers + audio
- Shadow Creeper enemies (patrol, steal letters, damage, per-enemy cooldown)
- Stolen letters: 60s lifespan, fall with gravity, land on platforms, respawn on expiry
- Player animations (idle 2-frame, run 4-frame spritesheets)
- Checkpoint/respawn system with death counter
- SFX + level music (placeholder audio)
- **Health pickups** — floating ❤️ restores 1 HP (max 3)
- **WisdomGems** — collectible gems with particle effects, shown in UI
- **Star rating** — calculated from deaths + gems collected (not hardcoded 3)
- **World-2/3 parallax backgrounds** — village houses, palace pillars + moon
- **LevelSelectScene level buttons** — per-world sub-menu with individual level access

### ⚠️ BOSS FIGHT — NEEDS MAJOR WORK
The BossScene currently has a **placeholder simulated auto-win** mechanic:
- Boss arena appears (boss sprite, player sprite, health bar, attack patterns)
- Attacks fire (shadow bolts, ground waves, minions) — player can dodge
- After each attack, boss shows vulnerability text: `Spell: "X"`
- **After 2 seconds it auto-damages the boss** (simulated win, no real puzzle)
- Boss defeated → "Continue" button → returns to LevelSelectScene
- **WordPuzzleScene integration was attempted and reverted** — broke the scene

**What needs to be built:**
1. Replace simulated auto-win in `showSpellPrompt()` with actual WordPuzzleScene launch
2. WordPuzzleScene needs boss word data (splitLetters for the required word)
3. On correct spell → damage boss (1 HP per correct spell)
4. Boss sentences reference words from ALL levels, not just current level
5. Clear UI: boss turns green when vulnerable, show which word to spell, countdown timer
6. Keep the dodge/attack mechanic working (player HP, invincibility frames)

**Key code locations:**
- `BossScene.showSpellPrompt()` (line ~270) — simulated auto-win timer
- `GameScene.levelComplete()` (line ~612) — launches BossScene with `{ bossConfig, collectedWords }`
- `BossScene.bossDefeated()` — uses `onBossDefeatedCallback` if provided, else navigates to LevelSelectScene
- Boss sentences in `hindi.json` reference words from different levels (e.g., world-1-level-2 boss requires "baagh" from level-1)

### Recent Changes (May 4 — Phase 4 Implementation)
- [x] BossScene launched from GameScene.levelComplete() when level.boss exists
- [x] BossScene.showSpellPrompt() launches WordPuzzleScene (caller='BossScene')
- [x] WordPuzzleScene supports caller param (resumes caller instead of hardcoded GameScene)
- [x] BossScene: player HP, invincibility, death handling in arena
- [x] Boss defeated → SaveManager.completeLevel() → LevelSelectScene
- [x] Health pickups spawned procedurally (2 per level), restore 1 HP on overlap
- [x] WisdomGems spawned (5 per level), diamond shape with sparkle, burst particles on collect
- [x] UIScene: gem counter display, gemCollected event listener
- [x] Star rating: 1★ base + 1★ no deaths + 1★ 3+ gems
- [x] Level complete UI: star display + Next Level button for same-world progression
- [x] World-specific parallax: jungle (green mountains+sun), village (warm houses+sun), palace (purple pillars+moon)
- [x] LevelSelectScene: clicking a world opens level sub-menu with individual level buttons
- [x] Level unlock chaining: must complete previous level to access next

### Bugfixes (May 4 — session 2)

**Event emitter bug** — all HUD events emitted on `uiScene.events` but UIScene listened on `gameScene.events` (different Phaser EventEmitters). Fixed `letterCollected`, `letterStolen`, `gemCollected` to emit on `this.events` (GameScene). WordBar counter, gem counter now update correctly.

**Stolen letter gravity** — `lettersGroup` default `allowGravity: false` overrode the explicit `true` via `group.add()`. Fixed by adding to group FIRST, setting gravity AFTER. Also added `immovable = false` + `setCollideWorldBounds(true)` so letters collide with platforms instead of falling through world. Added `this.physics.add.collider(lettersGroup, platforms)` for platform landing.

**Gem/Health pickup collision** — gems and health pickups used invisible alpha:0 sprites with decoupled Graphics visuals. Replaced with visible tinted sprites + text labels, matching working letter pattern. Groups now have `immovable: true`.

**Collected letters not consumed on puzzle solve** — opening a door didn't remove used letters from `collectedLetters`. Enemy steals could then target letters needed for remaining doors. Fixed by filtering `collectedLetters` on `wordSpelled` + emitting `letterConsumed` to UIScene (removes WordBar tiles, slides remaining).

**Stolen letter lifetime** — timer was 30s, expiry destroyed letter permanently (soft-lock). Now 60s with flash warning at 10s remaining. On expiry, letter RESPAWNS at camera position with blue glow + "reappeared!" message — never permanently lost.

### Current Bugs / Pending
- [ ] Music/SFX: silent placeholders (need real audio in Phase 5)
- [ ] Tiled level maps not created
- [ ] Letter Guard enemy type not implemented (Phase 3 leftover)
- [ ] Enemy difficulty balancing per level

### Key Architecture Notes
- Language JSON served from `public/data/hindi.json` (NOT `src/config/`)
- Letter rendering: Phaser text on sprites (not individual Devanagari PNGs)
- Audio: `import { Howl } from 'howler'` at module level in GameScene
- Vite dev port: **5174**
- Font: Noto Sans Devanagari via Google Fonts in index.html
- JSON must be synced: `cp src/config/languages/hindi.json public/data/hindi.json`
- **BossScene data flow**: GameScene passes `{ bossConfig, collectedWords, onBossDefeated }` — `collectedWords` is string[] of word IDs the player has learned
- **WordPuzzleScene `caller` param**: supports 'BossScene' to resume correct scene after puzzle (set via `caller` data field)
- **Boss sentences reference words from any level** — e.g. world-1-level-2 boss requires "baagh" which is from level-1. Need to pass ALL words from the language data when integrating real puzzle.
- **Event emission**: always use `this.events` in GameScene for events UIScene listens to
- **Group defaults override**: always set `allowGravity`/`immovable` AFTER `group.add()`
- **Stolen letter flow**: `stealLetter()` → pop from `collectedLetters` → add to group → set gravity → respawn on expiry
- **Letter consumption**: on `wordSpelled` → filter `collectedLetters` by wordId → emit `letterConsumed` → UIScene removes tiles
- **Pickup pattern**: use visible tinted sprite + text label, NOT invisible sprite + separate Graphics visual

### Phase 4 Remaining
1. Letter Guard enemy type (word-blocking mechanic)
2. Enemy difficulty balancing per level
3. Boss sprites (currently uses 'enemy-placeholder')
4. Tiled level maps

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap |
| `src/scenes/GameScene.ts` | Core gameplay (~1550 lines, boss wiring, pickups, gems, stars, letter respawn) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle (caller-aware for GameScene/BossScene) |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score, gem count, letterConsumed handler) |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World + level select with sub-menus |
| `src/scenes/BossScene.ts` | Boss battle arena with WordPuzzle integration |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/config/languages/hindi.json` | Source of truth for Hindi words |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json |
| `src/systems/SaveManager.ts` | localStorage progress |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |
