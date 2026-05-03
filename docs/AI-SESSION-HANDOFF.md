# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 3, 2026)

### What's Working
- All 9 Phaser scenes load and function
- Platformer: run, jump (variable height), staircase platforms
- Touch controls (virtual buttons)
- Devanagari letters render as text on sprites
- Letter collection with Howler.js pronunciation audio
- WordBar HUD showing collected letter tiles
- WordPuzzle overlay (drag letters to spell, close button)
- Doors auto-trigger puzzle on touch (no E key needed)
- 12 letter positions, 6 Hindi words with splitLetters
- Level completion saves to localStorage
- Node.js backend ready (Express + MongoDB) — not running in dev

### Current Bugs / Pending
- [ ] Music/SFX: silent placeholders (need real audio in Phase 5)
- [ ] NPCs spawn but don't trigger dialogue
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

### Next Phase (Phase 3)
1. Wire up NPC dialogue triggers
2. Add Shadow Creeper enemies (patrol, steal letters)
3. Create real player sprite animations
4. Add checkpoint/respawn system
5. Make music/SFX play (actual audio files)

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap |
| `src/scenes/GameScene.ts` | Core gameplay (350+ lines, main file) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle overlay |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score) |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World select |
| `src/config/languages/hindi.json` | Source of truth for Hindi words |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json |
| `src/systems/SaveManager.ts` | localStorage progress |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |
