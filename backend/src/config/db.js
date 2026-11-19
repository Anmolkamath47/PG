import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongod = null;

export const connectDB = async () => {
  try {
    // 1. If external MongoDB URI is specified (e.g. MongoDB Atlas or local MongoDB service)
    if (config.mongodbUri && config.mongodbUri.trim() !== '') {
      try {
        console.log(`Connecting to configured MongoDB: ${config.mongodbUri.split('@').pop()}`);
        const conn = await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(`Could not connect to external MongoDB: ${err.message}. Falling back to persistent local storage...`);
      }
    }

    // 2. Persistent Local Embedded MongoDB (WiredTiger on-disk storage)
    // Ensures all data (buildings, rooms, beds, tenants, menus, invoices) is preserved across restarts and updates!
    const dbPath = path.resolve(__dirname, '..', '..', 'data', 'db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    // Safely remove stale lock file from previous sudden termination if present
    const lockFile = path.join(dbPath, 'mongod.lock');
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
      } catch (e) {
        // file may be active
      }
    }

    console.log(`💾 Initializing persistent local database at: ${dbPath}`);
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
        dbName: 'pgmate',
      },
    });

    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri, {
      dbName: 'pgmate',
    });

    console.log(`✅ Persistent Local MongoDB Connected: ${conn.connection.host} (dbName: pgmate)`);
    console.log(`📁 Database storage directory: ${dbPath}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      // doCleanup: false ensures on-disk database files are NOT erased on shutdown!
      await mongod.stop({ doCleanup: false });
    }
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
};
