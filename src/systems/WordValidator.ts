/**
 * WordValidator — Validates word spelling in WordPuzzleScene.
 *
 * Checks if the player's letter arrangement matches the correct order.
 * Provides progressive hints on failure.
 */

export class WordValidator {
  /**
   * Check if the player's letter arrangement is correct.
   */
  static validate(
    playerOrder: (string | null)[],
    correctOrder: string[]
  ): { isCorrect: boolean; errors: number[] } {
    if (playerOrder.length !== correctOrder.length) {
      return { isCorrect: false, errors: [] };
    }

    const errors: number[] = [];

    for (let i = 0; i < correctOrder.length; i++) {
      if (playerOrder[i] !== correctOrder[i]) {
        errors.push(i);
      }
    }

    return {
      isCorrect: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a hint based on how many attempts the player has made.
   * Attempt 0: No hint
   * Attempt 1: Show first letter position
   * Attempt 2: Show transliteration
   * Attempt 3+: Reveal correct order
   */
  static getHint(
    attempt: number,
    correctOrder: string[],
    transliteration: string
  ): string {
    switch (attempt) {
      case 0:
        return '';
      case 1:
        return `First letter: "${correctOrder[0]}"`;
      case 2:
        return `Try: ${transliteration}`;
      default:
        return `Answer: ${correctOrder.join(' ')}`;
    }
  }

  /**
   * Calculate a score based on attempts and time.
   */
  static calculateStars(
    attempts: number,
    timeSeconds: number,
    difficulty: number
  ): number {
    if (attempts <= 1 && timeSeconds < 30 / difficulty) return 3;
    if (attempts <= 3 && timeSeconds < 60 / difficulty) return 2;
    return 1;
  }

  /**
   * Split a Hindi word into pronounceable syllables.
   * Handles Devanagari matra combinations.
   *
   * Example: "बाघ" → ["बा", "घ"]
   * Example: "पुस्तक" → ["पु", "स्", "त", "क"]
   */
  static splitIntoCharacters(word: string): string[] {
    const chars: string[] = [];
    let i = 0;

    while (i < word.length) {
      const char = word[i];

      // Check if next character is a matra (vowel sign)
      // Devanagari matras are combining characters
      if (i + 1 < word.length) {
        const nextChar = word.charCodeAt(i + 1);

        // Matra range in Unicode
        if (
          (nextChar >= 0x093E && nextChar <= 0x094C) || // Devanagari vowel signs
          (nextChar >= 0x094D && nextChar <= 0x094D) || // Virama (halant)
          nextChar === 0x0902 || // Anusvara
          nextChar === 0x0903    // Visarga
        ) {
          // Include matra with the consonant
          let combined = char + word[i + 1];
          i += 2;

          // If there's a halant, include the next consonant too
          if (word.charCodeAt(i - 1) === 0x094D && i < word.length) {
            combined += word[i];
            i++;
          }

          chars.push(combined);
          continue;
        }
      }

      chars.push(char);
      i++;
    }

    return chars;
  }
}
