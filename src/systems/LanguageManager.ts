/**
 * LanguageManager — Singleton
 *
 * Loads language JSON configuration files and provides word data, NPC data,
 * boss data, and level configs to game scenes. The game is fully language-agnostic
 * — swapping the language JSON changes everything without code modifications.
 */

interface WordEntry {
  id: string;
  script: string;
  transliteration: string;
  translation: string;
  splitLetters: string[];
  category: string;
  difficulty: 1 | 2 | 3;
  audioPath: string;
  hintImage?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

interface NPCData {
  id: string;
  name: string;
  nameEnglish: string;
  spriteKey: string;
  position: { x: number; y: number };
  dialogues: any[];
  teachesWords: string[];
}

interface BossSentence {
  id: string;
  script: string;
  translation: string;
  requiredWords: string[];
  timeLimit: number;
}

interface BossData {
  id: string;
  name: string;
  nameEnglish: string;
  spriteKey: string;
  health: number;
  sentences: BossSentence[];
  attackPatterns: any[];
}

interface LevelData {
  id: string;
  worldNumber: number;
  levelNumber: number;
  name: string;
  nameEnglish: string;
  theme: string;
  tilemapPath: string;
  backgroundLayers: string[];
  musicTrack: string;
  ambientSound: string;
  difficulty: 1 | 2 | 3;
  words: WordEntry[];
  npcs: NPCData[];
  enemies?: any[];
  boss: BossData | null;
  checkpoints: any[];
}

interface LanguageConfig {
  languageId: string;
  languageName: string;
  nativeName: string;
  scriptDirection: 'ltr' | 'rtl';
  fontFamily: string;
  fontUrl: string;
  ttsVoice: string;
  levels: LevelData[];
}

export class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: LanguageConfig | null = null;
  private wordIndex: Map<string, WordEntry> = new Map();
  private categoryIndex: Map<string, WordEntry[]> = new Map();

  private constructor() {}

  static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  /**
   * Load a language configuration from JSON.
   * In production, this could be fetched from /api/words/:languageId
   */
  async loadLanguage(languageId: string): Promise<LanguageConfig> {
    try {
      // Fetch from public static files
      const response = await fetch(`/data/${languageId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const config: LanguageConfig = await response.json();

      this.currentLanguage = config;
      this.buildIndexes();

      return this.currentLanguage;
    } catch (err) {
      // Fallback: try fetching from API
      try {
        const response = await fetch(`/api/words/${languageId}`);
        const config: LanguageConfig = await response.json();
        this.currentLanguage = config;
        this.buildIndexes();
        return config;
      } catch (apiErr) {
        throw new Error(`Failed to load language "${languageId}": ${err}`);
      }
    }
  }

  /**
   * Build fast lookup indexes for words.
   */
  private buildIndexes(): void {
    if (!this.currentLanguage) return;

    this.wordIndex.clear();
    this.categoryIndex.clear();

    this.currentLanguage.levels.forEach((level) => {
      level.words.forEach((word) => {
        // Index by word ID
        this.wordIndex.set(word.id, word);

        // Index by category
        const category = word.category || 'uncategorized';
        if (!this.categoryIndex.has(category)) {
          this.categoryIndex.set(category, []);
        }
        this.categoryIndex.get(category)!.push(word);
      });
    });
  }

  /**
   * Get all available language IDs.
   */
  getAvailableLanguages(): string[] {
    // In the future, this could scan the config folder or API
    return ['hindi'];
  }

  /**
   * Get the currently loaded language config.
   */
  getCurrentLanguage(): LanguageConfig | null {
    return this.currentLanguage;
  }

  /**
   * Get a specific word by ID.
   */
  getWord(wordId: string): WordEntry | undefined {
    return this.wordIndex.get(wordId);
  }

  /**
   * Get all words in a specific category.
   */
  getWordsByCategory(category: string): WordEntry[] {
    return this.categoryIndex.get(category) || [];
  }

  /**
   * Get all words for a specific level.
   */
  getLevelWords(levelId: string): WordEntry[] {
    if (!this.currentLanguage) return [];
    const level = this.currentLanguage.levels.find((l) => l.id === levelId);
    return level?.words || [];
  }

  /**
   * Get level configuration by ID.
   */
  getLevel(levelId: string): LevelData | undefined {
    if (!this.currentLanguage) return undefined;
    return this.currentLanguage.levels.find((l) => l.id === levelId);
  }

  /**
   * Get all levels for the current language.
   */
  getLevels(): LevelData[] {
    return this.currentLanguage?.levels || [];
  }

  /**
   * Get worlds list (for LevelSelectScene).
   * Groups levels by worldNumber.
   */
  getWorlds(): Array<{
    worldNumber: number;
    name: string;
    nameEnglish: string;
    levels: LevelData[];
  }> {
    if (!this.currentLanguage) return [];

    const worldMap = new Map<number, LevelData[]>();
    this.currentLanguage.levels.forEach((level) => {
      if (!worldMap.has(level.worldNumber)) {
        worldMap.set(level.worldNumber, []);
      }
      worldMap.get(level.worldNumber)!.push(level);
    });

    return Array.from(worldMap.entries()).map(([worldNumber, levels]) => ({
      worldNumber,
      name: levels[0].name.replace(/Level.*/i, '').trim(),
      nameEnglish: levels[0].nameEnglish,
      levels,
    }));
  }

  /**
   * Get the font configuration for the current language.
   */
  getFontConfig(): { family: string; url: string } {
    if (!this.currentLanguage) {
      return { family: 'Noto Sans', url: '' };
    }
    return {
      family: this.currentLanguage.fontFamily,
      url: this.currentLanguage.fontUrl,
    };
  }

  /**
   * Get the TTS voice for the current language.
   */
  getTTSVoice(): string {
    return this.currentLanguage?.ttsVoice || '';
  }

  /**
   * Get script direction (ltr or rtl).
   */
  getScriptDirection(): 'ltr' | 'rtl' {
    return this.currentLanguage?.scriptDirection || 'ltr';
  }
}
