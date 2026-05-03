/**
 * SaveManager — Handles game progress persistence.
 *
 * Offline-first: saves to localStorage immediately, syncs to server when online.
 * Progress is stored per-language, per-level.
 */

interface LevelProgress {
  levelId: string;
  stars: number;
  wordsLearned: string[];
  gemsCollected: number;
  timeSpent: number;
  attempts: number;
  completedAt: string;
}

interface LanguageProgress {
  completedLevels: Record<string, LevelProgress>;
  wordsLearned: string[];
}

interface GameProgress {
  userId: string;
  languages: Record<string, LanguageProgress>;
  lastSynced: string;
  pendingSync: any[];
  settings: {
    difficulty: number;
    musicVolume: number;
    sfxVolume: number;
    language: string;
  };
}

const STORAGE_KEY = 'shabd-saga-progress';
const DEFAULT_PROGRESS: GameProgress = {
  userId: 'player-' + Math.random().toString(36).substring(2, 9),
  languages: {},
  lastSynced: '',
  pendingSync: [],
  settings: {
    difficulty: 2,
    musicVolume: 0.5,
    sfxVolume: 0.7,
    language: 'hindi',
  },
};

export class SaveManager {
  private static instance: SaveManager;
  private progress: GameProgress;
  private listeners: Array<(progress: GameProgress) => void> = [];

  private constructor() {
    this.progress = this.loadFromStorage();
  }

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Load progress from localStorage.
   */
  private loadFromStorage(): GameProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load progress from localStorage:', e);
    }
    return { ...DEFAULT_PROGRESS };
  }

  /**
   * Save progress to localStorage.
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }

  /**
   * Notify listeners of progress change.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.progress));
  }

  /**
   * Subscribe to progress changes.
   */
  onChange(listener: (progress: GameProgress) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get full progress object.
   */
  getProgress(): GameProgress {
    return this.progress;
  }

  /**
   * Get progress for a specific language.
   */
  getLanguageProgress(languageId: string): LanguageProgress {
    if (!this.progress.languages[languageId]) {
      this.progress.languages[languageId] = {
        completedLevels: {},
        wordsLearned: [],
      };
    }
    return this.progress.languages[languageId];
  }

  /**
   * Get progress for a specific level.
   */
  getLevelProgress(languageId: string, levelId: string): LevelProgress | null {
    return this.progress.languages[languageId]?.completedLevels[levelId] || null;
  }

  /**
   * Check if a level is completed.
   */
  isLevelCompleted(languageId: string, levelId: string): boolean {
    const lp = this.getLevelProgress(languageId, levelId);
    return lp !== null && lp.stars > 0;
  }

  /**
   * Check if a level is unlocked.
   * Levels are unlocked sequentially — you must complete the previous level first.
   */
  isLevelUnlocked(languageId: string, levelId: string): boolean {
    // Parse world and level numbers
    const match = levelId.match(/world-(\d+)-level-(\d+)/);
    if (!match) return false;

    const worldNum = parseInt(match[1]);
    const levelNum = parseInt(match[2]);

    // First level is always unlocked
    if (worldNum === 1 && levelNum === 1) return true;

    // Check if previous level in same world is completed
    if (levelNum > 1) {
      const prevLevelId = `world-${worldNum}-level-${levelNum - 1}`;
      if (this.isLevelCompleted(languageId, prevLevelId)) return true;
    }

    // Check if last level of previous world is completed
    if (levelNum === 1 && worldNum > 1) {
      // Find the last level of the previous world
      const languageProgress = this.getLanguageProgress(languageId);
      const prevWorldLevels = Object.keys(languageProgress.completedLevels)
        .filter((k) => k.startsWith(`world-${worldNum - 1}`));
      return prevWorldLevels.length > 0;
    }

    return false;
  }

  /**
   * Get total stars earned in a language.
   */
  getTotalStars(languageId: string): number {
    const langProgress = this.getLanguageProgress(languageId);
    return Object.values(langProgress.completedLevels).reduce(
      (sum, lp) => sum + lp.stars,
      0
    );
  }

  /**
   * Save level completion data.
   */
  completeLevel(
    languageId: string,
    levelId: string,
    stars: number,
    wordsLearned: string[],
    gemsCollected: number = 0,
    timeSpent: number = 0
  ): void {
    const langProgress = this.getLanguageProgress(languageId);

    const existing = langProgress.completedLevels[levelId];
    const attempts = existing ? existing.attempts + 1 : 1;

    // Only keep best star rating
    const bestStars = existing ? Math.max(existing.stars, stars) : stars;

    langProgress.completedLevels[levelId] = {
      levelId,
      stars: bestStars,
      wordsLearned: [...new Set([...(existing?.wordsLearned || []), ...wordsLearned])],
      gemsCollected: Math.max(existing?.gemsCollected || 0, gemsCollected),
      timeSpent: (existing?.timeSpent || 0) + timeSpent,
      attempts,
      completedAt: new Date().toISOString(),
    };

    // Update aggregated words
    langProgress.wordsLearned = [
      ...new Set([...langProgress.wordsLearned, ...wordsLearned]),
    ];

    this.saveToStorage();
    this.notifyListeners();

    // Queue for server sync
    this.queueSync('completeLevel', {
      languageId,
      levelId,
      stars: bestStars,
      wordsLearned,
      gemsCollected,
      timeSpent,
    });
  }

  /**
   * Save a setting.
   */
  setSetting<K extends keyof GameProgress['settings']>(key: K, value: GameProgress['settings'][K]): void {
    (this.progress.settings as any)[key] = value;
    this.saveToStorage();
  }

  /**
   * Get a setting.
   */
  getSetting<K extends keyof GameProgress['settings']>(key: K): GameProgress['settings'][K] {
    return this.progress.settings[key];
  }

  /**
   * Queue an action for server sync.
   */
  private queueSync(action: string, data: any): void {
    this.progress.pendingSync.push({ action, data, timestamp: Date.now() });
    this.saveToStorage();
    this.trySync();
  }

  /**
   * Attempt to sync pending actions to server.
   */
  async trySync(): Promise<void> {
    if (this.progress.pendingSync.length === 0) return;

    try {
      const response = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.progress.userId,
          actions: this.progress.pendingSync,
          progress: this.progress,
        }),
      });

      if (response.ok) {
        this.progress.pendingSync = [];
        this.progress.lastSynced = new Date().toISOString();
        this.saveToStorage();
      }
    } catch (e) {
      // Server offline — will retry later
      console.log('Sync failed, will retry later');
    }
  }

  /**
   * Reset all progress (for testing / parent controls).
   */
  resetProgress(): void {
    this.progress = { ...DEFAULT_PROGRESS, userId: this.progress.userId };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Reset progress for a specific language.
   */
  resetLanguage(languageId: string): void {
    delete this.progress.languages[languageId];
    this.saveToStorage();
    this.notifyListeners();
  }
}
