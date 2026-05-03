# Language System

## Overview
The game is fully language-agnostic. All word data, level content, NPC dialogues, and audio mappings live in JSON config files. Changing languages is a matter of swapping one JSON file. No code changes required.

## JSON Schema (TypeScript Types)

```typescript
// Top-level language config
interface LanguageConfig {
  languageId: string;          // "hindi", "telugu", "spanish"
  languageName: string;        // "Hindi", "Telugu", "Spanish"
  nativeName: string;          // "हिन्दी", "తెలుగు", "Español"
  scriptDirection: "ltr" | "rtl";
  fontFamily: string;          // "Noto Sans Devanagari", "Noto Sans Telugu"
  fontUrl: string;             // Relative path to .woff2 font file
  ttsVoice: string;            // macOS voice: "Lekha", "Kiyara", "Eddy (Spanish (Mexico))"
  levels: LevelData[];
}

// Individual level configuration
interface LevelData {
  id: string;                  // "world-1-level-1"
  worldNumber: number;         // 1, 2, 3
  levelNumber: number;         // 1, 2
  name: string;                // "जंगल की यात्रा"
  nameEnglish: string;         // "The Jungle Journey"
  theme: string;               // "jungle", "village", "palace"
  tilemapPath: string;         // "assets/tilesets/world-1.tmx"
  backgroundLayers: string[];  // Array of parallax PNG paths
  musicTrack: string;          // Background music path
  ambientSound: string;        // Ambient SFX path (birds, wind, etc.)
  difficulty: 1 | 2 | 3;
  words: WordEntry[];
  npcs: NPCData[];
  boss: BossData | null;       // null for non-boss levels
  checkpoints: Checkpoint[];
}

// Individual word entry
interface WordEntry {
  id: string;                  // "baagh"
  script: string;              // "बाघ" — native script rendering
  transliteration: string;     // "baagh" — romanized for hints
  translation: string;         // "tiger" — English meaning
  splitLetters: string[];      // ["बा", "घ"] — syllable-aware split
  category: string;            // "animal", "family", "color", "food"
  difficulty: 1 | 2 | 3;
  audioPath: string;           // "speech/hindi/baagh.mp3"
  hintImage: string;           // Optional visual hint image
  exampleSentence: string;     // "बाघ जंगल में रहता है।"
  exampleTranslation: string;  // "The tiger lives in the jungle."
}

// NPC with dialogue tree
interface NPCData {
  id: string;
  name: string;                // "गुरु उल्लू"
  nameEnglish: string;         // "Wise Owl"
  spriteKey: string;           // Phaser texture key
  position: { x: number; y: number };
  dialogues: DialogueNode[];
  teachesWords: string[];      // Word IDs this NPC introduces
}

// Dialogue node (simple branching)
interface DialogueNode {
  id: string;
  speaker: string;             // NPC name
  text: string;                // Hindi text
  textEnglish: string;         // English translation
  audioPath: string;           // Pre-generated dialogue audio
  choices: DialogueChoice[];   // Player response options
  nextNodeId: string | null;   // null = end conversation
  action: string | null;       // "unlock_word", "give_hint", "open_door"
}

interface DialogueChoice {
  text: string;                // "Tell me again"
  textHindi: string;           // "फिर से बताओ"
  nextNodeId: string;
}

// Boss fight configuration
interface BossData {
  id: string;
  name: string;                // "छाया राक्षस"
  nameEnglish: string;         // "Shadow Demon"
  spriteKey: string;
  health: number;              // 3 hits to defeat
  sentences: BossSentence[];
  attackPatterns: AttackPattern[];
}

interface BossSentence {
  id: string;
  script: string;              // "बाघ जंगल में रहता है"
  translation: string;         // "The tiger lives in the jungle"
  requiredWords: string[];     // Word IDs needed (must be collected before boss fight)
  timeLimit: number;           // Seconds to arrange (varies by difficulty)
}

interface AttackPattern {
  name: string;                // "shadow_bolt", "ground_slam", "spawn_minions"
  duration: number;            // ms
  damage: number;              // hearts lost on hit
  speed: number;               // projectile speed
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  activated: boolean;
}
```

## How to Add a New Language

### Step 1: Create `src/config/languages/spanish.json`
```json
{
  "languageId": "spanish",
  "languageName": "Spanish",
  "nativeName": "Español",
  "scriptDirection": "ltr",
  "fontFamily": "Noto Sans",
  "fontUrl": "assets/fonts/NotoSans-Regular.woff2",
  "ttsVoice": "Eddy (Spanish (Mexico))",
  "levels": [
    {
      "id": "world-1-level-1",
      "name": "La Selva",
      "nameEnglish": "The Jungle",
      "words": [
        {
          "id": "tigre",
          "script": "tigre",
          "transliteration": "tigre",
          "translation": "tiger",
          "splitLetters": ["t", "i", "g", "r", "e"],
          "category": "animal",
          "difficulty": 1,
          "audioPath": "speech/spanish/tigre.mp3"
        }
      ]
    }
  ]
}
```

### Step 2: Generate audio
```bash
say -v "Eddy (Spanish (Mexico))" "tigre" -o speech/spanish/tigre.aiff
ffmpeg -i speech/spanish/tigre.aiff -acodec libmp3lame speech/spanish/tigre.mp3
```

### Step 3: Done
The game automatically picks up any `.json` file in `src/config/languages/`. The LanguageManager scans this directory and populates the language selector in MenuScene.

## Language-Specific Considerations

### Complex Scripts (Hindi, Telugu, Tamil, Arabic, etc.)
- The `splitLetters` field is critical — words must be split into naturally-pronounced syllables, not Unicode codepoints
- Example: "बाघ" → ["बा", "घ"] (not ["ब", "ा", "घ"])
- A syllable-splitting algorithm handles this for Hindi, but manual override is available

### Right-to-Left (RTL) Scripts (Arabic, Hebrew, Urdu)
- Set `scriptDirection: "rtl"` in the config
- Letter arrangement in WordPuzzle reverses
- UI mirrors (WordBar fills from right)
- Font must support RTL

### Non-Latin Scripts
- A font file (`.woff2`) must be included with the game
- The font is loaded during PreloadScene
- Fallback: system fonts may render squares if the font isn't loaded

## Data Flow

```
Language JSON loaded at boot
    │
    ├── LanguageManager.parse(config)
    │       ├── Index words by ID (fast lookup)
    │       ├── Index words by category (filtering)
    │       └── Cache audio paths
    │
    ├── LevelSelectScene
    │       └── Reads levels[] to build world map
    │
    ├── GameScene
    │       ├── reads level.words[] → spawn Akshar entities
    │       ├── reads level.npcs[] → spawn NPCs with dialogue
    │       └── reads level.boss → configures BossScene
    │
    └── WordPuzzleScene
            └── WordValidator checks splitLetters order
```
