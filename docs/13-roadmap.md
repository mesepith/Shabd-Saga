# Roadmap

## Phase 1 — Foundation (Current)
**Goal**: Playable platformer shell with core mechanics

- [x] Project planning and architecture
- [x] Documentation
- [ ] Project scaffolding (Vite + TypeScript + Phaser)
- [ ] Phaser scene pipeline (Boot → Preload → Menu → Game)
- [ ] Player controller (keyboard + touch)
- [ ] Platformer physics (gravity, collision, ground detection)
- [ ] Parallax scrolling backgrounds (procedural generation)
- [ ] Asset generation scripts (backgrounds, sprites, tilesets)
- [ ] Tiled map loading and rendering

## Phase 2 — Core Mechanics
**Goal**: Letter collection and word building gameplay

- [ ] Letter/Akshar entity (floating collectible with particles)
- [ ] WordBar HUD (displays collected letters)
- [ ] WordPuzzle overlay (drag letters into correct order)
- [ ] WordValidator (check spelling, provide hints)
- [ ] LockedDoor entity (requires correct word to open)
- [ ] LanguageManager (load JSON, serve word data)
- [ ] PronunciationEngine (play pre-generated audio)
- [ ] Audio pipeline (generate Hindi pronunciation via macOS `say`)
- [ ] Sound effects and background music (Howler.js)
- [ ] Level 1-1 (Jungle Training) fully playable

## Phase 3 — Enemies & NPCs
**Goal**: Living world with interactions

- [ ] Shadow Creeper enemy (patrol AI, letter stealing)
- [ ] Letter Guard enemy (word-blocking mechanic)
- [ ] NPC entity with dialogue system
- [ ] DialogueScene overlay (typewriter text, choices)
- [ ] SaveManager (localStorage + server sync)
- [ ] Node.js backend with MongoDB (progress tracking)
- [ ] Progress API endpoints
- [ ] Level 1-2 (Jungle Challenge) fully playable

## Phase 4 — Boss Fights & Progression
**Goal**: End-of-world challenges and reward loop

- [ ] Boss entity (multi-phase attack patterns)
- [ ] BossScene (sentence construction mechanic)
- [ ] Star rating system (1-3 stars per level)
- [ ] WisdomGem collectibles (hidden bonus items)
- [ ] LevelSelectScene (world map with unlock progression)
- [ ] World 2 (Village) levels + boss
- [ ] World 3 (Palace) level + boss

## Phase 5 — Polish
**Goal**: Production-ready quality

- [ ] Post-processing effects (bloom, vignette, color grading)
- [ ] Screen transitions (iris wipe, dissolve, fade)
- [ ] Particle effects polish (letter collection, magic, boss)
- [ ] Animation polish (squash & stretch, screen shake)
- [ ] Touch control optimization for tablets
- [ ] Performance optimization (object pooling, texture atlas)
- [ ] Accessibility features (color blind mode, text scaling)
- [ ] Loading screen with tips and progress bar

## Phase 6 — Multi-Language & Admin
**Goal**: Expandable to any language

- [ ] Language selector in menu
- [ ] Template language JSON for new languages
- [ ] Admin panel for word management
- [ ] Batch audio generation for all language voices
- [ ] User profile management (multiple kids per device)
- [ ] Parent dashboard (progress reports, time tracking)

## Phase 7 — v1.0 Launch
**Goal**: Production release

- [ ] Full playtest with target audience (NRI kids 6-12)
- [ ] Difficulty balancing based on feedback
- [ ] Bug fixes and edge case handling
- [ ] PWA support (offline play, installable)
- [ ] Deployment to production server
- [ ] Performance benchmarks on tablets
- [ ] SEO and social sharing meta tags
- [ ] Analytics integration (anonymous usage tracking)

## Phase 8 — v2.0 (Future)
**Goal**: Expanded content and features

- [ ] More languages (Telugu, Spanish, French)
- [ ] More worlds (Ocean, Space, Desert themes)
- [ ] Multiplayer word battles (2 kids race to spell)
- [ ] Story mode with cutscenes and character arcs
- [ ] Adaptive difficulty (adjusts to child's performance)
- [ ] Mini-games (memory match, letter tracing)
- [ ] Voice recording (kids practice speaking — record & compare)
- [ ] AR mode (point camera at real objects, see Hindi labels)
- [ ] Mobile app wrapper (React Native or Capacitor)

## Milestone Schedule

| Milestone | Target | Status |
|-----------|--------|--------|
| M1: Foundation Complete | — | Not Started |
| M2: Core Mechanics Complete | — | Not Started |
| M3: Enemies & NPCs Complete | — | Not Started |
| M4: Boss Fights Complete | — | Not Started |
| M5: Polish Complete | — | Not Started |
| M6: Admin & Multi-Language | — | Not Started |
| v1.0 Launch | — | Not Started |

## Legend
- [x] Done
- [ ] Not started
- [~] In progress
- [!] Blocked
