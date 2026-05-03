# Audio Pipeline

## Overview
All word pronunciation audio is pre-generated from macOS TTS voices. The game plays these `.mp3` files via Howler.js. This ensures consistent pronunciation quality across all browsers, unlike the Web Speech API which varies by browser and OS.

## macOS Voices Available

### Hindi (hi_IN)
| Voice | Quality | Best For | Command |
|-------|---------|----------|---------|
| `Lekha` | Good | NPC dialogue, casual speech | `say -v Lekha` |
| `Lekha (Enhanced)` | Better | Word pronunciation | `say -v "Lekha (Enhanced)"` |
| `Kiyara (Enhanced)` | Better | Female characters | `say -v "Kiyara (Enhanced)"` |
| `Kiyara (Premium)` | Best | Cutscene narration | `say -v "Kiyara (Premium)"` |

### Multi-Language (Eddy — available in 12 languages)
| Language | Voice | 
|----------|-------|
| German (Germany) | `Eddy (German (Germany))` |
| English (UK) | `Eddy (English (UK))` |
| English (US) | `Eddy (English (US))` |
| Spanish (Spain) | `Eddy (Spanish (Spain))` |
| Spanish (Mexico) | `Eddy (Spanish (Mexico))` |
| Finnish (Finland) | `Eddy (Finnish (Finland))` |
| French (Canada) | `Eddy (French (Canada))` |
| French (France) | `Eddy (French (France))` |
| Italian (Italy) | `Eddy (Italian (Italy))` |
| Portuguese (Brazil) | `Eddy (Portuguese (Brazil))` |

## Generation Script

```bash
#!/bin/bash
# scripts/generate-speech.sh
# Generates MP3 pronunciation files for all words in a language config

LANGUAGE=${1:-hindi}
VOICE="Lekha (Enhanced)"
SPEECH_DIR="public/assets/audio/speech/${LANGUAGE}"

mkdir -p "$SPEECH_DIR"

# Read word list from language JSON
WORDS=$(node -e "
  const config = require('../src/config/languages/${LANGUAGE}.json');
  config.levels.forEach(level => {
    level.words.forEach(word => {
      console.log(word.script + '|' + word.id);
    });
  });
")

while IFS='|' read -r script wordId; do
  echo "Generating: $script → $wordId.mp3"

  # Generate AIFF
  say -v "$VOICE" -r 150 "$script" -o "${SPEECH_DIR}/${wordId}.aiff"

  # Convert to MP3 (smaller, web-friendly)
  ffmpeg -i "${SPEECH_DIR}/${wordId}.aiff" \
    -codec:a libmp3lame \
    -qscale:a 2 \
    -y \
    "${SPEECH_DIR}/${wordId}.mp3"

  # Clean up AIFF
  rm "${SPEECH_DIR}/${wordId}.aiff"

  echo "  Done: ${wordId}.mp3"
done <<< "$WORDS"

echo "All audio generated in ${SPEECH_DIR}/"
```

## Usage

```bash
# Generate all Hindi pronunciations
npm run generate-speech -- --language=hindi

# Generate for a specific world only
npm run generate-speech -- --language=hindi --world=1

# Generate for future Spanish language
npm run generate-speech -- --language=spanish --voice="Eddy (Spanish (Mexico))"
```

## Audio Specifications

| Setting | Value | Reason |
|---------|-------|--------|
| Format | MP3 | Universal web support |
| Bitrate | 128 kbps | Good quality for speech |
| Sample Rate | 22050 Hz | Speech doesn't need 44.1 kHz |
| Channels | Mono | Smaller file size |
| Speed | 150 wpm | Slightly slower for young learners |
| Normalization | -16 LUFS | Consistent loudness across clips |

## File Naming Convention

```
public/assets/audio/speech/{language}/{wordId}.mp3
```

Example:
```
public/assets/audio/speech/hindi/baagh.mp3
public/assets/audio/speech/hindi/haathi.mp3
public/assets/audio/speech/hindi/ped.mp3
```

## Dialogue Audio

NPC dialogue lines are also pre-generated. Same pipeline, different directory:
```
public/assets/audio/speech/{language}/dialogue/{npcId}_{dialogueId}.mp3
```

Example:
```
public/assets/audio/speech/hindi/dialogue/wise_owl_intro.mp3
public/assets/audio/speech/hindi/dialogue/wise_owl_hint.mp3
public/assets/audio/speech/hindi/dialogue/monkey_joke.mp3
```

## Web Speech API Fallback

For languages without pre-generated audio, the `PronunciationEngine` falls back to the Web Speech API:

```typescript
function speak(text: string, voice: string): void {
  if (hasPreGeneratedAudio(text)) {
    Howler.play(getAudioPath(text));
  } else if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.split('(')[0].trim(); // e.g., "hi-IN"
    utterance.rate = 0.85; // Slower for learners
    speechSynthesis.speak(utterance);
  }
}
```

## Requirements

- **macOS** with `say` command (for generation only — not for playing)
- **ffmpeg** for AIFF → MP3 conversion: `brew install ffmpeg`
- Pre-generated MP3s are checked into git, so other devs don't need macOS
