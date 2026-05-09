import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(import.meta.dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shabd-saga',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminSecret: process.env.ADMIN_SECRET || 'change-this-in-production',
};
