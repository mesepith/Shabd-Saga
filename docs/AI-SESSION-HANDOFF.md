# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 3, 2026)

### What's Working
- All 9 Phaser scenes load and function
- Platformer: run, jump (variable height), staircase platforms
- Touch controls (virtual buttons for move/jump/interact)
- Devanagari letters render as text on sprites
- Letter collection with Howler.js pronunciation audio + SFX
- WordBar HUD showing collected letter tiles
- WordPuzzle overlay (drag letters to spell, close button)
- Doors auto-trigger puzzle on touch (no E key needed)
- 12 letter positions, 6 Hindi words with splitLetters
- Level completion saves to localStorage
- Node.js backend ready (Express + MongoDB) — not running in dev
- **NPC dialogue triggers** — walk near NPC, press E/tap 💬 to talk
- **Shadow Creeper enemies** — patrol, steal collected letters, damage player
- **Player animations** — idle (2-frame) and run (4-frame) spritesheets
- **Checkpoint/respawn system** — flags save position, death respawns
- **SFX** — jump, collect, door-open, hurt, success play during gameplay
- **Level music** — auto-plays correct world music track

### Current Bugs / Pending
- [ ] Music/SFX: silent placeholders (need real audio in Phase 5)
- [ ] Boss fights not yet wired to level flow
- [ ] Tiled level maps not created
- [ ] Door per-word letter matching may need adjustment

### Key Architecture Notes
- Language JSON served from `public/data/hindi.json` (NOT `src/config/`)
- Letter rendering: Phaser text on sprites (not individual Devanagari PNGs)
- Audio: `import { Howl } from 'howler'` at module level in GameScene
- Vite dev port: **5174**
- Font: Noto Sans Devanagari via Google Fonts in index.html
- JSON must be synced: `cp src/config/languages/hindi.json public/data/hindi.json`

### Next Phase (Phase 4)
1. Wire boss fights to level completion flow
2. Add collectible gems for bonus stars
3. Create health pickup items  
4. Add world-2 and world-3 background parallax layers
5. Balance enemy difficulty per level

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap |
| `src/scenes/GameScene.ts` | Core gameplay (1100+ lines, main file) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle overlay |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score, stolen letter handling) |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World select |
| `src/scenes/BossScene.ts` | Boss battle arena |
| `src/scenes/PreloadScene.ts` | Asset loading (spritesheets, SFX, music) |
| `src/config/languages/hindi.json` | Source of truth for Hindi words |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json |
| `src/systems/SaveManager.ts` | localStorage progress |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |
