# Backend API Design

## Overview
Node.js + Express REST API with MongoDB for persistence. Provides word data, level configs, and user progress tracking. The game works offline with localStorage, syncing to the server when online.

## Server Setup

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import progressRoutes from './routes/progress';
import wordsRoutes from './routes/words';
import levelsRoutes from './routes/levels';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/progress', progressRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/admin', adminRoutes);

// Serve static game files in production
app.use(express.static('../dist'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shabd-saga')
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
```

## API Endpoints

### GET /api/words/:language
Returns the full language word configuration.

**Response:**
```json
{
  "languageId": "hindi",
  "languageName": "Hindi",
  "nativeName": "हिन्दी",
  "fontFamily": "Noto Sans Devanagari",
  "levels": [...]
}
```

### GET /api/words/:language/level/:levelId
Returns words for a specific level.

### GET /api/levels/:language
Returns level metadata (no word data, just structure for LevelSelectScene).

### POST /api/progress
Save user progress. Used after level completion.

**Request:**
```json
{
  "userId": "user123",
  "languageId": "hindi",
  "levelId": "world-1-level-1",
  "stars": 3,
  "wordsLearned": ["baagh", "haathi", "mor"],
  "gemsCollected": 3,
  "timeSpent": 245,
  "completedAt": "2026-05-03T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "totalStars": 3,
  "nextLevelUnlocked": "world-1-level-2"
}
```

### GET /api/progress/:userId/:language
Get all progress for a user in a specific language.

**Response:**
```json
{
  "userId": "user123",
  "languageId": "hindi",
  "completedLevels": [
    { "levelId": "world-1-level-1", "stars": 3, "completedAt": "..." }
  ],
  "totalStars": 3,
  "wordsLearned": ["baagh", "haathi", "mor"],
  "lastPlayedAt": "2026-05-03T10:30:00Z"
}
```

### GET /api/progress/:userId
Get all progress across all languages.

### POST /api/admin/words
Add or update words. Protected endpoint (future: auth middleware).

### POST /api/admin/levels
Create or update level configurations.

## MongoDB Schemas

### User Collection
```javascript
{
  userId: String,      // Unique ID (UUID or username)
  name: String,        // Child's name
  age: Number,         // For analytics
  avatar: String,      // Avatar preference
  createdAt: Date,
  lastActive: Date
}
```

### Progress Collection
```javascript
{
  userId: String,
  languageId: String,
  completedLevels: [
    {
      levelId: String,
      stars: Number,         // 1-3
      wordsLearned: [String],
      gemsCollected: Number,
      timeSpent: Number,     // seconds
      attempts: Number,      // how many tries
      completedAt: Date
    }
  ],
  totalStars: Number,
  wordsLearned: [String],    // Aggregated unique words
  lastPlayedAt: Date
}
```

### Word Collection (Admin-managed)
```javascript
{
  languageId: String,
  wordId: String,
  script: String,
  transliteration: String,
  translation: String,
  splitLetters: [String],
  category: String,
  difficulty: Number,
  audioPath: String,
  exampleSentence: String,
  exampleTranslation: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Sync Strategy

### Offline-First Flow
```
1. Level completed
2. SaveManager saves to localStorage immediately
3. If online → POST to /api/progress (sync)
4. If offline → Queue in localStorage["pendingSync"]
5. On next online → flush pendingSync queue
6. Server responds with merged progress
7. Conflict resolution: server wins (later timestamp)
```

### localStorage Structure
```javascript
// Key: "shabd-saga-progress"
{
  "userId": "user123",
  "lastSynced": "2026-05-03T10:30:00Z",
  "languages": {
    "hindi": {
      "completedLevels": {
        "world-1-level-1": { "stars": 3, "completedAt": "..." }
      },
      "wordsLearned": ["baagh", "haathi", "mor"]
    }
  },
  "pendingSync": [
    {
      "action": "completeLevel",
      "data": { "languageId": "hindi", "levelId": "world-1-level-2", "stars": 2 }
    }
  ]
}
```

## Environment Variables
```
PORT=3001
MONGO_URI=mongodb://localhost:27017/shabd-saga
NODE_ENV=development
ADMIN_SECRET=your-secret-here
```
