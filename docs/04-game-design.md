# Game Design Document

## Core Gameplay Loop

```
START LEVEL
    │
    ▼
EXPLORE WORLD (platformer — run, jump, collect)
    │
    ├── COLLECT LETTERS (floating Devanagari glyphs)
    │       └── Pronunciation plays on pickup
    │       └── Letter appears in WordBar HUD
    │
    ├── MEET NPC (dialogue cutscene)
    │       └── NPC introduces new vocabulary word
    │       └── Audio: native speaker ×2 (slow, normal speed)
    │       └── Word's letters spawn in upcoming section
    │
    ├── ENCOUNTER ENEMY (Shadow Creeper)
    │       └── Touch = lose 1 random letter
    │       └── Chase & stomp enemy to recover letter
    │
    ├── REACH LOCKED DOOR
    │       └── WordPuzzle overlay activates
    │       └── Drag collected letters into correct order
    │       └── Success → Door opens + celebration FX
    │       └── Fail → Gentle shake, hint shown
    │
    └── BOSS ARENA (end of world)
            └── Boss attacks with patterns (shadow bolts)
            └── Player dodges while building sentences
            └── Each correct sentence = 1 damage to boss
            └── 3 correct = boss defeated → world complete
```

## Player Character

### Default: रीतू (Reetu) — A Young Fox
- **Movement**: Run (left/right), Jump, Wall-jump (World 3 unlock)
- **Health**: 3 hearts — losing all = restart from checkpoint
- **Inventory**: Collected letters displayed in WordBar (max 8 letters)
- **States**: Idle, Running, Jumping, Falling, Hurt, Celebrating

### Animations
| State | Frames | Description |
|-------|--------|-------------|
| Idle | 2 | Gentle breathing, tail sway |
| Run | 4 | Bounding fox stride |
| Jump | 2 | Crouch → stretch upward |
| Fall | 2 | Arms out, wind effect |
| Hurt | 2 | Knockback flash |
| Celebrate | 3 | Backflip, sparkle particles |

## Letter System (अक्षर / Akshar)

### Collection
- Letters float in the world with a gentle bob animation
- Glowing aura + particle trail
- Color-coded: consonants (warm orange), vowels (cool blue), matras (pink)
- On collection: particle burst + pronunciation audio plays
- Appear in WordBar at bottom of screen as colorful tiles

### Word Building
- WordPuzzle overlay opens when player touches a Locked Door
- Shows:
  - Target word hint (English translation + optional image)
  - Empty slots matching letter count
  - Available letters dragged from WordBar into slots
- Players drag letters into slots to form the word
- Validation happens on final letter placement
- 1st fail: gentle shake, "Try again!"
- 2nd fail: transliteration hint appears
- 3rd fail: auto-hint (show letter order), no penalty

## Enemies

### Shadow Creeper (Basic Enemy)
- **Behavior**: Patrols fixed path (left-right)
- **Threat**: Touching the player steals a random collected letter
- **Defeat**: Jump on top (stomp) to recover letter + earn points
- **Visual**: Dark amorphous shape with glowing eyes
- **Spawn**: 1-3 per level section

### Letter Guard (Blocking Enemy)
- **Behavior**: Stationary, blocks narrow passage
- **Threat**: Cannot pass until its word is spelled
- **Defeat**: Spell the floating word above its head using collected letters
- **Visual**: Tall shadow figure holding a glowing word sign
- **Spawn**: 1 per level, guarding key paths

### World Boss (End-of-World)
- **Behavior**: Multi-phase attack patterns
- **Phase 1**: Slow shadow bolt patterns (easy to dodge)
- **Phase 2**: Faster attacks + falling debris
- **Phase 3**: Desperation — rapid fire, more complex sentences needed
- **Defeat**: 3 correct sentences from collected words = boss banished
- **Visual**: Giant shadow creature (world-themed: jungle monster, village demon, palace guardian)
- **Mechanic**: Boss displays a sentence. Player must have all required words collected and arrange them correctly within a time limit to deal damage.

## NPCs

### Purpose
- Introduce new vocabulary in context
- Provide hints for upcoming puzzles
- Add narrative and world-building

### Dialogue System
- Speech bubble with typewriter text animation
- Hindi text (Devanagari) + English subtitle below
- Auto-play pronunciation audio
- Simple choices: "Tell me again" / "I'm ready!"

### World 1 NPCs
| NPC | Name | Role |
|-----|------|------|
| Wise Owl | गुरु उल्लू | Tutorial guide, teaches first words |
| Monkey Friend | बंदर दोस्त | Comic relief, hints about hidden gems |
| Deer Mother | हिरण माँ | Teaches animal names in context |

## Progression & Rewards

### Star Rating (per level)
| Stars | Criteria |
|-------|----------|
| ★★★ | All words spelled correctly on first try, all gems collected, no lives lost |
| ★★☆ | All words spelled, most gems collected |
| ★☆☆ | Level completed (minimum) |

### Star Gates
- World 2 requires 3 stars from World 1 to unlock
- World 3 requires 5 total stars to unlock
- Encourages replay for mastery

### Wisdom Gems
- 3 hidden gems per level
- Collecting all = bonus star
- Encourages exploration beyond the critical path

## Difficulty Scaling (Ages 6-12)

| Feature | Easy (6-8) | Medium (8-10) | Hard (10-12) |
|---------|------------|---------------|--------------|
| Enemy count | 1-2 | 2-3 | 3-5 |
| Enemy speed | Slow | Medium | Fast |
| Boss attacks | 3 phases, slow | 3 phases, medium | 4 phases, fast |
| Word building time | No timer | 30 seconds | 20 seconds |
| Letter spawn density | High (easy to find) | Medium | Low (exploration needed) |
| Platform gaps | Short | Medium | Long (wall-jump needed) |
| Hints available | Unlimited | 3 per level | 1 per level |

Difficulty is a setting in the language JSON, adjust per-child.
