# Progress Log

> Date-stamped log of development progress, blockers, and decisions.

---

## 2026-05-03 — Project Initialization & Phase 1-2 Build

### Completed
- [x] Full project planning and architecture design
- [x] Tech stack finalized (Phaser 3, TypeScript, Vite, Node.js/MongoDB)
- [x] All 13 documentation files
- [x] Project scaffolding (package.json, Vite, TypeScript, index.html)
- [x] All 9 Phaser scenes (Boot, Preload, Menu, LevelSelect, Game, UI, WordPuzzle, Boss, Dialogue)
- [x] All 4 core systems (LanguageManager, SaveManager, WordValidator, PronunciationEngine)
- [x] Node.js backend (Express + MongoDB routes, models, config)
- [x] Procedural asset generation (backgrounds, sprites, tilesets, letters, UI)
- [x] 28 Hindi word pronunciations + 3 dialogue clips (Lekha voice)
- [x] Zero TypeScript errors, clean Vite build
- [x] Platformer physics: run, jump (variable height), staircase platforms
- [x] Touch controls (virtual buttons for left/right/jump)
- [x] Letter collection with Devanagari text rendering
- [x] WordPuzzle overlay (drag-and-drop letter spelling)
- [x] Locked doors that trigger WordPuzzleScene
- [x] Pronunciation audio plays on letter collection (Howler.js + real Hindi MP3s)
- [x] WordBar HUD showing collected letter tiles
- [x] Level completion flow (all doors open → level complete → save progress)
- [x] SaveManager integration (localStorage)
- [x] Font: Noto Sans Devanagari loaded via Google Fonts

---

## 2026-05-03 — WordPuzzle & Door Fixes

### Issues Resolved
- [x] WordPuzzle modal not closable: Added ✕ Close button (top right), tap-to-remove from slots, better feedback messages
- [x] WordPuzzle rewritten: Cleaner drag-and-drop, slot tap-to-remove letters, better UI layout with Devanagari word display
- [x] Door re-trigger loop: Changed from boolean flag to 2s cooldown timer (`_lastTrigger`), prevents per-frame spam
- [x] Peacock (mor) door not working: Only 5 letter positions for 12 letters across 6 words → increased to 12 positions
- [x] Door labels changed from 🔒 to 🚪 for clarity
- [x] Created `docs/AI-SESSION-HANDOFF.md` — read this first in new AI sessions
- [x] Updated `docs/13-roadmap.md` with current progress markers

### Current Behavior
- 12 floating Devanagari letters (all 6 words have complete splitLetters)
- 3 orange doors at x=420, 550, 680 with word labels
- Walk into door → auto-opens WordPuzzle (with 2s cooldown)
- Puzzle has ✕ Close, drag-and-drop, Submit, Hint buttons
- Tap a filled slot to remove letter back to available
- Success → door opens, celebration particles
- All doors complete → Level Complete

### Remaining Issues
- Music/SFX: silent placeholders
- NPC dialogue: not wired
- Boss fights: not wired
- Tiled maps: not created

### Next Phase (Phase 3: Enemies & NPCs)
1. Wire up NPC dialogue triggers
2. Add Shadow Creeper enemies (patrol, steal letters)
3. Create real player sprite animations

### Session Handoff
- See `docs/AI-SESSION-HANDOFF.md` for quick-start in new chat
- See `docs/12-progress-log.md` for full history

### Issues Resolved
- [x] NPC green/black box: spriteKey mismatch (`npc-owl` vs `npc-placeholder`) — fixed in both JSON copies
- [x] Doors not appearing: Moved from x=1300 to x=420-680 (near player start), made larger (56x84), tinted orange (#FFAA44), added English labels
- [x] Doors not triggerable: Changed from E-key interaction to **auto-trigger on touch** — walk into a door and the word puzzle opens automatically
- [x] Door interaction flow: If not enough letters collected, shows "Need more letters for X!" hint
- [x] Added console logging throughout GameScene for debugging (loadLevelData, spawnDoors, openDoor)
- [x] Added permanent instruction text: "Collect letters → Walk into doors to unlock!"
- [x] JSON synced between `src/config/languages/` and `public/data/`

### Game Flow (Current)
```
1. Spawn → see 5 floating letters + orange doors on right
2. Collect Devanagari letters (hear pronunciation via Howler.js)
3. Letters appear in bottom WordBar
4. Walk into a door → auto-opens word puzzle
5. Drag letters to spell the word → door opens
6. Repeat for remaining doors → Level Complete
```

### Remaining Issues
- Music/SFX: intentionally silent placeholders (real audio in Phase 5)
- NPC interaction: NPCs spawn but don't trigger dialogue (Phase 3)
- Boss fights: not yet wired to level flow (Phase 4)
- Tiled level maps: not yet created (Phase 5)

## 2026-05-03 — Phase 3 Complete: Enemies, NPCs & Polish

### Completed
- [x] NPC dialogue triggers: Walk near NPC → 💬 prompt → press E/tap to launch DialogueScene
- [x] 3 NPC sprites loaded: owl, monkey, deer (individual keys, not just placeholder)
- [x] Touch interact button (💬) on mobile controls
- [x] DialogueScene auto-resumes GameScene on complete
- [x] Shadow Creeper enemies: purple sprites patrol left/right in defined zones
- [x] Enemy-player contact: steals a collected letter (drops it back), or damages if none
- [x] Stolen letter drops with gravity as re-collectible, despawns after 8s
- [x] Enemy attack cooldown: 2s invincibility frames with blinking red tint
- [x] Player death at 0 HP: death animation → respawn at last checkpoint
- [x] Checkpoint flags: gold rectangles, turn green on activate, save position
- [x] Respawn: restores 3 HP, clears invincibility, cancels open dialogues
- [x] Player spritesheet animations: idle (2-frame, 128x64) and run (4-frame, 256x64)
- [x] Player animation plays idle when standing, run when moving, static frame when airborne
- [x] SFX hooks: jump, collect, door-open, hurt, success play at appropriate events
- [x] Level music: auto-plays correct world-N.mp3 on level start, stops previous
- [x] PreloadScene now loads: player spritesheets, shadow-creeper, npc-owl/monkey/deer, all 3 music tracks
- [x] generate-sprites.ts extended: produces run-frame-0..3, run-sheet.png, idle-sheet.png
- [x] LanguageManager LevelData interface updated with optional enemies field
- [x] UIScene handles letterStolen event: removes last tile from WordBar
- [x] Zero TypeScript errors, clean Vite build

### Architecture Notes
- `GameScene.ts` grew from 627 to ~1134 lines — modular extraction planned for Phase 4
- `handleMovement()` now accepts optional `custom` params for programmatic control
- Enemy defaults per level are hardcoded in `spawnEnemies()` when hindi.json lacks enemy data
- Invincibility after damage: 2s with blinking white/red tint
- Music stops on NPC dialogue, resumes on dialogue complete
- Stolen letter text follows the falling sprite (updated in `updateEnemies()`)

### Decisions Made
1. Enemy data defaults in spawnEnemies() rather than requiring hindi.json changes — keeps JSON simple
2. Touch interact button (💬) placed at bottom-left of screen, separate from movement buttons
3. Spritesheets composed from individual SVG frames using sharp raw buffer compositing
4. SFX and music use Phaser's built-in sound manager for simplicity
5. Player animations only swap on ground state change to avoid jitter

---

## 2026-05-04 — Phase 3 Bugfixes

### Issues Resolved
- [x] Player stuck red after enemy contact: blink timer race condition — now tracked and explicitly cancelled
- [x] Enemy contact flaky/stealing all letters: added 1.5s per-enemy cooldown (`_lastContact` timestamp)
- [x] Stolen letters instantly re-collected: added `_stolenAt` timestamp, 600ms immunity in overlap handler
- [x] Stolen letters ejected in a cluster: spread velocity increased to ±250 X, −250 to −400 Y
- [x] Enemy contact never damaged health (only stole): now always calls `damagePlayer()` AND `stealLetter()`
- [x] Only 3 doors for 6 words: expanded `doorPositions` from 3 to 6 entries
- [x] All enemies fell to bottom due to gravity: set `allowGravity = false`, adjusted Y positions
- [x] Respawn after all doors done left player stuck: now checks `activeDoors.length === 0` and auto-triggers `levelComplete()`
- [x] Re-collected stolen letters had no audio: added `audioPath` to `collectedLetters[]` type and stolen letter sprite
- [x] Dialogue audio not playing: added Howler.js `play()` in DialogueScene `showNode()`
- [x] Black screen crash on level 2→3: removed `?.clear()` calls on groups — Phaser reuses instances, groups were partially destroyed
- [x] Level 3 (world-3-level-1) unsolvable: letter spawn positions expanded 12→20 to support words with 3+ splitLetters
- [x] Enemy contact entirely broken: replaced `physics.add.overlap()` with manual distance check in `updateEnemies()` — Phaser group overlaps silently fail on reused scenes
- [x] Enemies falling through world: group created with `allowGravity: false` (per-body setting was insufficient)
- [x] "Need more letters" after collecting all: removed `spawnFallbackLetters()` from startup (its overlap was the only active one, using wrong wordId). Added defensive wordId recovery in `collectLetter()` to fix stolen-letter cascade
- [x] Stolen letter lifespan 8s→30s with pulsing red glow for visibility
- [x] Invincibility reduced 2s→1s, knockback always applies on enemy contact

### Updated Files
- `src/scenes/GameScene.ts` — blink fix, enemy cooldown, damage logic, gravity, door positions, respawn check, audioPath
- `src/scenes/DialogueScene.ts` — added `audioPath` field, Howler playback in showNode
- `src/scenes/PreloadScene.ts` — (from Phase 3 initial) spritesheets, enemy, NPC, music
- `src/systems/LanguageManager.ts` — `enemies?` field in LevelData
- `scripts/generate-sprites.ts` — run-frame and spritesheet generation
- `src/config/languages/hindi.json` + `public/data/hindi.json` — enemy data, synced

### Pending (Phase 4)
- Wire boss fights to level completion flow
- Add collectible gems for bonus stars
- Create health pickup items
- Add world-2 and world-3 background parallax layers
- Balance enemy difficulty per level

---

## 2026-05-04 — Phase 4: Boss Fights, Gems, Health, Parallax & Level Select

### Completed
- [x] BossScene wired to GameScene.levelComplete(): checks `level.boss`, launches BossScene when all doors done
- [x] BossScene.showSpellPrompt() replaced simulated auto-win with real WordPuzzleScene integration
- [x] WordPuzzleScene made caller-aware (`caller` param: 'GameScene' or 'BossScene') for correct resume
- [x] BossScene: player HP system (3 HP), invincibility frames, knockback, death → arena reset
- [x] Boss defeated → SaveManager.completeLevel() → LevelSelectScene (via onBossDefeated callback)
- [x] Health pickup items: floating ❤️ cross, 2 per level, restore 1 HP (max 3) on overlap
- [x] WisdomGem collectibles: diamond-shaped gold gems, 5 per level, sparkle + burst particles on collect
- [x] UIScene: gem counter (`💎 N`) with pop-in animation, gemCollected event listener
- [x] Star rating system: 1★ base (all doors) + 1★ no deaths + 1★ 3+ gems collected
- [x] deathsThisLevel counter incremented in respawnAtCheckpoint()
- [x] Level complete UI: star display + "Next Level →" button for same-world progression
- [x] World-specific parallax backgrounds: Jungle (green mountains+sun), Village (warm houses+sun), Palace (purple pillars+moon)
- [x] createParallaxBackground() detects world number from levelId, switches color palettes + decorations
- [x] LevelSelectScene: clicking a world opens sub-menu panel with individual level buttons
- [x] Level buttons show name (Hindi/English), star rating, boss indicator, completion status
- [x] Level unlock chaining: next level only visible when previous completed
- [x] getWorldLevels() dynamically reads completedLevels from localStorage
- [x] hindi.json synced to public/data/
- [x] Zero TypeScript errors, clean Vite build (72.75 kB gzip: 18.80 kB)

### Files Modified
- `src/scenes/GameScene.ts` — boss wiring (+levelBoss, levelComplete→BossScene), health pickups, gems, star rating, deaths counter, world-specific parallax, Next Level button, getGemsCollected()
- `src/scenes/BossScene.ts` — full rewrite: WordPuzzle integration, onBossDefeated callback, player HP/combat, vulnerability timer, arena mechanics
- `src/scenes/WordPuzzleScene.ts` — caller param, dynamic scene resume (GameScene+UIScene or BossScene only)
- `src/scenes/UIScene.ts` — gem display + gemCollected event handler
- `src/scenes/LevelSelectScene.ts` — full rewrite: world sub-menus, level buttons, unlock chaining, star display
- `docs/AI-SESSION-HANDOFF.md` — updated status, architecture notes
- `public/data/hindi.json` — synced

### Architecture Decisions
1. BossScene receives `{ bossConfig, levelWords, collectedWordIds, onBossDefeated }` from GameScene
2. WordPuzzleScene `caller` param avoids hardcoded GameScene resume — cleanly supports BossScene too
3. Health/gems spawned procedurally (not in hindi.json) to keep JSON simple — positions are level defaults
4. Star rating: simple additive formula (1 + noDeaths + gems≥3) — easy to tune later
5. LevelSelectScene uses localStorage directly instead of SaveManager for simplicity in UI reading

### Known Edge Cases
- If WordPuzzleScene is closed during boss vulnerability, timer keeps running until expiry
- Boss spells use splitLetters directly as available letters (no pre-collection needed)
- Level-2 and beyond only reachable via "Next Level" button or LevelSelect sub-menu
- Health pickups/Gems respawn on level restart (clear+recreate in spawn methods)

### Pending (Phase 4/5)
- Letter Guard enemy type (word-blocking mechanic, Phase 3 leftover)
- Boss sprites (currently uses 'enemy-placeholder', needs boss spritesheets)
- Enemy difficulty balancing per level
- Real audio files (current are silent placeholders)
- Tiled level maps

---

## 2026-05-04 — Playtest Bugfix Session (6 issues resolved)

### Issues Resolved

**1. Event emitter mismatch — HUD never updated**
`gemCollected`, `letterCollected`, `letterStolen` events emitted on `uiScene.events` but UIScene listened on `gameScene.events` (different Phaser EventEmitters). Fixed all to emit on `this.events` (GameScene).

**2. Stolen letters floated away forever**
`lettersGroup` default `allowGravity: false` + `immovable: true` overrode stolen letter properties via `group.add()`. Fixed: add to group FIRST, then set `allowGravity = true` + `immovable = false` + `setCollideWorldBounds(true)`. Also added `physics.add.collider(lettersGroup, platforms)` so stolen letters land on platforms instead of falling through world.

**3. Gem & Health pickup collision never fired**
Both used invisible alpha:0 sprites with decoupled Graphics visuals; Graphics tween sent visuals far from physics body. Rewrote both to use visible tinted sprites + text labels (same pattern as working letters). Groups now have `immovable: true`.

**4. Collected letters not consumed on door puzzle solve**
Opening a door removed it from `activeDoors` but left letters in `collectedLetters`. Enemy steals could target letters needed for remaining doors. Fixed: filter `collectedLetters` on `wordSpelled`, emit `letterConsumed` event → UIScene removes WordBar tiles for that word and slides remaining tiles to fill gaps.

**5. Stolen letter timer = soft-lock**
30s timer destroyed letter permanently — door unopenable. Fixed: increased to 60s with flash warning last 10s. On expiry: `respawnLetter()` creates new letter at camera position with blue glow + "reappeared!" message. Player can NEVER permanently lose a letter.

**6. Stolen letters fell below screen**
No collision with platforms/ground meant letters fell through world. Fixed via #2 above (platform collider + world bounds).

### Files Modified
- `src/scenes/GameScene.ts` — `spawnGems()` rewrite, `spawnHealthPickups()` rewrite, `stealLetter()` gravity/bounds fix, `openDoor()` letter consumption, `updateEnemies()` expiry → respawn, `respawnLetter()` method, `lettersGroup ↔ platforms` collider
- `src/scenes/UIScene.ts` — `onLetterConsumed()` handler, tile wordId tracking, `rebuildWordBarLayout()`, `addWordBarTile()` wordId param
- `docs/AI-SESSION-HANDOFF.md` — updated with all fixes, architecture notes

### Architecture Rules Learned
- **Always set body properties AFTER `group.add()`** — group defaults overwrite previous settings
- **Events: emit on `this.events`** for cross-scene communication where listeners are on `gameScene.events`
- **Use visible sprites for physics**, not invisible sprites + separate Graphics visuals
- **Never soft-lock**: expired/removed entities must respawn

---

## 2026-05-05 — Letter Guard Fixes & Polish

### Issues Resolved
- [x] Guard no longer consumes letters on defeat — verify only, letters preserved for door
- [x] Guard now blocks its SPECIFIC word's door (not proximity-based) — must defeat guard before that door works
- [x] Door overlap shows "Letter Guard blocks this door!" when undefeated guard exists for that word
- [x] Stolen letter hint broadened — detects both stolen drops AND respawned letters in lettersGroup
- [x] Guard prompt clarified: "🛡️ Spell to break the barrier! Press E"
- [x] Proximity-based guard block removed (was at x=1100, doors at x=350-950, so never triggered)
- [x] Guard gameplay loop: collect letters → defeat guard (letters kept) → open door (letters consumed)

### Decisions Made
1. Guard verify-not-consume: player collects ped letters once, spells twice (guard + door) — more satisfying
2. WordId-specific blocking replaces proximity — guard now meaningfully gates its matching door
3. Stolen letter detection now catches respawned letters (expired 60s drops get `respawnLetter()` which lacks `stolen` flag)

### Files Modified
- `src/scenes/GameScene.ts` — defeatGuard() letter consumption removed, door overlap guard check rewritten, stolen hint broadened, guard prompt text updated

---

## 2026-05-05 — Letter Guard Enemy Implemented

### Completed
- [x] Letter Guard enemy type added: `type: 'letter-guard'` with `guardWordId` field in hindi.json
- [x] Guards spawn in `spawnEnemies()` via `spawnGuard()` — stationary, tinted red-orange, with shield icon + label
- [x] Block mechanic: when player is near a guard, doors cannot be opened (shows "Defeat the Letter Guard first!")
- [x] Interact: press E / tap interact button while near guard → launches WordPuzzle with guard's word
- [x] Defeat: correct spell → particle burst, guard destroyed, letters consumed, activeDoors check retriggered
- [x] 5 guards added across 5 levels: ped (world-1-1), ghaas (1-2), doodh (2-1), phal (2-2), neela (3-1)
- [x] Guard prompt (🔤 Press E to spell the word!) with orange styling
- [x] Guard state survives respawn; `defeatedGuards` Set prevents respawn after defeat
- [x] Zero TypeScript errors, clean Vite build

### Architecture Notes
- Letter Guards use `enemiesGroup` alongside creepers but are handled by separate methods (`updateGuards`, `spawnGuard`, `openGuardPuzzle`, `defeatGuard`)
- `updateGuards()` runs before `handleNPCInteraction()` — guard interaction takes priority over NPC interaction
- `spawnDoors()` overlap checks `this.nearGuard` before opening puzzle — guard blocks door access
- Guards require collected letters to spell — encourages exploration before confrontation
- Guard word letters consumed on defeat (emit `letterConsumed`) — same pattern as doors

### Files Modified
- `src/scenes/GameScene.ts` — +160 lines: guard fields, `spawnGuard()`, `updateGuards()`, `openGuardPuzzle()`, `defeatGuard()`, door block check, prompt text
- `src/config/languages/hindi.json` — 5 letter-guard entries added
- `public/data/hindi.json` — synced copy

### Pending (Phase 5)
- Boss fight — rebuild from scratch (code removed May 5, design preserved)
- Enemy difficulty balancing per level
- Tiled level maps
- Real audio assets (music + SFX)

---

## 2026-05-05 — Boss Code Removed (Rebuild Planned) & Puzzle Fixes

### Completed
- [x] BossScene.ts deleted — boss fight implementation removed (was non-functional, will rebuild later)
- [x] GameConfig.ts — BossScene import and scene registration removed (now 8 scenes)
- [x] GameScene.ts — all boss-related code removed (levelBoss, bossLaunched, levelComplete no longer launches BossScene)
- [x] GameScene.ts — levelComplete() simplified: guard → completeLevelAndProgress() directly
- [x] LanguageManager.ts — BossSentence, BossData interfaces removed; boss field removed from LevelData
- [x] LevelSelectScene.ts — isBoss from WorldNode, hasBoss from LevelInfo, boss indicators, crown emoji removed
- [x] WordPuzzleScene.ts — puzzleClosed event removed (was boss-specific)
- [x] hindi.json (both copies) — all boss objects removed (3 bosses across 3 levels)
- [x] Letter tile hit area fix — removed custom hitArea/Phaser.Geom.Rectangle from containers, reverted to default setSize-based input
- [x] Letter tile sizes increased: 52px→60px for better mobile touch targets
- [x] Slot sizes increased: 58px→64px for easier drop targets
- [x] Single-letter puzzle auto-fill: words with only 1 letter (e.g., "maa" = "माँ") auto-place into slot, just press Submit
- [x] AI-SESSION-HANDOFF.md — fully rewritten, boss section marked as removed
- [x] Zero TypeScript errors, clean Vite build

### Decisions Made
1. Boss fight code fully removed (was placeholder auto-win, not functional) — design preserved in docs for later rebuild from scratch.
2. Level completion now goes directly to star display + Next Level button while boss is unbuilt.
3. Puzzle drag hit areas use Phaser defaults (setSize) — custom hitArea was causing misaligned click targets.
4. Single-letter words auto-fill — reduces friction for words like "maa" with only one Devanagari character.

---

## 2026-05-05 — Boss Fight Rebuilt from Scratch

### Completed
- [x] Boss data restored to hindi.json (both copies) — 3 bosses: jungle, village, palace
- [x] LanguageManager interfaces: BossData, BossSentence, AttackPattern added; boss field on LevelData
- [x] BossScene.ts (~400 lines) — full implementation from scratch
- [x] GameScene.levelComplete() wired: checks level.boss, pre-resolves word data, launches BossScene
- [x] GameConfig.ts — BossScene registered (9 scenes total)
- [x] vite.config.ts — `host: '0.0.0.0'` for LAN mobile testing
- [x] Zero TypeScript errors, clean Vite build

### Boss Fight Architecture
- **Arena**: Dark radial gradient background, floor platform, dark theme
- **Player**: Same spritesheet as GameScene, WASD/arrows + touch controls (◀ ▶ ▲ 💬)
- **Boss**: Scaled enemy-placeholder (3x), tinted dark red, floating animation, health bar
- **State machine**: ATTACKING → VULNERABLE → (SPELLING) → repeat until HP=0
- **Attack patterns** (from JSON data): shadow_bolt (3 aimed projectiles), ground_slam (horizontal wave), spawn_minions (2 chasing orbs)
- **Vulnerability phase**: 6s window, boss glows amber, sentence displayed with required words, E/tap launches WordPuzzleScene with `caller: 'BossScene'`
- **WordPuzzleScene integration**: Pre-resolved word data passed from GameScene (LanguageManager cross-level lookup), puzzle uses splitLetters directly
- **Edge cases handled**: puzzle close → attack resumes; player death → arena reset (full HP, same sentence); vulnerable timer expiry → attack resumes; boss defeated → victory particles + continue button
- **Player**: 3 HP, 1s invincibility (blinking), knockback on hit; Boss: 3 HP, color-coded health bar

### Decisions Made
1. Pre-resolve word data in GameScene (async import of LanguageManager) before launching BossScene — avoids flaky singleton timing issues
2. BossScene detects puzzle close via `!this.scene.isActive('WordPuzzleScene')` in update loop — no need for custom puzzleClosed event
3. On boss defeated, `completeLevelAndProgress()` called directly (not through levelComplete()) — bypasses levelCompleteGuard since guard is already set
4. Boss uses `enemy-placeholder` sprite (Phase 5 asset pending) — same as pre-removal approach

### Files Modified
- `src/scenes/BossScene.ts` — NEW: full boss fight implementation
- `src/scenes/GameScene.ts` — levelBoss field, boss wire in levelComplete(), BossData import
- `src/systems/LanguageManager.ts` — BossData, BossSentence, AttackPattern interfaces; boss field on LevelData
- `src/config/GameConfig.ts` — BossScene import + registration
- `src/config/languages/hindi.json` + `public/data/hindi.json` — boss data restored
- `vite.config.ts` — host: '0.0.0.0' added

---

## 2026-05-05 — Boss Fight Polish & Bugfix Session (3 rounds of live testing)

### Round 1 — Attack Visual Clarity
- [x] Shadow bolts were invisible (black on dark background) → changed to bright red-orange arrows with muzzle flash, orange glow, fire trail sparks, elongated shape rotated to travel direction
- [x] Ground slam wave spawned at x=50 (left edge) instead of boss → changed to emanate from boss position
- [x] Ground slam wave killed by cleanupAttack after ~135px travel (150 speed × 0.9s) → increased to 2 waves (left+right) at 450 speed, fade instead of instant destroy
- [x] Minions spawned at screen edges (x=50, x=width-50) instead of boss → changed to spawn from boss, float (no gravity), homing acceleration toward player after 500ms spread
- [x] 3 minions instead of 2, with expire burst particles, pink trails
- [x] Removed conflicting minion tracking in update() that fought against trail-timer homing

### Round 2 — Boss Slam Animation & Visual Connection
- [x] Ground slam looked like random fire from floor (no visual connection to boss) → added full slam sequence:
  1. Boss shakes (telegraph)
  2. Boss drops 250px to floor (Power2 ease)
  3. Vertical energy beam from boss to floor on impact
  4. Impact explosion + screen shake + rock particles burst upward
  5. Two shockwaves radiate left + right from impact point
  6. Boss rises back to floating position (Back.easeOut)
- [x] Attack warning text updated: "Ground Slam! Jump!"

### Round 3 — Gameplay Balance & Critical Bugfixes
- [x] Ground slam waves still not reaching screen edges → removed velocity slowdown from cleanupAttack() (was `velocity.x *= 0.3`), now fade at full speed
- [x] Shadow bolts too easy to dodge at screen edges → added mild homing: bolts blend angle 3% toward player each frame, accelerate +4 speed/frame, rotation updates, lifespan 3s→3.5s
- [x] **Continue button broken** — GameScene callback used `this.time.delayedCall(100, ...)` on paused scene → paused scenes don't process timers → never fired. Fixed: GameScene listens for `this.events.once('resume', ...)` then calls `completeLevelAndProgress()` after 200ms
- [x] Added Enter/Space keyboard fallback for Continue button
- [x] **Cleanup crash on victory** — `cleanupAttack()` called in shutdown event handler, but Phaser destroys groups before listener fires → `group.getChildren()` crashes. Fixed: removed `cleanupAttack()` from shutdown (Phaser auto-cleans), added null guards to `cleanupAttack()`

### Architecture Notes From Polish Session
- GameScene's `time.delayedCall` does NOT fire on paused scenes — use `events.once('resume')` pattern instead
- Phaser scene shutdown lifecycle destroys physics groups BEFORE firing the `shutdown` event
- Attack projectiles must have `allowGravity: false` and no `collideWorldBounds` to travel freely
- Homing projectiles: blend velocity angle toward target position each frame (3% blend factor works well)
- Ground slam flow: boss.y tween down → impact effects → waves spawn → boss.y tween back up (~1300ms total)

### BossScene Final Stats
- Lines: ~1120 (up from ~400 initial)
- 3 attack patterns with unique visual effects (muzzle flash, trails, particles, homing)
- Boss slam animation sequence with 4 visual layers (beam, impact, rocks, waves)
- All attacks visibly originate from boss entity

### Files Modified This Session
- `src/scenes/BossScene.ts` — 3 rounds of polish: attack visuals, slam animation, homing, Continue fix, cleanup guard
- `src/scenes/GameScene.ts` — Continue button fix (resume event instead of time.delayedCall)
- `docs/AI-SESSION-HANDOFF.md` — fully rewritten
- `docs/12-progress-log.md` — this entry

### Decisions Made
1. Ground slam waves use `cleanupAttack()` fade (not instant destroy) to reach edges — velocity kept at full speed
2. Shadow bolt homing uses gentle blend factor (3%/frame) — aggressive enough to threaten, not unfair
3. Minions eject outward then home — prevents instant swarm, adds tactical delay
4. `events.once('resume', ...)` pattern is the correct way to chain logic after scene unpause in Phaser
5. Keyboard fallback (Enter/Space) on Continue as universal accessibility

---

## 2026-05-06 — Floating Joystick Touch Controls + Resize Fix + Landscape Lock

### Completed
- [x] Browser resize bug fixed — removed `game.scale.resize(window.innerWidth, window.innerHeight)` from `main.ts` that was breaking game layout on window resize. Phaser's `Scale.FIT` + `CENTER_BOTH` handles canvas scaling natively.
- [x] `GameConfig.ts`: Added `min: { 640, 360 }` and `max: { 1920, 1080 }` scale limits
- [x] Landscape lock + rotate prompt: `<meta name="screen-orientation" content="landscape">` in `index.html`, `#rotate-prompt` CSS overlay div, `checkOrientation()` in `main.ts` on `resize` + `orientationchange` (50ms defer for Safari)
- [x] Apple meta tags added: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- [x] `NEW: src/systems/TouchControls.ts` (~170 lines) — reusable floating joystick + jump/interact buttons
- [x] Mobile detection: `TouchControls.isTouchDevice(scene)` — Phaser device API + `navigator.maxTouchPoints` fallback
- [x] Floating joystick: left half of screen (bottom 48%), drag → `movementForce.x` (-1 to 1), 12px dead zone, pointerId multitouch tracking
- [x] Jump button: right side, 72px circle, ▲ label, hold for variable-height jump
- [x] Interact button: right side, 60px circle, 💬 label, one-shot (consumer resets flag)
- [x] `GameScene.ts`: Replaced `touchLeft/Right/Jump/Interact` booleans + `createTouchControls()` with `touchControls?: TouchControls` instance. Removed ~20 lines, added ~5.
- [x] `BossScene.ts`: Same TouchControls replacement. Removed ~25 lines, added ~5.
- [x] `GameConfig.ts`: `activePointers: 2 → 3` for joystick + jump + extra touch
- [x] Zero TypeScript errors, clean Vite build (tsc --noEmit + vite build)

### Touch Controls Architecture
```
src/systems/TouchControls.ts (reusable class)
├── movementForce: { x }       // -1..1 from joystick
├── jumpHeld: boolean          // continuous, for variable-height jump
├── interactPressed: boolean   // one-shot, consumer resets to false
├── isTouchDevice(scene)       // static: Chrome/Safari/Android/iPhone detection
└── destroy()                  // cleanup called in scene shutdown
```

### Controls Mapping (migration from old d-pad)
| Old (bool flags) | New (TouchControls) |
|---|---|
| `touchLeft` | `touchControls.movementForce.x < -0.3` |
| `touchRight` | `touchControls.movementForce.x > 0.3` |
| `touchJump` | `touchControls.jumpHeld` |
| `touchInteract` | `touchControls.interactPressed` then set to `false` |

### Cross-browser / Cross-device
- Chrome desktop: keyboard only (no touch controls)
- Chrome Android: floating joystick + buttons
- Safari desktop: keyboard only
- Safari iPhone: floating joystick + buttons + `lockOrientation('landscape')`
- Touch laptops: controls appear alongside keyboard
- All: `Scale.FIT` + `min`/`max` prevents extreme scaling

### Files Modified
- `src/systems/TouchControls.ts` — NEW: full implementation
- `src/scenes/GameScene.ts` — import TouchControls, replace 4 booleans + createTouchControls(), modify handleMovement() and handleNPCInteraction(), add shutdown cleanup
- `src/scenes/BossScene.ts` — same pattern as GameScene
- `src/config/GameConfig.ts` — min/max scale, activePointers 3
- `src/main.ts` — remove scale.resize(), add checkOrientation() + resize/orientationchange listeners
- `index.html` — rotate prompt overlay + CSS, screen-orientation meta, apple meta tags
- `docs/AI-SESSION-HANDOFF.md` — fully rewritten
- `docs/12-progress-log.md` — this entry

### Pending
- [ ] Mobile testing on real devices (iPhone Safari + Android Chrome)
- [ ] Enemy difficulty balancing
- [ ] Boss sprites (proper art)
- [ ] Real audio assets
- [ ] Tiled level maps

---

## 2026-05-06 — Mobile Bugfixes: HUD Visibility, Blank Space, Auto-Move After Modal

### Issues Found (Mobile Testing Round 1)
1. HUD elements (hearts, diamonds, score) invisible on mobile — visible on desktop
2. 15% blank space on left side of mobile screen
3. After closing WordPuzzle modal, character auto-walked in last held direction (walked into enemy)

### Root Causes & Fixes

**1. HUD not visible on mobile**
- **Root cause**: CSS `height: 100%` on `html, body, #game-container` doesn't account for mobile browser address bar. The address bar takes space → viewport smaller than 100% → game letterboxed → HUD (at y=20) cut off.
- **Fix**: Changed to `height: 100dvh` (dynamic viewport height) with `-webkit-fill-available` fallback. Added `position: fixed; inset: 0` on `#game-container`.

**2. 15% blank space on left side**
- **Root cause**: iPhone safe area insets (notch in landscape) + Scale.FIT letterboxing combined to create asymmetric blank space.
- **Fix**: Added `padding-left/right/top/bottom: env(safe-area-inset-*, 0px)` to `#game-container`. Added `width: 100vw`. Works with existing `viewport-fit=cover` meta.

**3. Auto-movement after closing WordPuzzle/Dialogue**
- **Root cause**: Player was holding movement direction when overlay opened. GameScene paused but input state persisted. On resume, `handleMovement()` applied the still-active input → character continued walking.
- **Fix**: Added `TouchControls.reset()` method (clears movementForce, jumpHeld, interactPressed, hides joystick). Called in `openDoor()`, `openGuardPuzzle()`, `handleNPCInteraction()`, `launchBossPuzzle()` alongside `setVelocity(0,0)` BEFORE pausing.

### Files Modified
- `src/systems/TouchControls.ts` — added `reset()` method
- `src/scenes/GameScene.ts` — stop+reset in `openDoor()`, `openGuardPuzzle()`, `handleNPCInteraction()`
- `src/scenes/BossScene.ts` — stop+reset in `launchBossPuzzle()`
- `index.html` — `100dvh` + `-webkit-fill-available` + `position: fixed` + `safe-area-inset` paddings
- `docs/AI-SESSION-HANDOFF.md` — updated
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.88s, 23 modules)
```

---

## 2026-05-06 — Mobile Verified: Viewport, Fullscreen, Audio (iPhone 12 + OnePlus Nord CE3)

### Testing Results (Live Testing Round 2)
Tested on real devices:
- **iPhone 12, iOS 18.7.8** (Safari)
- **OnePlus Nord CE3 5G, OxygenOS 15 / Android 15** (Chrome)

### Issues Found & Fixed

**1. Bottom screen cropped on Android phone**
- **Root cause**: Android gesture nav bar overlays bottom 24px. `position: fixed; inset: 0` fills viewport but nav bar sits on top.
- **Fix**: DOM fullscreen button — tap enters fullscreen, hides status + nav bars, game gets full screen. Also simplified CSS: `#game-container { position: fixed; top:0; left:0; right:0; bottom:0; }` — no flexbox, no JS viewport sizing.

**2. Fullscreen button not working on Android**
- **Root cause**: `requestFullscreen()` called from Phaser's canvas `pointerdown` event. Android Chrome doesn't recognize canvas synthetic events as "user gesture."
- **Fix**: Replaced with real DOM `<button id="fs-btn">` in `index.html`. Genuine DOM `click` event → `document.documentElement.requestFullscreen()` → works.
- On fullscreen exit (swipe-to-exit): `fullscreenchange` listener re-shows button.

**3. iPhone audio not playing (letter pronunciations)**
- **Root cause**: iOS Safari suspends Web Audio API context until user gesture. Previous fix used `(window as any).Howler` which is `undefined` in Vite bundle. Also: just `ctx.resume()` is NOT enough on iOS 18 — browser requires actual audio data flowing through context.
- **Fix in main.ts**:
  - Direct import: `import { Howler } from 'howler'`
  - On first `touchend`/`pointerdown` on `document.body`:
    1. Resume Phaser's AudioContext
    2. Create + play a silent 1-sample AudioBuffer (truly unlocks iOS)
    3. Resume Howler's AudioContext separately
  - Retries on every tap until both contexts are running
  - Also resumes on `visibilitychange` (tab switch)

### Files Modified This Session
- `index.html` — DOM fullscreen button (#fs-btn, #fs-tip), simplified CSS (position:fixed container, no flex centering), viewport meta
- `src/main.ts` — Full rewrite: DOM fullscreen handler, audio unlock (Howler import + silent buffer), orientation check, iOS scroll-hide, scale.refresh on load
- `src/scenes/UIScene.ts` — Camera transparent, removed Phaser fullscreen button (replaced by DOM)
- `src/systems/TouchControls.ts` — Added `reset()` method for overlay-open cleanup
- `src/scenes/GameScene.ts` — stop+reset before overlay open (openDoor, openGuardPuzzle, handleNPCInteraction)
- `src/scenes/BossScene.ts` — stop+reset before launchBossPuzzle
- `docs/AI-SESSION-HANDOFF.md` — Fully rewritten
- `docs/12-progress-log.md` — This entry

### Architecture Decisions
1. **DOM button for fullscreen** over Phaser game object — most reliable cross-browser user gesture
2. **Silent AudioBuffer playback** for iOS unlock — `ctx.resume()` alone fails on iOS 18
3. **Direct Howler import** over `window.Howler` — Vite bundler doesn't set globals
4. **`document.body` listener** for gestures (not `document` or canvas) — avoids Phaser event capture issues
5. **Simplest possible CSS** — `position: fixed` on container, let Phaser handle scaling

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.85s, 23 modules)
```

### Pending
- [ ] Boss fights: NOT tested on mobile
- [ ] WordPuzzle drag-to-spell: NOT tested on mobile
- [ ] Real audio assets (silent placeholders)
- [ ] Enemy difficulty balancing
- [ ] Boss sprites
- [ ] Tiled level maps

---

## 2026-05-07 — Enemy Difficulty Balancing & Cross-World Progression Fix

### Completed
- [x] Added per-enemy configurable fields to all 11 creeper enemies across 5 levels in `hindi.json`: `speed`, `contactCooldown`. Optional: `damage`, `hitboxWidth`, `hitboxHeight`, `knockbackX`, `knockbackY`.
- [x] Difficulty scales progressively: world-1-1 (speed 65-70, cooldown 1800ms) → world-3-1 (speed 110-120, cooldown 1100-1200ms)
- [x] `spawnEnemies()` reads `speed`, `hitboxWidth`, `hitboxHeight` from JSON per enemy; falls back to hardcoded defaults
- [x] `updateEnemies()` reads `contactCooldown`, hitbox dimensions, knockback from `enemy.enemyData`
- [x] `damagePlayer(amount?)` now accepts configurable damage amount (default 1)
- [x] Fixed `getNextLevelId()` — was returning non-existent levels (world-1-level-3) after boss completion, causing empty level with no enemies
- [x] `getNextLevelId()` now uses `LanguageManager.getLevel()` to verify next level exists; falls through: world-1-level-2 → world-2-level-1
- [x] Next Level button extracts world from `nextLevelId` for cross-world transitions
- [x] End-of-game handling: world-3-level-1 → `null` → only "Level Select" button shown
- [x] Both copies of `hindi.json` synced
- [x] Zero TypeScript errors, clean Vite build

### Bug Fixed
**"Next screen without enemy" after boss defeat** — `getNextLevelId()` was returning `world-1-level-3` (doesn't exist in hindi.json). `loadLevelData()` caught the missing level and fell back to `spawnFallbackLetters()`, creating a level with platforms and player but no enemies, doors, NPCs, or checkpoints.

### Files Modified
- `src/config/languages/hindi.json` — `speed` and `contactCooldown` added to all creeper enemies
- `public/data/hindi.json` — synced copy
- `src/scenes/GameScene.ts` — `spawnEnemies()` reads per-enemy config, `updateEnemies()` uses per-enemy params, `damagePlayer(amount?)` configurable, `getNextLevelId()` cross-world lookup, Next Level button world extraction, static import of LanguageManager
- `docs/AI-SESSION-HANDOFF.md` — updated status, added Enemy Difficulty Architecture section
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.73s, 23 modules)
```

### Pending
- [ ] Boss sprites (proper art) — next priority
- [ ] Real audio assets (silent placeholders)
- [ ] Tiled level maps

---

## 2026-05-07 — Touch Controls UX Overhaul + Mobile Testing Complete

### Mobile Testing Finalized
- [x] WordPuzzle drag-to-spell: tested on both iPhone 12 and OnePlus Nord CE3 — working
- [x] Boss fights: tested on both devices — working (all 3 attack patterns visible, interact button works during vulnerable phase, spelling, victory)
- [x] All 3 levels played end-to-end on mobile — working
- [x] Standalone mode: "Add to Home Screen" button hidden when PWA launched from Home Screen — fixed

### Touch Controls UX Overhaul
- [x] Right-half jump zone: replaced small 72px fixed jump button with entire right half of screen as jump zone — tap anywhere on right to jump, hold for variable height. Same philosophy as left-half joystick (no need to look).
- [x] Dynamic interact button: removed small 60px fixed interact button. Replaced with large (170x72) "⚡ Interact" button that appears only when actionable:
  - Near NPCs (physics overlap detection)
  - Near Letter Guards (proximity check in updateGuards)
  - Boss vulnerable phase
- [x] Interact button check runs BEFORE control zone filter in pointerdown — fixes bug where button at y=34% was above the 52% control zone cutoff and touches were silently ignored
- [x] 600ms grace period for NPC proximity: `nearNPC` survives short disconnects during jumping (physics overlap briefly stops mid-air), prevents button flicker
- [x] `manageInteractButton()` added to GameScene.update() — single method managing button visibility per frame

### Standalone Mode Detection Fix
- [x] `navigator.standalone` + `(display-mode: standalone)` media query check in main.ts
- [x] fs-btn hidden when already running as PWA (iOS "Add to Home Screen")

### Bugfixes
- [x] Interact button clicks silently ignored (control zone filter ran before button check) — reordered
- [x] Interact button disappeared when trying to tap (right half = jump zone, tapping triggered jump → moved away from NPC) — interact check now takes priority over jump
- [x] npcPrompt + interact button flicker during jumps (nearNPC cleared every frame, overlap didn't fire mid-air) — 600ms grace period

### Files Modified
- `src/systems/TouchControls.ts` — Full rewrite: removed fixed buttons, right half = jump zone, dynamic interact button with show/hide API
- `src/scenes/GameScene.ts` — `manageInteractButton()`, `npcInRange`/`lastNpcOverlapTime` fields, NPC overlap callback updated, guard proximity shows button
- `src/scenes/BossScene.ts` — show/hide interact button at state transitions (VULNERABLE/ATTACKING/DEFEATED)
- `src/main.ts` — standalone mode detection (`navigator.standalone` + display-mode media query)
- `docs/AI-SESSION-HANDOFF.md` — fully rewritten
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.93s, 23 modules)
```

### Pending
- [ ] Enemy difficulty balancing (next priority)
- [ ] Boss sprites (proper art)
- [ ] Real audio assets
- [ ] Tiled level maps

---

## 2026-05-08 — Boss Sprites (Proper Art): 3 Unique Boss Designs, Contrast Fixes, Per-Boss Scaling

### Completed
- [x] Replaced shared `'enemy-placeholder'` sprite with 3 unique 128×128 boss sprites
- [x] **Jungle Boss**: dark green demon with 6 slit green eyes, spiked shoulders, fanged mouth, clawed arms, vine tendrils
- [x] **Village Boss**: grey cook with pot helmet, orange squinting eyes, wooden ladle (animated swing), leather apron, steam wisps
- [x] **Palace Boss**: purple guardian with gold crown (3 gems), red slit eyes, gold chestplate, scepter with glowing orb, flowing cape
- [x] 6-frame idle animation per boss (breathing + weapon sway), 6fps
- [x] SVG gradients (linear + radial) for depth shading and aura glow
- [x] Bosses now use `bossConfig.spriteKey` (was hardcoded `'enemy-placeholder'`) with `textures.exists()` fallback
- [x] Per-boss animation keys: `boss-idle-boss-jungle`, `boss-idle-boss-village`, `boss-idle-boss-palace`
- [x] Per-boss scale: jungle 2.0, village 2.2, palace 2.4 (higher level = bigger boss)
- [x] Per-boss spotlight: green, amber-red, royal purple (concentric circles behind boss)
- [x] Per-boss ambient particles: 10 green, 14 amber, 18 purple orbiting motes
- [x] Removed heavy dark tint (`0x440000`) — boss now shows natural sprite colors
- [x] Vulnerable tint lightened: `0x664400` → `0x997744` (visible amber)
- [x] Vulnerable text moved to y=100-170 (was 180-260) — no longer covers the boss
- [x] Boss floating idle: ±20px (was ±15) + subtle scale pulse 2.0↔2.1
- [x] Zero TypeScript errors, clean Vite build

### Bug Fixed
**All bosses looked identical** — `createBossAnimations()` used global key `'boss-idle'`. First boss (Jungle) created it with `'boss-jungle-sheet'` frames. Subsequent bosses skipped creation and played Jungle frames on their sprites. Fixed by using unique keys per boss: `boss-idle-${spriteKey}`.

**Boss invisible against dark arena** — `setTint(0x440000)` multiplied against green/grey/purple sprites → near-black. Removed default tint entirely. Natural sprite colors + bright spotlight behind boss now provides clear visibility at all screen positions.

### Files Modified
- `scripts/generate-sprites.ts` — `BOSS_SIZE=128`, gradient support, 18 detailed SVG frames, 6-frame compositing at 768×128, `composeBossSheet()` helper
- `src/scenes/PreloadScene.ts` — boss spritesheets loaded at 128×128 frame size
- `src/scenes/BossScene.ts` — use `bossConfig.spriteKey`, unique animation keys, `getBossScale()`, `getSpotlightColors()`, ambient particles, `clearTint()` instead of `0x440000`, text positions moved, bossVignette → bossSpotlight, floating + pulse tweens
- Both copies of `hindi.json` — unchanged (spriteKey already existed)

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.76s, 23 modules)
```

---

## 2026-05-08 — Real Audio: Web Audio Synthesis, Unified AudioManager

### Completed
- [x] Created `AudioManager.ts` (~420 lines) — unified singleton for all game audio
- [x] SFX: 12 sounds synthesized via Web Audio API oscillators (jump, collect, door-open, hurt, success, checkpoint, boss-attack, boss-slam, boss-minion, boss-hit, boss-defeated)
- [x] Music: 4 procedural looping tracks (menu C pentatonic 70bpm, world-1 jungle E minor 90bpm, world-2 village G major 80bpm, world-3 palace D harmonic minor 75bpm)
- [x] Speech: Howler.js caching + 500ms debounce (reuses cached Howl instances, prevents spam)
- [x] Mute toggle: 🔊/🔇 button in pause menu, persisted to localStorage `shabd_saga_audio_muted`
- [x] Master/SFX/Music gain nodes for independent volume control
- [x] Simplified `main.ts`: audio unlock delegates to `AudioManager.resume()`, removed `Howler` direct import
- [x] Deleted `PronunciationEngine.ts` (dead code — never imported)
- [x] Deleted 9 silent MP3 placeholder files (5 SFX + 4 music)
- [x] Removed `this.load.audio(...)` from PreloadScene (9 lines removed)
- [x] GameScene: removed `playSFX()` and `playLevelMusic()` private methods, all audio calls replaced
- [x] BossScene: added music on arena start, SFX for all 3 attack patterns, damage, victory, + shutdown cleanup
- [x] MenuScene: replaced Phaser `sound.play('music-menu')` with `AudioManager.startMenuMusic()`
- [x] DialogueScene: replaced raw `new Howl()` with `AudioManager.speakDialogue()`
- [x] Zero TypeScript errors, clean Vite build (24 modules, 2.81s)

### Architecture Decisions
1. **Web Audio API over MP3 files**: Zero downloads, identical behavior on all browsers, instant availability, no preloading needed
2. **SFX as transient oscillators**: Created per-call with envelope (gain ramp), garbage collected automatically — no pooling needed
3. **Music as scheduled patterns**: `setInterval` at beat tempo + `AudioContext.currentTime` node scheduling — notes fire ahead of playback position, stays in time even under load
4. **Speech stayed with Howler.js**: Real Hindi MP3s already exist (~30 files, 4-50KB each). AudioManager wraps Howler for caching and unified mute control, but doesn't replace the playback mechanism
5. **Single AudioContext**: Both SFX and music flow through the same `AudioContext` via separate GainNodes → master GainNode. One `resume()` call unlocks everything
6. **Mute via localStorage**: Read on `AudioManager.init()`, toggled in UIScene pause menu — persists across page refreshes

### SFX — Full List

| Method | Sound | Technique | Duration |
|--------|-------|-----------|----------|
| `playJump()` | Bright upward blip | Sine sweep 300→600Hz | 0.25s |
| `playCollect()` | Sparkly chime | Dual sine 523+659Hz | 0.3s |
| `playDoorOpen()` | Satisfying unlock | Triangle arp C5-E5-G5 | 0.5s |
| `playHurt()` | Low thud impact | Square 80→40Hz | 0.3s |
| `playSuccess()` | Triumphant fanfare | 5-note sine C-E-G-C-E | 1.0s |
| `playCheckpoint()` | Gentle notification | Sine 440Hz + triangle 660Hz | 0.35s |
| `playBossAttack()` | Menacing rumble | Sawtooth 110→160→80Hz + vibrato | 0.5s |
| `playBossSlam()` | Ground pound | Noise burst + sine 40Hz thump | 0.4s |
| `playBossMinion()` | Magical spawn | FM synth 300/100Hz | 0.35s |
| `playBossHit()` | Impact | Square 200→60Hz | 0.25s |
| `playBossDefeated()` | Victory | 6-note fanfare + noise explosion | 1.5s |

### Music — Full List

| Track | Key | Tempo | Instruments | Character |
|-------|-----|-------|-------------|-----------|
| Menu | C pentatonic | 70 BPM | Sine pad + triangle melody | Calm, mystical |
| World 1 (Jungle) | E minor pentatonic | 90 BPM | Square arp + sine bass + click | Rhythmic, adventurous |
| World 2 (Village) | G major | 80 BPM | Sawtooth pluck + sine flute | Warm, folk |
| World 3 (Palace) | D harmonic minor | 75 BPM | Detuned saw pad + sine bell arp | Grand, majestic |

### Cross-Browser Compatibility
- **Safari** (macOS/iOS): AudioContext fully supported. iOS unlock handled via existing `touchend`→`resume()`+`silentBuffer` path
- **Chrome** (all platforms): Full AudioContext + OscillatorNode support
- **Firefox**: Identical AudioContext API, no differences
- **Edge**: Chromium-based, identical to Chrome
- **Mobile**: Same AudioContext API on both iOS Safari and Android Chrome

### Files Modified
- `src/systems/AudioManager.ts` — NEW: full implementation (~420 lines)
- `src/main.ts` — simplified audio unlock (delegates to AudioManager)
- `src/scenes/PreloadScene.ts` — removed 9 silent audio preloads
- `src/scenes/GameScene.ts` — removed playSFX/playLevelMusic, replaced all audio calls
- `src/scenes/BossScene.ts` — added all boss SFX + music + shutdown cleanup
- `src/scenes/MenuScene.ts` — replaced Phaser sound.play with AudioManager
- `src/scenes/DialogueScene.ts` — replaced raw Howl with AudioManager.speakDialogue
- `src/scenes/UIScene.ts` — added mute toggle in pause menu
- DEL: `src/systems/PronunciationEngine.ts` (dead code)
- DEL: 9 silent MP3 files (5 SFX + 4 music)
- `docs/AI-SESSION-HANDOFF.md` — updated status, added Audio Architecture section
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.81s, 24 modules)
```

### Pending
- [ ] Tiled level maps

---

## 2026-05-08 — Audio Polish: WAV Music Files, Boss SFX, Dialogue Fixes

### Completed
- [x] Replaced runtime Web Audio music synthesis with pre-rendered WAV loops (Howler.js playback)
- [x] `scripts/generate-music.ts` — generates 9 music WAV files (44100Hz, 10s loops, additive synthesis with bells/kicks/sparkles/pads)
- [x] Music tracks: menu, world-1 (E minor jungle), world-2 (G major village), world-3 (Dm palace), boss-jungle (120bpm Dm), boss-village (140bpm C#m), boss-palace (160bpm Em), victory (C major celebration), puzzle (C major magical)
- [x] Escalating boss tension: each world's boss has dedicated track with increasing tempo (120→140→160), denser percussion, faster sweeps
- [x] Boss SFX: dual sawtooth sweep + fire crackle per shadow bolt/minion; heavy boom + noise per ground slam wave
- [x] Victory music: plays continuously during "VICTORY!" and level complete screens until user clicks Continue/Next Level
- [x] WordPuzzleScene: only plays puzzle music for GameScene caller, leaves boss music alone
- [x] DialogueScene: fixed `choices` format support (JSON uses `choices[0].nextNodeId`, not `nextNodeId`)
- [x] DialogueScene: fixed keyboard advance resetting keys every frame (now persistent key refs)
- [x] `stopMusic()`: removed `Howler.stop()` global call that was killing speech audio mid-sentence
- [x] `main.ts`: exposed `window.game` for console access
- [x] GameScene: `B` key skips to boss (dev shortcut) + extracted `launchBossFight()` method
- [x] Mute button (🔊/🔇) in pause menu
- [x] Music volumes: 0.28 for all tracks via Howler
- [x] Zero TypeScript errors, clean Vite build

### Music Tracks — Full List

| Track | File | Key | Tempo | Character |
|-------|------|-----|-------|-----------|
| Menu | `menu-loop.wav` | C major pent | 120 BPM | Calm pads + bell melody |
| World 1 | `world-1-loop.wav` | E minor pent | 130 BPM | Triangle melody + rhythmic kicks |
| World 2 | `world-2-loop.wav` | G major | 115 BPM | Warm sine melody + gentle kicks |
| World 3 | `world-3-loop.wav` | D harm minor | 100 BPM | Bell arpeggios over pads |
| Boss Jungle | `boss-jungle-loop.wav` | D minor | 120 BPM | Double kicks, dissonant bells, sweeps |
| Boss Village | `boss-village-loop.wav` | C# minor | 140 BPM | Triple kicks, faster arpeggios |
| Boss Palace | `boss-palace-loop.wav` | E minor | 160 BPM | Quad kicks, rapid arpeggios, dense sweeps |
| Victory | `victory-loop.wav` | C major | 100 BPM | Grand fanfare + bell melody + sparkles |
| Puzzle | `puzzle-loop.wav` | C major pent | 108 BPM | Soft twinkling bells over pad bed |

### Boss SFX — Per-Attack

| Attack | SFX | Technique |
|--------|-----|-----------|
| Shadow Bolts | `playBossAttack()` | Dual sawtooth sweep (800→200 + 600→150) + 6× crackle burst |
| Ground Slam | `playBossSlam()` | 45Hz boom thump + white noise explosion + 200→30Hz sweep |
| Shadow Minions | `playBossMinion()` | Sine sweep (1200→400) + triangle sweep (900→300) + crackle |
| Per wave (slam) | `playBossAttack()` | Fires once per left/right shockwave |
| Per bolt spawn | `playBossAttack()` | Fires 3× (once per bolt, 600ms apart) |
| Per minion spawn | `playBossMinion()` | Fires 3× (once per minion, 400ms apart) |

### Dialogue Fixes
1. `advance()` now checks `choices[0].nextNodeId || nextNodeId` — supports owl/monkey/deer JSON format
2. Keyboard keys (`spaceKey`, `enterKey`) created once in `create()`, not rebuilt every frame
3. `stopMusic()` no longer calls `Howler.stop()` globally — was killing dialogue speech mid-sentence
4. "▼ Tap to continue" hint made bright green for visibility

### Decisions Made
1. Pre-rendered WAV music over runtime synthesis — consistent quality, no oscillator leakage or timing drift
2. 44100Hz sample rate — better quality for bell harmonics and kicks
3. Music via Howler.js with `html5: true` — works on all browsers, loops seamlessly
4. Escalating boss tension — different track per world with increasing tempo/density
5. Victory/celebration music persists until user action — fanfare SFX plays once then looping celebration
6. World music fades out during puzzles/dialogue, resumes after

### Files Modified
- `scripts/generate-music.ts` — NEW: 9-track music generator
- `src/systems/AudioManager.ts` — complete rewrite: WAV loading via Howler, SFX via Web Audio
- `src/scenes/BossScene.ts` — per-attack SFX, per-world boss music, victory celebration loop
- `src/scenes/GameScene.ts` — `launchBossFight()` extracted, B-key boss skip, music stop on level complete
- `src/scenes/DialogueScene.ts` — choices support, persistent keys, removed Howler import
- `src/scenes/WordPuzzleScene.ts` — puzzle music only for GameScene caller
- `src/scenes/MenuScene.ts` — AudioManager.startMenuMusic()
- `src/scenes/UIScene.ts` — mute toggle in pause menu
- `src/scenes/PreloadScene.ts` — removed 9 silent MP3 audio preloads
- `src/main.ts` — simplified audio unlock, exposed `window.game`
- `package.json` — added `generate-music` script
- DEL: `src/systems/PronunciationEngine.ts` (dead code, ~150 lines)
- DEL: 9 silent MP3 files (5 SFX + 4 music)
- `docs/AI-SESSION-HANDOFF.md` — fully rewritten
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (~2.8s, 24 modules)
```

### Next: Tiled Level Maps

---

## 2026-05-09 — Monkey Dialogue: Audio + Gameplay Consequences

### Completed
- [x] Monkey dialogue expanded from 1 node to 3 branching nodes with 2 choices ("Sure!" / "Maybe later")
- [x] All 3 monkey dialogue nodes have high-quality Hindi audio (Lekha voice, 140 wpm, MP3):
  - `monkey_intro.mp3` (50KB) — "Hey! I'm the monkey. Will you help me?"
  - `monkey_help.mp3` (64KB) — "Great! Take this gem. The water door is ahead."
  - `monkey_later.mp3` (25KB) — "No problem! Come back when ready."
- [x] **Gameplay consequence**: Choosing "Sure!" spawns a WisdomGem (💎) at monkey's position — directly impacts star rating
- [x] Monkey gem only given ONCE — tracked via `monkeyGemGiven` flag
- [x] After gem given, future interactions skip choices and show thank-you message only (permanent NPC state change)
- [x] Choosing "Maybe later" gives no reward — player can retry and choose differently
- [x] "Monkey gave you a gem!" float text with fade animation on reward
- [x] `DialogueScene.onComplete` now passes `finalNodeId` so GameScene can apply per-choice outcomes
- [x] `handleNPCInteraction()` — conditional dialogue substitution for monkey when gem already given
- [x] Both copies of `hindi.json` synced with audioPath and refined text
- [x] Zero TypeScript errors, clean Vite build

### Architecture

```
Player approaches monkey → handleNPCInteraction()
  ├── monkeyGemGiven = false → show full dialogues (includes intro with 2 choices)
  │   ├── Pick "Sure!" → monkey_help → onComplete('monkey_help')
  │   │   → spawnMonkeyGem() at (600, 410) → monkeyGemGiven = true
  │   └── Pick "Maybe later" → monkey_later → onComplete('monkey_later')
  │       → no-op, player can retry
  └── monkeyGemGiven = true → show [monkey_help] only (no choices, thank-you message)
```

### Files Modified
- `src/scenes/DialogueScene.ts` — `onComplete` now receives `(finalNodeId: string)`; `endDialogue()` passes `currentNode.id`
- `src/scenes/GameScene.ts` — `monkeyGemGiven` flag; `spawnMonkeyGem()` method; `handleNPCInteraction()` conditional dialogue + outcome handling
- `src/config/languages/hindi.json` — monkey dialogue: audioPath added to branch nodes, text refined with gem mention
- `public/data/hindi.json` — synced
- `public/assets/audio/speech/hindi/dialogue/` — 3 new/updated MP3 files

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.96s, 24 modules)
```

---

## 2026-05-09 — Dynamic NPC Hints: Owl + Deer + Monkey State-Awareness Complete

### Completed
- [x] **Monkey stale hint fixed**: Added `monkey_helped` and `monkey_done` nodes — monkey no longer says "Take this gem!" after gem collected. Monitors `completedDoorWords` to say "Door open!" vs "Hint".
- [x] **Dynamic monkey hints**: `buildMonkeyHintNode()` inspects `activeDoors`, `activeGuards`, `defeatedGuards` at runtime. Single door + guard → "Collect 'घा, स' and spell 'घास'!" Multiple doors → counts, marks guarded ones. All open → congrats.
- [x] **Wise Owl dynamic hints**: `buildOwlHintNode()` — teacher-like tone. Tracks `owlTaught` flag (set after `owl_teach` node). Same game-state inspection, owl-appropriate wording ("You can do it!", "You are a good student!").
- [x] **Deer Mother dynamic hints**: `buildDeerHintNode()` — motherly tone ("child"). Tracks `deerTaught` flag. Same game-state inspection.
- [x] **Audio for all 3 NPCs**: `monkey_hint.mp3` (18KB), `owl_hint.mp3` (24KB), `deer_hint.mp3` (23KB) — generic prelude audio for dynamic hints. `monkey_done.mp3` (43KB) for all-doors message.
- [x] **`completedDoorWords` Set**: Filled in `openDoor()` wordSpelled callback. Reset on level start. Used by monkey to determine hint vs done state.
- [x] 11 total NPC voice MP3s: monkey×6, owl×3, deer×2
- [x] Zero TypeScript errors, clean Vite build

### Architecture: Dynamic Hint Flow
```
NPC interaction → handleNPCInteraction()
  ├── First talk → show static JSON dialogues
  │   ├── onComplete('monkey_help') → spawnMonkeyGem(), monkeyGemGiven = true
  │   ├── onComplete('owl_teach') → owlTaught = true
  │   └── onComplete('deer_intro') → deerTaught = true
  └── Already taught → buildXxxHintNode()
      ├── Inspect activeDoors, activeGuards, defeatedGuards
      ├── Build dynamic DialogueNode with contextual text + audio
      └── Return single-node dialogue array
```

### Files Modified
- `src/scenes/GameScene.ts` — +`owlTaught`, `deerTaught` flags; +`buildOwlHintNode()`, `buildDeerHintNode()` methods; modified `handleNPCInteraction()` owl/deer branches; `onComplete` owl/deer flag-setting
- `src/scenes/DialogueScene.ts` — `onComplete(finalNodeId)` signature
- `src/config/languages/hindi.json` — monkey: added `monkey_helped`, `monkey_done` nodes with audioPath
- `public/data/hindi.json` — synced
- `public/assets/audio/speech/hindi/dialogue/` — 7 new/updated MP3 files
- `docs/AI-SESSION-HANDOFF.md` — fully rewritten
- `docs/12-progress-log.md` — this entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (~3s, 24 modules)
```

---

## Template for Future Entries

```
## YYYY-MM-DD — Entry Title

### Completed
- [x] Task description

### In Progress
- [ ] Task description

### Decisions Made
1. Decision and rationale

### Blockers
- Issue: Description
  - Impact: How it affects progress
  - Potential solutions: Options being considered
```
