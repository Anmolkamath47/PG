import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';

let mongod = null;

export const connectDB = async () => {
  try {
    if (config.mongodbUri && config.mongodbUri.trim() !== '') {
      try {
        console.log(`Connecting to configured MongoDB URI: ${config.mongodbUri.split('@').pop()}`);
        const conn = await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(`Could not connect to external MongoDB: ${err.message}. Initializing in-memory MongoDB...`);
      }
    }

    console.log('Initializing embedded MongoDB instance for seamless local operation...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`Embedded MongoDB Connected: ${conn.connection.host} (${uri})`);
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
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
};
