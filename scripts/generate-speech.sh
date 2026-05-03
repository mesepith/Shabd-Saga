#!/bin/bash
# Generate Hindi pronunciation audio using macOS say command
# Usage: bash scripts/generate-speech.sh [language] [voice]

LANGUAGE=${1:-hindi}
VOICE=${2:-"Lekha (Enhanced)"}
SPEECH_DIR="public/assets/audio/speech/${LANGUAGE}"
DIALOGUE_DIR="${SPEECH_DIR}/dialogue"

mkdir -p "$SPEECH_DIR"
mkdir -p "$DIALOGUE_DIR"

echo "Generating speech audio for language: ${LANGUAGE}"
echo "Using voice: ${VOICE}"
echo ""

# Read word list from language JSON
CONFIG_FILE="src/config/languages/${LANGUAGE}.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: Language config not found: $CONFIG_FILE"
  exit 1
fi

WORDS=$(node --input-type=module -e "
  import { readFileSync } from 'fs';
  const config = JSON.parse(readFileSync('${CONFIG_FILE}', 'utf-8'));
  config.levels.forEach(level => {
    if (level.words) {
      level.words.forEach(word => {
        console.log(word.id + '|' + word.script);
      });
    }
    if (level.npcs) {
      level.npcs.forEach(npc => {
        if (npc.dialogues) {
          npc.dialogues.forEach(d => {
            if (d.audioPath) {
              console.log('DIALOGUE|' + d.audioPath + '|' + d.text);
            }
          });
        }
      });
    }
  });
")

while IFS='|' read -r type arg1 arg2; do
  if [ "$type" = "DIALOGUE" ]; then
    AUDIO_PATH="$arg1"
    TEXT="$arg2"
    FILENAME=$(basename "$AUDIO_PATH" .mp3)
    OUTFILE="${DIALOGUE_DIR}/${FILENAME}.mp3"
    echo "Generating dialogue: $TEXT → $FILENAME.mp3"
    say -v "$VOICE" -r 140 "$TEXT" -o "${DIALOGUE_DIR}/${FILENAME}.aiff" 2>/dev/null
    ffmpeg -i "${DIALOGUE_DIR}/${FILENAME}.aiff" -codec:a libmp3lame -qscale:a 2 -y "${OUTFILE}" -loglevel quiet 2>/dev/null
    rm -f "${DIALOGUE_DIR}/${FILENAME}.aiff"
    echo "  Done: $FILENAME.mp3"
  else
    WORD_ID="$type"
    SCRIPT="$arg1"
    OUTFILE="${SPEECH_DIR}/${WORD_ID}.mp3"
    echo "Generating word: $SCRIPT → $WORD_ID.mp3"
    say -v "$VOICE" -r 130 "$SCRIPT" -o "${SPEECH_DIR}/${WORD_ID}.aiff" 2>/dev/null
    ffmpeg -i "${SPEECH_DIR}/${WORD_ID}.aiff" -codec:a libmp3lame -qscale:a 2 -y "${OUTFILE}" -loglevel quiet 2>/dev/null
    rm -f "${SPEECH_DIR}/${WORD_ID}.aiff"
    echo "  Done: $WORD_ID.mp3"
  fi
done <<< "$WORDS"

echo ""
echo "All speech audio generated in ${SPEECH_DIR}/"
