# Setup Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **MongoDB** 7+ (local or Atlas)
- **macOS** (for TTS voice generation — optional, can use pre-generated assets)
- **Tiled** (free level editor — [mapeditor.org](https://mapeditor.org))

## Quick Start

### 1. Clone & Install
```bash
cd shabd-saga
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and settings
```

### 3. Start MongoDB (if local)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or use MongoDB Atlas (cloud) — set MONGO_URI in .env
```

### 4. Run development servers
```bash
# Start both frontend (Vite) and backend (Node.js) simultaneously
npm run dev
```

This starts:
- **Frontend**: `http://localhost:5173` (Vite dev server with HMR)
- **Backend**: `http://localhost:3001` (Express API)

### 5. Open in browser
```
http://localhost:5173
```

## Available Scripts

```bash
npm run dev           # Start frontend + backend (concurrently)
npm run dev:client    # Start frontend only (Vite)
npm run dev:server    # Start backend only (Express)
npm run build         # Build frontend for production
npm run generate-assets # Generate all procedural game assets
npm run generate-speech  # Generate TTS audio for all word pronunciations
npm run lint          # TypeScript type checking
npm run preview       # Preview production build locally
```

## Project Structure

```
shabd-saga/
├── index.html                 # Game entry point
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables
├── docs/                      # Documentation (you are here)
├── src/                       # Game source code
│   ├── main.ts                # Phaser game bootstrap
│   ├── config/                # Game config, language JSONs, level data
│   ├── scenes/                # Phaser scenes (Boot, Preload, Menu, Game, etc.)
│   ├── entities/              # Game objects (Player, Enemy, NPC, Letter, etc.)
│   ├── systems/               # Manager singletons (Language, Save, Audio, etc.)
│   └── ui/                    # UI components (WordBar, DialogueBox, etc.)
├── public/                    # Static assets
│   └── assets/                # Sprites, backgrounds, audio, fonts, tilesets
├── backend/                   # Node.js backend
│   ├── src/                   # Server source
│   │   ├── server.ts          # Express entry point
│   │   ├── routes/            # API route handlers
│   │   ├── models/            # MongoDB schemas
│   │   └── config/            # Database config
│   └── data/                  # Language JSON (server-side copy)
└── scripts/                   # Build/generation scripts
    ├── generate-backgrounds.ts
    ├── generate-sprites.ts
    ├── generate-tilesets.ts
    ├── generate-letters.ts
    └── generate-speech.sh
```

## Development Workflow

### Adding a new game feature
1. Create entity class in `src/entities/`
2. Add to relevant scene in `src/scenes/`
3. Register physics/collisions in scene's `create()` method
4. Update docs if the feature changes game mechanics

### Adding new words
1. Open `src/config/languages/hindi.json`
2. Add word entry to relevant level's `words` array
3. Run `npm run generate-speech` to generate audio
4. Run `npm run generate-letters` to generate letter sprites
5. Place letter in level Tiled map via object layer

### Adding a new language
1. Create `src/config/languages/spanish.json`
2. Copy schema from `docs/05-language-system.md`
3. Fill in words, NPCs, boss sentences
4. Run `npm run generate-speech -- --language=spanish`
5. Language automatically appears in game menu

## Production Build

```bash
npm run build
```

Output goes to `dist/`. The backend serves `dist/` as static files:
```typescript
app.use(express.static(path.join(__dirname, '../../dist')));
```

### Deployment Options
- **Single server**: Run Node.js, serve `dist/` statically
- **CDN + API**: Deploy `dist/` to CDN (Vercel/Netlify), run API separately
- **PWA**: Add `manifest.json` + service worker for offline play

## Troubleshooting

### Phaser "Cannot read property 'scene' of undefined"
- Game instance not created yet — check BootScene order
- Scene key mismatch — verify exact names match

### MongoDB connection refused
- Ensure MongoDB is running: `brew services list | grep mongo`
- Check MONGO_URI in `.env` is correct

### Audio not playing
- Browser autoplay policy: first interaction required
- Howler.js unlocks audio context on first click/touch
- Check browser console for CORS errors (audio files must be same-origin or have CORS headers)

### Hindi text shows squares
- Font not loaded: check PreloadScene loads the font
- Check font path in language JSON matches actual file location
- Safari: may need `font-display: swap` in CSS
