# Technology Stack

## Game Client

| Package | Version | Purpose |
|---------|---------|---------|
| `phaser` | ^3.80.0 | 2D game engine — physics, particles, cameras, tilemaps, input |
| `howler` | ^2.2.4 | Audio playback with streaming, spriting, and cross-browser support |
| `typescript` | ^5.4.0 | Type-safe game code, entity definitions, language config types |

## Build Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.4.0 | Dev server, HMR, production bundling |
| `vite-plugin-singlefile` | ^2.0.0 | Inline all assets into single HTML (optional PWA mode) |

## Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.19.0 | HTTP server, REST API routes |
| `mongoose` | ^8.5.0 | MongoDB ODM for user progress, word data |
| `cors` | ^2.8.5 | Cross-origin requests during development |
| `dotenv` | ^16.4.0 | Environment configuration |
| `tsx` | ^4.16.0 | TypeScript execution for Node.js |

## Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | (same) | HMR for both frontend and backend |
| `concurrently` | ^8.0.0 | Run frontend + backend simultaneously |
| `eslint` | ^9.0.0 | Code quality (future) |
| `prettier` | ^3.0.0 | Code formatting (future) |

## Asset Pipeline (Internal Scripts)

| Tool | Purpose |
|------|---------|
| `canvas` (node-canvas or sharp) | Server-side PNG generation for procedural art |
| macOS `say` | TTS voice generation for word pronunciations |
| `ffmpeg` | Convert .aiff to .mp3 for web playback |
| **Tiled** | Level editor — exports .tmx files consumed by Phaser |

## Why These Choices

### Phaser 3 (not PixiJS, not Three.js, not Babylon.js)
- Built **for games** — PixiJS is a renderer, not a game engine (no physics, no scene manager, no tilemaps)
- **Arcade physics** works beautifully for 2D platformers out of the box
- **Tilemap support** with Tiled .tmx integration is first-class
- **Camera system** with scroll factor makes parallax trivial
- **Particle system** built-in for visual effects
- **Input manager** handles keyboard, mouse, and touch with the same API
- Massive community, documentation, and examples

### Vite (not Webpack, not Parcel)
- Near-instant HMR (hot module replacement) — critical for game dev iteration
- Native TypeScript support without configuration
- Tree-shaking keeps bundle small
- Asset handling (images, audio, fonts) is seamless

### Howler.js (not Web Audio API directly)
- Cross-browser audio consistency (Safari, Chrome, Firefox)
- Audio sprite support (pack many SFX into one file)
- Automatic unlocking of audio context (browser autoplay policies)
- Streaming for background music

### MongoDB (not MySQL, not JSON files)
- Flexible schema: game data changes frequently during development
- Document model maps naturally to JSON language configs
- No migrations needed for adding fields to user progress
- Easy to scale horizontally if needed later

### Not a Framework (React, Vue, Svelte)
- Phaser owns the DOM — game runs in a `<canvas>`, not the DOM tree
- Adding a UI framework would create two competing render loops
- Phaser's built-in GameObjects handle all UI needs (buttons, text, images)
- Keeping it vanilla for the game loop maximizes performance
