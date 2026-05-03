import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('[Shabd Saga] Connected to MongoDB');
}

mongoose.connection.on('error', (err) => {
  console.error('[Shabd Saga] MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('[Shabd Saga] MongoDB disconnected');
});
