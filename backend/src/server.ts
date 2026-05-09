import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import progressRoutes from './routes/progress.js';
import wordsRoutes from './routes/words.js';
import levelsRoutes from './routes/levels.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/progress', progressRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/levels', levelsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static game files in production
if (config.nodeEnv === 'production') {
  app.use(express.static(resolve(import.meta.dirname, '../../dist')));
}

// Connect to DB and start server
connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[Shabd Saga] Server running on http://localhost:${config.port}`);
      console.log(`[Shabd Saga] Environment: ${config.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error('[Shabd Saga] Failed to connect to MongoDB:', err.message);
    console.log('[Shabd Saga] Starting server without database...');
    app.listen(config.port, () => {
      console.log(`[Shabd Saga] Server running on http://localhost:${config.port} (no DB)`);
    });
  });

export default app;
