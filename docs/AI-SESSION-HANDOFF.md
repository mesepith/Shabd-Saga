# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 5, 2026) — Boss Code Removed (Revisit Later)

### NEXT TASK: Letter Guard Enemy
The Letter Guard enemy type (Phase 3 leftover) blocks players from using collected letters — the player must spell a word to defeat it. Follow the existing Shadow Creeper pattern in `src/scenes/GameScene.ts` `spawnEnemies()`.

### What's Working
- All 8 Phaser scenes load and function (BossScene removed)
- Platformer: run, jump (variable height), staircase platforms
- Touch controls (virtual buttons for move/jump/interact)
- Devanagari letters render as text on sprites
- Letter collection with Howler.js pronunciation audio + SFX
- WordBar HUD showing collected letter tiles
- WordPuzzle overlay (drag letters to spell, close button)
- Doors auto-trigger puzzle on touch (6 door positions, all words covered)
- Collected letters consumed on door solve, tiles removed from WordBar
- Level completion saves to localStorage with star rating
- NPC dialogue triggers + audio
- Shadow Creeper enemies (patrol, steal letters, damage, per-enemy cooldown)
- Stolen letters: 60s lifespan, fall with gravity, land on platforms, respawn on expiry
- Player animations (idle 2-frame, run 4-frame spritesheets)
- Checkpoint/respawn system with death counter
- SFX + level music (placeholder audio)
- Health pickups — floating ❤️ restores 1 HP (max 3)
- WisdomGems — collectible gems with particle effects, shown in UI
- Star rating — calculated from deaths + gems collected (not hardcoded 3)
- World-2/3 parallax backgrounds — village houses, palace pillars + moon
- LevelSelectScene level buttons — per-world sub-menu with individual level access

### Boss Fight — Planned (Code Removed May 5, Rebuild Later)
The BossScene was removed because the initial implementation was non-functional (placeholder auto-win, no real WordPuzzleScene integration, broken physics). The boss concept remains planned — see design doc for the intended multi-phase spell-to-damage mechanic.

**When rebuilding:**
- WordPuzzleScene already supports `caller` param for scene resume
- Boss sentences reference words from multiple levels (need cross-level word lookup via LanguageManager)
- Hindi sentence construction: player spells key words from the sentence to damage boss
- Original boss data (removed from JSON, preserved in git): jungle boss, village boss, palace boss

### Current Bugs / Pending
- [ ] Music/SFX: silent placeholders (need real audio in Phase 5)
- [ ] Tiled level maps not created
- [ ] Enemy difficulty balancing per level

### Phase 5 Remaining
1. **Letter Guard enemy** (word-blocking mechanic) — NEXT TASK
2. **Boss fight** — rebuild from scratch (code removed May 5, design preserved)
3. Enemy difficulty balancing per level
4. Tiled level maps
5. Real audio assets (music + SFX)

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap |
| `src/scenes/GameScene.ts` | Core gameplay (~1500 lines, pickups, gems, stars, letter respawn) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle overlay |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score, gem count, letterConsumed handler) |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World + level select with sub-menus |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/config/languages/hindi.json` | Source of truth for Hindi words |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json |
| `src/systems/SaveManager.ts` | localStorage progress |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |
