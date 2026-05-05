# AI Session Handoff

> **READ THIS FIRST** when starting a new AI session on Shabd Saga.
> The AI should read `docs/12-progress-log.md` for full details.

## Quick Status (May 5, 2026) — Boss Fight Polished, Mobile Testing Next

### NEXT TASK: Mobile Testing (iPhone Safari + Android Chrome)
1. Test on real devices via LAN: `http://<mac-IP>:5174/` (vite.config has `host: '0.0.0.0'`)
2. Verify touch controls (◀ ▶ ▲ 💬) work for movement, jump, and interact in BossScene
3. Verify drag-to-spell works on mobile in WordPuzzleScene (launched from boss)
4. Check for layout issues on small screens (Phaser Scale.FIT handles most)
5. Fix any mobile-specific bugs found

### Priority After Mobile
| Order | Task | Why |
|-------|------|-----|
| 1 | Mobile testing + fixes | Critical for target audience (kids on phones) |
| 2 | Enemy difficulty balancing | Quick JSON data tweaks |
| 3 | Boss sprites (proper art) | Currently scaled-up placeholder |
| 4 | Real audio assets | Big creative project |
| 5 | Tiled level maps | Big creative project |

### What's Working
- All 9 Phaser scenes load and function
- Platformer, touch controls, Devanagari rendering, letter collection, WordBar
- WordPuzzle overlay with drag-to-spell + caller param for boss integration
- Doors + guards + letter consumption flow
- Level completion → stars → save
- NPC dialogue, Shadow Creeper enemies, stolen letter respawn
- Player animations, checkpoint/respawn, SFX/music placeholders
- Health pickups, WisdomGems, star rating
- World-specific parallax backgrounds, LevelSelectScene
- Letter Guard enemies (5 guards, word-specific door blocking, verify-not-consume)
- **Boss fights** — 3 bosses with real WordPuzzleScene integration, polished visuals

### Boss Fight Architecture (Post-Polish)
- `BossScene.ts` (~1120 lines after polish)
- **State machine**: ATTACKING → VULNERABLE → (SPELLING) → repeat until HP=0
- **3 attack patterns** — all originate visibly from the boss:

| Attack | Visual | Behavior |
|--------|--------|----------|
| Shadow Bolts | Red-orange arrows, muzzle flash, fire trails | 3 bolts with spread, **mild homing** (curves toward player), accelerates |
| Ground Slam | Boss drops to floor, vertical beam, impact explosion, rock burst | 2 shockwaves sweep left + right across **full arena edges** |
| Shadow Minions | Magenta orbs, pink trails, spawn from boss | 3 minions burst outward, then **home in** on player, burst on expire |

- **Boss slam animation**: boss shakes (telegraph), drops 250px to floor, vertical crack beam, impact particles, rises back up
- **Vulnerability phase**: 6s window, boss glows amber, sentence + required words shown, E/tap → WordPuzzleScene with `caller: 'BossScene'`
- **Word data**: Pre-resolved by GameScene (LanguageManager.getWord cross-level) before launching BossScene
- **Touch controls**: Same virtual button pattern as GameScene (◀ ▶ ▲ 💬) — needs real device testing
- **Puzzle close handling**: Detects `!this.scene.isActive('WordPuzzleScene')` in update loop → attack cycle resumes
- **Player death**: Arena reset, full HP, boss sentences reset (no progress lost)
- **cleanupAttack()**: Fades projectiles/minions at full velocity (waves reach edges), guarded against destroyed groups
- **Continue button**: Click OR Enter/Space. GameScene listens for its own `'resume'` event (NOT `this.time.delayedCall` on paused scene) → calls `completeLevelAndProgress()`

### Boss Fight Flow
1. All doors opened → `levelComplete()` detects `level.boss`
2. GameScene pauses itself + UIScene, registers `this.events.once('resume', ...)` for post-boss
3. Async pre-resolves word data (LanguageManager.getWord) → launches BossScene
4. Boss attack cycle: 4-6s attacks → 6s vulnerable → repeat
5. Player spells key words during vulnerability → each correct = 1 HP damage
6. 3 correct spells = boss defeated → victory particles + VICTORY text
7. Click Continue (or Enter/Space) → stops BossScene → resumes GameScene → `'resume'` event → `completeLevelAndProgress()` → stars + save

### Critical Bug Fixed (Continue Button)
- **Root cause**: `onBossDefeated` callback used `this.time.delayedCall(100, ...)` on GameScene which was PAUSED — paused scenes don't process time events
- **Fix**: GameScene listens for `this.events.once('resume', ...)` — fires when BossScene stops and resumes it. Then `completeLevelAndProgress()` runs on the now-active scene
- **Also**: Added Enter/Space keyboard fallback for Continue

### Cleanup Crash Fixed
- **Root cause**: `cleanupAttack()` called in `shutdown` event handler, but Phaser destroys groups BEFORE the listener fires — `group.getChildren()` crashed on destroyed groups
- **Fix**: Removed `cleanupAttack()` from shutdown handler (Phaser auto-cleans on scene stop). Added null guards to `cleanupAttack()` as defense

### Current Bugs / Pending
- [ ] Boss fights NOT tested on mobile (iPhone/Android) — touch controls may need tweaks
- [ ] Music/SFX: silent placeholders (need real audio)
- [ ] Tiled level maps not created
- [ ] Enemy difficulty balancing per level
- [ ] Boss sprites: uses scaled-up 'enemy-placeholder'

### How to Test
```bash
npm run dev        # http://localhost:5174 (also at LAN IP for mobile)
```
**Pre-set progress** (browser console) to skip to boss level:
```js
localStorage.setItem('shabd_saga_progress', JSON.stringify({languages:{hindi:{completedLevels:{"world-1-level-1":{levelId:"world-1-level-1",stars:3,wordsLearned:["baagh","haathi","mor","ped","nadee","phool"],gemsCollected:5,timeSpent:0,attempts:1,completedAt:"2026-05-05T00:00:00.000Z"}}}}}));
```
Then refresh → Level Select → World 1 → Level 2 → complete doors → Boss Fight triggers.

### How to Run
```bash
npm run dev        # Frontend at http://localhost:5174
# Backend: needs MongoDB, cd backend && npm run dev
```

### File Index
| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point, Phaser bootstrap |
| `src/scenes/GameScene.ts` | Core gameplay (~1800 lines, boss wire at levelComplete) |
| `src/scenes/BossScene.ts` | Boss fight (~1120 lines, state machine, 3 attacks, polish) |
| `src/scenes/WordPuzzleScene.ts` | Spelling puzzle overlay (caller param supports boss) |
| `src/scenes/UIScene.ts` | HUD (health, WordBar, score, gem count, letterConsumed handler) |
| `src/scenes/DialogueScene.ts` | NPC conversation overlay |
| `src/scenes/MenuScene.ts` | Animated menu |
| `src/scenes/LevelSelectScene.ts` | World + level select with sub-menus |
| `src/scenes/PreloadScene.ts` | Asset loading |
| `src/config/languages/hindi.json` | Source of truth: Hindi words + enemies + guards + boss data |
| `public/data/hindi.json` | Copy for runtime fetch |
| `src/systems/LanguageManager.ts` | Fetches /data/hindi.json, interfaces, getWord() cross-level |
| `src/systems/SaveManager.ts` | localStorage progress |
| `vite.config.ts` | `host: '0.0.0.0'` for LAN mobile testing |
| `docs/12-progress-log.md` | Full chronological log |
| `docs/13-roadmap.md` | Phase plan |
