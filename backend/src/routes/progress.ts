import express from 'express';
import Progress from '../models/Progress.js';

const router = express.Router();

// Save progress
router.post('/', async (req, res) => {
  try {
    const { userId, languageId, levelId, stars, wordsLearned, gemsCollected, timeSpent } = req.body;

    let progress = await Progress.findOne({ userId, languageId });

    if (!progress) {
      progress = new Progress({
        userId,
        languageId,
        completedLevels: [],
        totalStars: 0,
        wordsLearned: [],
      });
    }

    // Update or add level completion
    const existingIndex = progress.completedLevels.findIndex(
      (l: any) => l.levelId === levelId
    );

    const levelData = {
      levelId,
      stars: existingIndex >= 0
        ? Math.max(progress.completedLevels[existingIndex].stars, stars)
        : stars,
      wordsLearned: wordsLearned || [],
      gemsCollected: gemsCollected || 0,
      timeSpent: timeSpent || 0,
      attempts: existingIndex >= 0
        ? progress.completedLevels[existingIndex].attempts + 1
        : 1,
      completedAt: new Date(),
    };

    if (existingIndex >= 0) {
      progress.completedLevels[existingIndex] = levelData;
    } else {
      progress.completedLevels.push(levelData);
    }

    // Recalculate total stars
    progress.totalStars = progress.completedLevels.reduce(
      (sum: number, l: any) => sum + l.stars,
      0
    );

    // Update words learned
    if (wordsLearned && wordsLearned.length > 0) {
      progress.wordsLearned = [
        ...new Set([...progress.wordsLearned, ...wordsLearned]),
      ];
    }

    progress.lastPlayedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      totalStars: progress.totalStars,
      nextLevelUnlocked: null, // Client determines unlock logic
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get progress for a user in a language
router.get('/:userId/:languageId', async (req, res) => {
  try {
    const { userId, languageId } = req.params;
    const progress = await Progress.findOne({ userId, languageId });

    if (!progress) {
      return res.json({
        userId,
        languageId,
        completedLevels: [],
        totalStars: 0,
        wordsLearned: [],
      });
    }

    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all progress for a user
router.get('/:userId', async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync pending actions
router.post('/sync', async (req, res) => {
  try {
    const { userId, actions, progress } = req.body;

    // Process each pending action
    for (const action of actions || []) {
      if (action.action === 'completeLevel') {
        let record = await Progress.findOne({
          userId,
          languageId: action.data.languageId,
        });

        if (!record) {
          record = new Progress({
            userId,
            languageId: action.data.languageId,
            completedLevels: [],
            totalStars: 0,
            wordsLearned: [],
          });
        }

        const existingIndex = record.completedLevels.findIndex(
          (l: any) => l.levelId === action.data.levelId
        );

        const levelData = {
          levelId: action.data.levelId,
          stars: action.data.stars,
          wordsLearned: action.data.wordsLearned || [],
          gemsCollected: action.data.gemsCollected || 0,
          timeSpent: action.data.timeSpent || 0,
          attempts: existingIndex >= 0
            ? record.completedLevels[existingIndex].attempts + 1
            : 1,
          completedAt: new Date(),
        };

        if (existingIndex >= 0) {
          record.completedLevels[existingIndex] = levelData;
        } else {
          record.completedLevels.push(levelData);
        }

        record.totalStars = record.completedLevels.reduce(
          (sum: number, l: any) => sum + l.stars,
          0
        );
        record.lastPlayedAt = new Date();
        await record.save();
      }
    }

    res.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
