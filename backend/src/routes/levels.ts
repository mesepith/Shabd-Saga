import express from 'express';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const router = express.Router();

// Get level metadata for a language (no word data, just structure)
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const filePath = resolve(
      import.meta.dirname,
      `../../data/${language}.json`
    );

    const data = JSON.parse(await readFile(filePath, 'utf-8'));

    // Strip word data — return only level metadata
    const levels = data.levels.map((level: any) => ({
      id: level.id,
      worldNumber: level.worldNumber,
      levelNumber: level.levelNumber,
      name: level.name,
      nameEnglish: level.nameEnglish,
      theme: level.theme,
      difficulty: level.difficulty,
      hasBoss: level.boss !== null,
      wordCount: level.words.length,
    }));

    res.json({
      languageId: data.languageId,
      languageName: data.languageName,
      nativeName: data.nativeName,
      levels,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific level with full data
router.get('/:language/:levelId', async (req, res) => {
  try {
    const { language, levelId } = req.params;
    const filePath = resolve(
      import.meta.dirname,
      `../../data/${language}.json`
    );

    const data = JSON.parse(await readFile(filePath, 'utf-8'));
    const level = data.levels.find((l: any) => l.id === levelId);

    if (!level) {
      return res.status(404).json({ error: `Level "${levelId}" not found` });
    }

    res.json(level);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
