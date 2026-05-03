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
