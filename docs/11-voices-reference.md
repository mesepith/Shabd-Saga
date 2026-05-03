# Available macOS Voices Reference

This document catalogues all macOS TTS voices available on the development machine (Zahir's MacBook Pro). Each voice can be used for generating pronunciation audio for its respective language.

## Hindi (hi_IN) — Primary Target

| Voice | Quality | Pronunciation Quality | Use Case |
|-------|---------|----------------------|----------|
| **Lekha** | Standard | Good | Casual NPC dialogue, ambient speech |
| **Lekha (Enhanced)** | Better | Better | Word pronunciation, teaching mode |
| **Kiyara (Enhanced)** | Better | Better | Female NPC characters, cutscenes |
| **Kiyara (Premium)** | Premium | Best | Main narration, boss dialogue |

### Recommended Assignment
- Word pronunciations: `Lekha (Enhanced)` — clear, natural, slightly slower pace
- NPC dialogue (Wise Owl, Monkey): `Lekha` — casual, friendly tone
- Female NPCs (Deer Mother): `Kiyara (Enhanced)` — warmer, maternal tone
- Cutscene narration: `Kiyara (Premium)` — premium quality for key story moments

## English — Various Accents

| Voice | Accent | Best For |
|-------|--------|----------|
| `Daniel` | UK English | British narrator |
| `Karen` | Australian English | Australian characters |
| `Moira` | Irish English | Irish characters |
| `Rishi` | Indian English | Indian-accented English (NRI context) |
| `Sangeeta (Enhanced)` | Indian English | Enhanced Indian English |
| `Samantha` | US English | Default English narrator |
| `Samantha (Premium)` | US English (Premium) | Premium English |
| `Ava (Premium)` | US English (Premium) | Premium alternative |
| `Tessa` | South African English | SA accent |

### English for the Game
Use `Rishi` (Indian English) or `Sangeeta (Enhanced)` for English translations and instructions — maintains cultural connection for NRI kids.

## Multi-Language Voices

### Eddy (Multilingual — 12 Languages)
Eddy is a unified multilingual voice that speaks 12 languages with native pronunciation. Perfect for the multi-language architecture.

| Voice Name | Language | ISO Code |
|------------|----------|----------|
| `Eddy (German (Germany))` | German | de-DE |
| `Eddy (English (UK))` | English (UK) | en-GB |
| `Eddy (English (US))` | English (US) | en-US |
| `Eddy (Spanish (Spain))` | Spanish (Spain) | es-ES |
| `Eddy (Spanish (Mexico))` | Spanish (Mexico) | es-MX |
| `Eddy (Finnish (Finland))` | Finnish | fi-FI |
| `Eddy (French (Canada))` | French (Canada) | fr-CA |
| `Eddy (French (France))` | French (France) | fr-FR |
| `Eddy (Italian (Italy))` | Italian | it-IT |
| `Eddy (Portuguese (Brazil))` | Portuguese (Brazil) | pt-BR |

### Other Multilingual Voices

| Voice | Languages |
|-------|-----------|
| **Flo** | Same 10 languages as Eddy |
| **Grandma** | Same 10 languages as Eddy |
| **Grandpa** | Same 10 languages as Eddy |
| **Reed** | Same 9 languages |
| **Rocko** | Same 10 languages |
| **Sandy** | Same 10 languages |
| **Shelley** | Same 10 languages |

## European Languages

| Voice | Language | ISO |
|-------|----------|-----|
| `Alice` | Italian | it-IT |
| `Alva` | Swedish | sv-SE |
| `Anna` | German | de-DE |
| `Ellen` | Dutch (Belgium) | nl-BE |
| `Ioana` | Romanian | ro-RO |
| `Jacques` | French | fr-FR |
| `Joana` | Portuguese (Portugal) | pt-PT |
| `Laura` | Slovak | sk-SK |
| `Luciana` | Portuguese (Brazil) | pt-BR |
| `Mónica (Enhanced)` | Spanish (Spain) | es-ES |
| `Montse` | Catalan | ca-ES |
| `Nora` | Norwegian | nb-NO |
| `Paulina (Enhanced)` | Spanish (Mexico) | es-MX |
| `Sara` | Danish | da-DK |
| `Satu` | Finnish | fi-FI |
| `Tünde` | Hungarian | hu-HU |
| `Xander` | Dutch | nl-NL |
| `Zosia` | Polish | pl-PL |
| `Zuzana` | Czech | cs-CZ |

## Asian & Middle Eastern Languages

| Voice | Language | ISO |
|-------|----------|-----|
| `Kanya` | Thai | th-TH |
| `Kyoko` | Japanese | ja-JP |
| `Linh` | Vietnamese | vi-VN |
| `Majed` | Arabic | ar-SA |
| `Meijia` | Chinese (Taiwan) | zh-TW |
| `Sinji` | Chinese (Hong Kong) | zh-HK |
| `Tingting` | Chinese (China) | zh-CN |
| `Yuna` | Korean | ko-KR |
| `Amira` | Malay | ms-MY |
| `Damayanti` | Indonesian | id-ID |

## Slavic Languages

| Voice | Language | ISO |
|-------|----------|-----|
| `Daria` | Bulgarian | bg-BG |
| `Lana` | Croatian | hr-HR |
| `Lesya` | Ukrainian | uk-UA |
| `Milena` | Russian | ru-RU |

## Other Languages

| Voice | Language | ISO |
|-------|----------|-----|
| `Amélie` | French (Canada) | fr-CA |
| `Angélica (Enhanced)` | Spanish (Mexico) | es-MX |
| `Carlos (Enhanced)` | Spanish (Colombia) | es-CO |
| `Carmit` | Hebrew | he-IL |
| `Marisol (Premium)` | Spanish (Spain) | es-ES |
| `Melina` | Greek | el-GR |
| `Yelda` | Turkish | tr-TR |

## Special/Novelty Voices

| Voice | Description |
|-------|-------------|
| `Bad News` | Sad/melancholy tone |
| `Good News` | Happy/upbeat tone |
| `Bells` | Bell-like tones |
| `Cellos` | Musical cello tones |
| `Jester` | Playful, joking tone |
| `Organ` | Organ-like tones |
| `Superstar` | Celebrity/announcer tone |
| `Trinoids` | Robotic/sci-fi tone |
| `Whisper` | Whispered speech |
| `Zarvox` | Classic robotic voice |
| `Bubbles` | Bubbly, high-pitched |
| `Boing` | Bouncy, cartoonish |

Novelty voices could be used for:
- `Jester` — Monkey NPC's comedic lines
- `Superstar` — Boss introduction announcements
- `Whisper` — Mystery/hidden dialogue secrets

## Generating Audio with Any Voice

```bash
# Basic word pronunciation
say -v "Lekha (Enhanced)" "बाघ" -o baagh.aiff

# With rate control (words per minute)
say -v "Lekha (Enhanced)" -r 130 "बाघ जंगल में रहता है" -o sentence.aiff

# Convert to MP3
ffmpeg -i baagh.aiff -codec:a libmp3lame -qscale:a 2 baagh.mp3

# One-liner for batch generation
say -v "Lekha (Enhanced)" -r 150 "नमस्ते" -o temp.aiff && \
  ffmpeg -i temp.aiff -acodec libmp3lame -q:a 2 output.mp3 -y && \
  rm temp.aiff
```

## Multi-Language Strategy

For each new language added to the game:
1. Identify the matching voice from this list
2. Set `ttsVoice` in the language JSON
3. Run `npm run generate-speech -- --language={id}`
4. Audio files auto-generated and placed in `public/assets/audio/speech/{id}/`

### Future Languages (Already Have Voices)

| Language | Voice | Status |
|----------|-------|--------|
| Telugu | — (not available on macOS) | Needs external TTS |
| Tamil | — (not available on macOS) | Needs external TTS |
| Spanish | `Eddy (Spanish (Mexico))` or `Paulina (Enhanced)` | Ready |
| French | `Eddy (French (France))` or `Jacques` | Ready |
| German | `Eddy (German (Germany))` or `Anna` | Ready |
| Arabic | `Majed` | Ready |
| Japanese | `Kyoko` | Ready |
| Chinese | `Tingting` | Ready |
| Korean | `Yuna` | Ready |
| Portuguese | `Eddy (Portuguese (Brazil))` or `Luciana` | Ready |
