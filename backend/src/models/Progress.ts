import mongoose from 'mongoose';

const LevelCompletionSchema = new mongoose.Schema({
  levelId: { type: String, required: true },
  stars: { type: Number, required: true, min: 0, max: 3 },
  wordsLearned: [{ type: String }],
  gemsCollected: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  attempts: { type: Number, default: 1 },
  completedAt: { type: Date, default: Date.now },
});

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  languageId: { type: String, required: true },
  completedLevels: [LevelCompletionSchema],
  totalStars: { type: Number, default: 0 },
  wordsLearned: [{ type: String }],
  lastPlayedAt: { type: Date, default: Date.now },
});

ProgressSchema.index({ userId: 1, languageId: 1 }, { unique: true });

export default mongoose.model('Progress', ProgressSchema);
