# Roadmap

## Phase 1 — Foundation ✅ COMPLETE
- [x] Project planning and architecture
- [x] Documentation (13 docs)
- [x] Project scaffolding (Vite + TypeScript + Phaser)
- [x] Phaser scene pipeline (Boot → Preload → Menu → LevelSelect → Game → UI)
- [x] Player controller (keyboard + touch)
- [x] Platformer physics (gravity, collision, variable-height jump)
- [x] Parallax scrolling backgrounds
- [x] Procedural asset generation (backgrounds, sprites, tilesets, letters, UI)
- [x] Node.js backend (Express + MongoDB)
- [x] Hindi language JSON (28 words, 5 levels, 3 NPCs, 3 bosses)
- [x] 28 pronunciation audio files + 3 dialogue clips (Lekha voice)

## Phase 2 — Core Mechanics ✅ COMPLETE
- [x] Letter/Akshar entities (physics sprites with Devanagari text rendering)
- [x] WordBar HUD (collected letter tiles)
- [x] WordPuzzle overlay (drag letters, validate, hints, close button)
- [x] LockedDoor entities (auto-trigger on touch, per-word letter tracking)
- [x] LanguageManager (fetch from /data/, word indexing)
- [x] PronunciationEngine (Howler.js audio playback on collection)
- [x] Pronunciation audio generated (macOS say → ffmpeg → MP3)
- [x] SaveManager (localStorage + server sync queue)
- [x] Level 1-1 (Jungle Training) — 6 words, 12 letters, 3 doors

## Phase 3 — Enemies & NPCs ⬅️ START HERE
**Goal**: Living world with interactions

- [ ] NPC dialogue triggers (spawnNPCs creates NPCs but no dialogue flow yet)
- [ ] Shadow Creeper enemy (patrol AI, letter stealing)
- [ ] Letter Guard enemy (word-blocking mechanic)
- [ ] Real player sprite animations (idle, run, jump — use player/idle.png and player/jump.png)
- [ ] Checkpoint/respawn system
- [ ] Real music/SFX audio (replace silent placeholders)
- [ ] Enemy spawn from level data
- [ ] Health/lives system integration
- [ ] Level 1-2 (Jungle Challenge) with enemies

## Phase 4 — Boss Fights & Progression
- [ ] Boss entity (multi-phase attack patterns)
- [ ] BossScene integration (sentence construction mechanic)
- [ ] Star rating system (1-3 stars per level)
- [ ] WisdomGem collectibles (hidden bonus items)
- [ ] LevelSelectScene improvements (star gates, boss indicators)
- [ ] World 2 (Village) levels + boss
- [ ] World 3 (Palace) level + boss

## Phase 5 — Polish
- [ ] Post-processing effects (bloom, vignette, color grading)
- [ ] Screen transitions (iris wipe, dissolve, fade)
- [ ] Particle effects polish (letter collection, magic, boss)
- [ ] Animation polish (squash & stretch, screen shake)
- [ ] Touch control optimization for tablets
- [ ] Performance optimization (object pooling, texture atlas)
- [ ] Tiled level maps (.tmx files for each level)
- [ ] Loading screen improvements

## Phase 6 — Multi-Language & Admin
- [ ] Language selector in menu (currently hardcoded to Hindi)
- [ ] Template language JSON for new languages
- [ ] Admin panel for word management
- [ ] Batch audio generation for all language voices
- [ ] User profile management (multiple kids per device)

## Phase 7 — v1.0 Launch
- [ ] Full playtest with target audience (NRI kids 6-12)
- [ ] Difficulty balancing
- [ ] Bug fixes and edge case handling
- [ ] PWA support (offline play, installable)
- [ ] Deployment to production server

## Legend
- [x] Done
- [ ] Not started
- [~] In progress
- [!] Blocked
