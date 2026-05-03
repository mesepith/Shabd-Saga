# Level Design (Tiled Workflow)

## Overview
Levels are designed in **Tiled** (free open-source tile map editor, [mapeditor.org](https://mapeditor.org)) and exported as `.tmx` files. Phaser 3 loads `.tmx` natively via its tilemap loader.

## Tiled Setup

### Map Properties
| Property | Value |
|----------|-------|
| Tile Size | 32×32 or 64×64 pixels |
| Map Size | 100×15 tiles (3200×480 or 6400×960 pixels) |
| Orientation | Orthogonal |
| Compression | zlib (or none for development) |

### Layers (top to bottom in Tiled)
```
Layer: "foreground"        — Front decorations (leaves, vines, grass tips)
Layer: "objects"           — Object layer for spawn points, collectibles
Layer: "platforms"         — Collision layer (solid tiles)
Layer: "background_deco"   — Non-collidable background tiles
```
*Note: Parallax backgrounds are separate PNGs handled by ParallaxManager, not tile layers.*

### Object Layer Markers

Place **rectangle objects** on the "objects" layer with custom properties:

| Object Name Prefix | Purpose | Custom Properties |
|-------------------|---------|-------------------|
| `spawn_player` | Player start position | `direction: "right"` |
| `aks_*` | Akshar letter spawn | `wordId: "baagh"`, `letterIndex: 0` |
| `door_*` | Locked door | `wordId: "baagh"`, `leadsTo: "section-2"` |
| `npc_*` | NPC spawn | `npcId: "wise_owl"` |
| `enemy_creeper_*` | Shadow Creeper spawn | `patrolLeft: 100`, `patrolRight: 300` |
| `enemy_guard_*` | Letter Guard spawn | `wordId: "mor"` |
| `gem_*` | Hidden wisdom gem | |
| `heart_*` | Health pickup | |
| `checkpoint_*` | Checkpoint | `id: "cp-1"` |
| `boss_arena` | Boss fight trigger zone | `bossId: "jungle_boss"` |

## Example Object Properties

```
Object: aks_baagh_0
  Type: rectangle
  Position: 450, 320
  Properties:
    wordId: "baagh"
    letterIndex: 0     // First letter ("बा")
    float: true         // Bob up and down
    floatHeight: 10     // Pixels
```

```
Object: door_jungle_1
  Type: rectangle
  Position: 1200, 320
  Size: 64, 96
  Properties:
    wordId: "baagh"
    destinationSection: "section-2"
    doorSprite: "door_wood"
```

## Level Layout Principles

### Section Flow
Each level is divided into 3-4 sections connected by locked doors:
```
[Section 1: Tutorial] → door → [Section 2: Exploration] → door → [Section 3: Challenge] → boss arena
```

### Section 1: Tutorial
- Flat ground, no enemies
- 2-3 letters floating in easy-to-reach positions
- First NPC introduces the concept
- Short, safe section

### Section 2: Exploration
- Moving platforms introduced
- 1-2 shadow creepers
- 3-4 letters spread across the section (some hidden)
- NPC with dialogue mid-section
- 1 hidden wisdom gem

### Section 3: Challenge
- Platform gaps requiring timed jumps
- 2-3 shadow creepers
- 1 letter guard blocking a path
- 2-3 letters, some in tricky positions
- 2 hidden wisdom gems
- Portal to boss arena at end

### Boss Arena
- Flat arena, no platforms
- Player enters from left, boss spawns center
- Arena boundary walls (no escape)
- Victory gate appears after boss defeated

## Tile Collision Setup

In Tiled's tileset editor, set custom property on platform tiles:
```
Property: collide
Type: bool
Value: true
```

Phaser reads this and auto-generates collision bodies.

## Camera Bounds
Set in GameScene based on map size:
```typescript
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
this.cameras.main.startFollow(player, true, 0.1, 0.1); // smooth lerp follow
```

## Level Config JSON Reference

Each level's `LevelData` in the language JSON maps to a Tiled file:
```json
{
  "id": "world-1-level-1",
  "tilemapPath": "assets/tilesets/world-1-level-1.tmx",
  "backgroundLayers": [
    "assets/backgrounds/world-1/sky.png",
    "assets/backgrounds/world-1/mountains-far.png",
    "assets/backgrounds/world-1/trees-mid.png",
    "assets/backgrounds/world-1/ground.png"
  ]
}
```

## Tools

1. **Tiled** (Desktop app): Design levels visually
2. Export as `.tmx` → save to `public/assets/tilesets/`
3. Tileset PNGs → `public/assets/tilesets/`
4. Tile objects auto-mapped to Phaser entities in GameScene
