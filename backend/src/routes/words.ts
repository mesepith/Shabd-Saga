import express from 'express';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const router = express.Router();

// Get full word data for a language
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const filePath = resolve(
      import.meta.dirname,
      `../../data/${language}.json`
    );

    const data = await readFile(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err: any) {
    // Fall back to static file
    res.status(404).json({
      error: `Language data not found for "${req.params.language}"`,
    });
  }
});

// Get words for a specific level
router.get('/:language/level/:levelId', async (req, res) => {
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

    res.json({ words: level.words });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
