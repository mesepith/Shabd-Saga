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

## 2026-05-09 — Tiled Level Maps Verified + Phaser 3.90 Debugging

### Completed
- [x] Tilemaps verified working on Phaser 3.90 (desktop Chrome incognito)
- [x] Phaser 3.90 compatibility fixes:
  - Added `orientation: 'orthogonal'`, `renderorder: 'right-down'` to tilemap JSONs (Phaser 3.90 calls `toLowerCase()` on `orientation` — missing = crash: `Cannot read properties of undefined (reading 'toLowerCase')`)
  - Added explicit `imagewidth`/`imageheight` to tileset definitions (eliminated `Image tile area not tile size multiple` warning)
  - Added `version`, `tiledversion`, `nextlayerid`, `nextobjectid`, layer `id` fields to JSON — standard Tiled format
  - Added `insertNull: true` to `this.make.tilemap({ key, insertNull: true })` — prevents `AssignTileProperties` crash: `Cannot read properties of undefined (reading '2')` caused by gid 0 empty tiles creating Tile objects with index 0 instead of -1
  - Added tileset `spacing: 0, margin: 0` explicitly
- [x] Console confirms: `✅ TILEMAP LOADED — visual layers active: world-1-level-1`
- [x] All 5 levels regenerate and build cleanly

### Root Cause of Phaser 3.90 Crashes
1. **Missing `orientation`** → Phaser's `FromOrientationString()` called `.toLowerCase()` on `undefined`
2. **Missing `imagewidth`/`imageheight`** → `updateTileData()` couldn't compute tile counts correctly
3. **Missing `insertNull: true`** → gid 0 empty tiles created Tile objects that passed `tile.index < 0` check (because index was 0, not -1), then crashed at `mapData.tiles[tile.index][2]` where `mapData.tiles[0]` was undefined

### Files Modified
- `scripts/generate-tilemaps.ts` — Added: `orientation`, `renderorder`, `version`, `tiledversion`, `nextlayerid`, `nextobjectid`, layer `id` fields, tileset `imagewidth`/`imageheight`/`spacing`/`margin`
- `src/scenes/GameScene.ts` — Added `insertNull: true` to `this.make.tilemap()` call
- `docs/AI-SESSION-HANDOFF.md` — Updated: status (verified), Phaser 3.90 compat section, file index, next tasks
- `docs/12-progress-log.md` — This entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.83s, 24 modules)
```

### Next: Screen Transitions

---

## 2026-05-09 — Screen Transitions Complete

### Completed
- [x] Created `src/systems/TransitionManager.ts` — static utility with `toScene()`, `FADE_DURATION = 600ms`, `FADE_COLOR = { r: 0x1a, g: 0x1a, b: 0x2e }` (branded deep blue to match game background)
- [x] All 11 scene transitions unified — consistent 600ms branded fades at every scene boundary
- [x] BootScene → PreloadScene: added fade (was raw jump)
- [x] PreloadScene → MenuScene: added fade (was raw jump with delay)
- [x] LevelSelectScene → MenuScene (Back button): added fade (was raw jump)
- [x] GameScene → LevelSelectScene (level complete quit): added fade + `stopMusic()`
- [x] GameScene → GameScene (Next Level): replaced `scene.restart()` with `scene.start()` via TransitionManager (restart kills camera mid-fade)
- [x] UIScene pause menu Restart/Quit: fixed — now fades UIScene's own camera (GameScene is paused, so its camera tweens won't animate). Pause elements properly destroyed via tracked array. Added `stopMusic()` before transitions.
- [x] WordPuzzleScene close (both `closePuzzle()` and `showSuccess()`): fade out WordPuzzle camera → resume caller → fade in caller camera (smooth cross-fade)
- [x] DialogueScene close (`endDialogue()`): branded fade color + fade in GameScene on resume
- [x] All scenes now fade-in on create: MenuScene, BossScene, DialogueScene, WordPuzzleScene (were missing)
- [x] LevelSelectScene now calls `startMenuMusic()` on create — ensures music plays when arriving from Quit (where music was stopped). No-op when menu music already playing (same-key check in `playMusicLoop`).
- [x] Pause menu button ghosting bug fixed — `createPauseBtn` returns `[btn, txt]`, `pauseElements` array tracks all menu objects, all destroyed on any action

### Architecture Notes
1. **UIScene pause menu uses its own camera** for fade — GameScene is paused during pause menu, its camera tweens don't animate
2. **`scene.restart()` → `scene.start('GameScene')`** — restart kills the camera mid-fade; scene.start cleanly shuts down old scene and creates new one that fades in from TransitionManager callback
3. **Overlay close pattern**: fade out overlay camera → stop overlay → resume caller → fade in caller camera. Creates smooth dissolve effect.
4. **All transitions use `TransitionManager.toScene()` or the same constants** — no hardcoded durations/colors anywhere
5. **Music stop on Restart/Quit** — UIScene pause menu buttons call `stopMusic()` before transition, matching GameScene-level complete buttons
6. **LevelSelectScene music** — calls `startMenuMusic()` which is idempotent (same-key check); preserves music when coming from MenuScene, starts fresh when coming from Quit

### Files Modified
- `src/systems/TransitionManager.ts` — NEW: 13-line static utility
- `src/scenes/GameScene.ts` — import TM, use `toScene()` for Next Level + Level Select quit, `FADE_DURATION` for fadeIn
- `src/scenes/UIScene.ts` — Rewrote Restart/Quit: UIScene camera fade, element tracking array, `stopMusic()`, `createPauseBtn` returns objects
- `src/scenes/BootScene.ts` — `TransitionManager.toScene()` instead of raw `scene.start`
- `src/scenes/PreloadScene.ts` — `TransitionManager.toScene()` instead of raw `scene.start`
- `src/scenes/MenuScene.ts` — `fadeIn` on create, Play button uses `TransitionManager.toScene()`
- `src/scenes/LevelSelectScene.ts` — `TransitionManager.toScene()` for all 3 transitions, `startMenuMusic()` on create
- `src/scenes/BossScene.ts` — `fadeIn` on create
- `src/scenes/DialogueScene.ts` — Branded fade color + fade in GameScene on close, `fadeIn` on create
- `src/scenes/WordPuzzleScene.ts` — `fadeIn` on create, cross-fade on close/success

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.83s, 25 modules)
```

---

## 2026-05-10 — Object Layer Integration Complete + Stolen Letter Respawn Fix

### Completed
- [x] **Object Layer Integration**: All 9 entity types now read from tilemap `objects` layer
  - Added `TilemapEntities` interface with typed fields for player spawn, letters, doors, NPCs, creepers, guards, checkpoints, health, gems
  - Added `getObjectProp()` helper to extract Tiled property values
  - Added `parseTilemapObjects()` method that reads object layer and builds typed config
  - `createTilemap()` calls `parseTilemapObjects()` after layer creation and stores result as `this.tilemapEntities`
  - `createProceduralLevel()` sets `this.tilemapEntities = undefined` to trigger fallbacks
  - Player spawn reads from `tilemapEntities.playerSpawn` (falls back to 100,570)
  - All 7 spawn methods (`spawnLetters`, `spawnDoors`, `spawnNPCs`, `spawnEnemies`, `spawnCheckpoints`, `spawnHealthPickups`, `spawnGems`) accept optional tilemap data with graceful fallback
  - `spawnMonkeyGem()` derives position from tilemap monkey NPC position
  - Positions from tilemap are byte-identical to previously hardcoded arrays — zero behavioral change
- [x] **Stolen letter respawn fix**: Two bugs fixed in expired stolen letter handling
  - **Respawn silently failing**: `letter.destroy()` was called inside `forEach` over `lettersGroup.getChildren()`, mutating the array mid-iteration and aborting callback execution so `respawnLetter()` never ran. Fixed by collecting expired data in forEach, then destroying + respawning in separate passes.
  - **Respawn position unreachable**: Expired letters respawned at `cam.height * 0.25` (y≈180-300, far above 132px jump range). Changed to `cam.height - 150` (y≈530-570, near ground).

### Files Modified
- `src/scenes/GameScene.ts` — ~180 lines added/modified: `TilemapEntities` interface, `getObjectProp()` helper, `parseTilemapObjects()` method, `tilemapEntities` field, updated `createTilemap()`, `createProceduralLevel()`, player spawn, `loadLevelData()`, and all 7 spawn methods, `spawnMonkeyGem()`, stolen letter expiry/respawn restructured
- `docs/AI-SESSION-HANDOFF.md` — Updated status, architecture section, and next tasks
- `docs/12-progress-log.md` — This entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (3.02s, 25 modules, 122.91 kB gzip: 31.91 kB)
```

### Pending
- [x] Tileset visual polish (shading, highlights, patterns)
- [ ] Tilemap mobile testing (real devices)
- [ ] Progressive difficulty via per-level tilemap entity layout

---

## 2026-05-10 — Tileset Visual Polish Complete

### Completed
- [x] SVG gradient infrastructure: `linearGradient()`, `radialGradient()`, and 39 per-world gradient definitions (14 jungle, 12 village, 13 palace)
- [x] All 60 tiles across 3 worlds enhanced with:
  - **Jungle (20)**: Vertical gradients on ground/dirt/platforms, radial gradients on rocks/bushes/flowers, layered clouds, mountain snow caps/ridge lines, sun rays, rock cracks + highlight arcs, tree bark ridges, vine layered leaves, grass blade yellow tips, gold flower center
  - **Village (20)**: Cobblestone highlight tops, wood grain gradients + nail dots, house wall plaster texture, roof tile rows + ridge highlight, window glass sheen + interior glow, door panel bevels + metallic knob, fence post caps, chimney brick lines + smoke plume, straw texture lines, market canopy scallops + goods silhouettes
  - **Palace (20)**: Cylindrical pillar fluting lines, marble vein paths + polish dots, metallic gold gradients on capitals/throne/gold-trim, stone wall individual stone highlights + mortar gaps, carpet gold stripe patterns, curtain fold gradients, candle radial glow + flame teardrop + wax drip, star cross-rays, moonlight halo + craters, throne velvet + gold armrests + crown, gem inlays on gold trim
- [x] 3 empty tiles (transparent) correctly skipped during render
- [x] No sharp/librsvg SVG filter dependency — all effects via gradients + layered semi-transparent shapes (cross-platform safe)
- [x] Zero TypeScript errors, clean Vite build (2.89s)
- [x] Tilemaps regenerated cleanly (5 JSONs)
- [x] AI-SESSION-HANDOFF.md and 12-progress-log.md updated

### Techniques Used
1. **Gradient shading**: `linearGradient` for top→bottom depth, `radialGradient` for spherical light on rocks/bushes
2. **Edge highlights**: Semi-transparent white/light rects at tops of cobblestone, marble, grass caps
3. **Texture dots**: Small ellipses/circles at low opacity for pebbles, grass speckles, stars, wall imperfections
4. **Layered depth**: 5+ overlapping ellipses for clouds, 3-4 bush clusters, 4+ rock layers
5. **Cylinder shading**: Horizontal gradient bright→dark→bright for pillar 3D effect
6. **Metallic gradients**: Multi-stop linear gradients (gold, wood grain)
7. **Atmospheric glow**: Large radial gradients with fading opacity for candle, sun, moon

### Decisions Made
1. No SVG filters used — sharp/librsvg filter support varies by OS; all effects simulated with layered shapes + gradients
2. Same color palette — gradient colors derived from existing flat colors, no palette shift
3. 64×64 tile size unchanged — zero impact on tilemap loading, collision, or rendering
4. Same empty tile IDs (13/15/15) kept transparent — tilemap JSONs unchanged

### Files Modified
- `scripts/generate-tilesets.ts` — Full rewrite: +SVG gradient helpers, +per-world gradient banks, enhanced all 60 tile SVG definitions
- `docs/AI-SESSION-HANDOFF.md` — Updated status, added Tileset Visual Polish section, updated next tasks
- `docs/12-progress-log.md` — This entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (2.89s, 25 modules)
```

### Pending
- [ ] Tilemap mobile testing (real devices)
- [ ] Progressive difficulty via per-level tilemap entity layout

---

## 2026-05-10 — Progressive Difficulty Implemented + How to Play Tutorial

### Completed
- [x] **Progressive Difficulty**: All 5 levels now have unique entity layouts (letters, gems, health pickups, checkpoints)
  - **World 1 Level 1** (Tutorial): All 20 letters at ground level (y=530-570), all 5 gems at ground, health near start, 1 checkpoint, slowest enemies (speed 60-65, cooldown 2000ms)
  - **World 1 Level 2** (Medium): 10 ground + 10 platform letters, 2 ground + 3 platform gems, 2 checkpoints, mid-speed enemies (90-100, cooldown 1300-1400ms)
  - **World 2 Level 1** (Medium): 10 ground + 10 platform letters, wider gem spread, 1 checkpoint, mid-speed enemies (80-85, cooldown 1600ms)
  - **World 2 Level 2** (Hard): 6 ground + 14 platform letters, all gems on platforms, 2 checkpoints (new mid checkpoint), fast enemies (100-105, cooldown 1200-1300ms)
  - **World 3 Level 1** (Hardest): 4 ground + 16 pillar-platform letters, all gems on platforms, 2 checkpoints (new mid checkpoint), fastest enemies (120-130, cooldown 1000-1100ms)
- [x] **Reachability fix**: Initial placement had many letters at y=150-200 with no platform below — completely unreachable (440px above ground, max jump = 132px). Rewrote all 5 level layouts with platform-aware placement: every letter is either at y≥530 (ground-reachable) or directly above a known platform within 78-114px of its surface. All 100 letters across 5 levels verified reachable.
- [x] **Physics world bounds fix**: Physics world bounds defaulted to game config (1280×720), trapping player at x=1280 while entities at x=1440-1590 were unreachable. Added `this.physics.world.setBounds(0, 0, 1600, height)` to match camera bounds.
- [x] **Enemy config sync**: `hindi.json` (both copies) updated with per-level speed/cooldown/position values matching tilemap data. Mid checkpoints added to w2-l2 and w3-l1.
- [x] **HowToPlayScene** — New device-aware interactive control tutorial scene:
  - Detects mobile vs desktop and shows appropriate controls
  - 5-step walkthrough: Move, Jump, Interact, Collect Letters, Spell Words
  - Animated control indicators (key caps for desktop, joystick/buttons for mobile)
  - Practice sandbox with movable character, ground + platform + floating letter
  - Touch demo: left half joystick, right half jump, with gravity physics
  - Professional dark-blue themed UI with gold accents, particle effects, step navigation
- [x] **MenuScene**: Added "📖 How to Play" button between tagline and language selector, launches HowToPlayScene

### Architecture Notes
1. **Reachability formula**: Player max jump = v²/(2g) = 460²/(2×800) = 132.25px. Safe reachable Y from ground: ≥ 508 (132px + overlap). Platform letters placed within 100px above their platform surface.
2. **Physics world bounds must match camera bounds** — `setCollideWorldBounds(true)` on player + default 1280 world bounds = half the level unreachable. Now both are 1600.
3. **HowToPlayScene is device-aware** — uses `game.device.input.touch` + `navigator.maxTouchPoints` for detection. Shows floating joystick demo on mobile, WASD/arrow key caps on desktop.
4. **Practice sandbox** — simple physics loop in `update()` with gravity (12px/frame²) and ground collision. Character animates automatically on step change, but also responds to real touch/keyboard input.

### Files Modified
- `scripts/generate-tilemaps.ts` — All 5 level lambdas: unique letter/gem/health/checkpoint/enemy positions per level
- `src/scenes/GameScene.ts` — `getLetterDefaultPositions()`, `getHealthDefaultPositions()`, `getGemDefaultPositions()` helpers; updated `spawnEnemies` fallback for all 5 levels; updated `spawnCheckpoints` fallback; added `physics.world.setBounds(0,0,1600,height)`
- `src/config/languages/hindi.json` + `public/data/hindi.json` — Synced enemy speeds/cooldowns/positions; added mid checkpoints to w2-l2 and w3-l1
- `src/config/GameConfig.ts` — Registered HowToPlayScene
- `src/scenes/MenuScene.ts` — Added "📖 How to Play" button
- `src/scenes/HowToPlayScene.ts` — **NEW**: 380-line device-aware tutorial scene
- `docs/AI-SESSION-HANDOFF.md` — Updated status, next tasks
- `docs/12-progress-log.md` — This entry

### Build
```
tsc --noEmit  ✓  (zero errors)
vite build    ✓  (3.02s, 26 modules, 129.8 kB gzip: 33.1 kB)
```

### Pending
- [ ] Tilemap mobile testing (full 5-level playthrough on real iPhone + Android)
- [ ] Post-processing polish (bloom, vignette, color grading)
- [ ] Particle effects polish
- [ ] Performance optimization

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
