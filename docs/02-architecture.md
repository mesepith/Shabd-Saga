# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Phaser 3 Game Engine                  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Scenes  │ │ Entities │ │ Systems  │ │    UI    │  │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │          LanguageManager (JSON config)            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │   SaveManager (localStorage + API sync)          │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Express)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Progress │ │  Words   │ │  Levels  │ │    Admin     │  │
│  │  Route   │ │  Route   │ │  Route   │ │    Route     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    MongoDB                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Client Architecture

### Scene Graph
```
Game Instance
├── BootScene          — Load minimal assets for loading bar
├── PreloadScene       — Full asset loader with progress bar
├── MenuScene          — Animated title, language picker, play button
├── LevelSelectScene   — World map, unlock progression
├── GameScene          — Core gameplay (platformer)
├── WordPuzzleScene    — Overlay: drag letters to build words
├── BossScene          — Boss fight with sentence construction
├── DialogueScene      — Overlay: NPC conversations
└── UIScene            — Parallel HUD (lives, word bar, pause)
```

### Entity System
```
GameScene Entities:
├── Player             — Character with physics, animations, lives
├── Akshar (Letters)   — Floating collectible Devanagari letters
├── ShadowCreeper      — Patrol enemy, steals letters on touch
├── LetterGuard        — Stationary enemy, spell word to pass
├── NPC                — Friendly character with dialogue tree
├── LockedDoor         — Requires correct word to open
├── MagicBridge        — Builds as letters are spelled
├── WisdomGem          — Hidden bonus collectible
├── Platform           — Static, moving, falling variants
└── SpawnPoint         — Player start, checkpoint positions
```

### System Services
```
Systems (singletons):
├── LanguageManager    — Load language JSON, provide word data
├── WordValidator      — Check letter order, give hints
├── PronunciationEngine— Play pre-generated audio clips
├── ParallaxManager    — Multi-layer background scrolling
├── DialogueManager    — Typewriter text, NPC conversation trees
├── SaveManager        — localStorage + server sync
├── AudioManager       — SFX and music playback (Howler.js)
├── ParticleManager    — Visual effects (Phaser particles)
├── InputManager       — Keyboard + touch unified input
└── AnalyticsTracker   — Words learned, time spent (future)
```

## Data Flow

```
Language JSON (hindi.json)
    │
    ├── BootScene: LanguageManager.load("hindi")
    │       │
    │       └── Levels loaded, words indexed
    │
    ├── LevelSelectScene: Shows worlds, checks SaveManager for unlocks
    │
    └── GameScene: LevelConfig provides:
            ├── words[] → spawn Akshar entities
            ├── npcs[] → spawn NPC entities with dialogue
            ├── boss → configure BossScene
            └── tilemapPath → load Tiled .tmx for platforms

Tiled .tmx → Phaser Tilemap Loader → Collision layers, spawn markers

Node.js API → SaveManager.sync() → localStorage.setItem("progress")
```

## File Serving Strategy

- **Development**: Vite dev server serves all assets from `public/`
- **Production**: Vite builds to `dist/`, served by Node.js Express as static files
- **Game assets**: Bundled or code-split with lazy loading per world
- **Language JSON**: Embedded in bundle (small) or fetched from `/api/words/:lang`
- **Audio**: Lazy-loaded via Howler.js, streamed on demand
