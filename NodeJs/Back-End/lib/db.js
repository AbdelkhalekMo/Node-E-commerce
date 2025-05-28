import mongoose from "mongoose";
import { config } from "./config.js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export const connectDB = async (retryCount = 0) => {
  try {
    console.log("Connecting to MongoDB with URI:", config.mongoUri ? "***defined***" : "undefined");
    
    const conn = await mongoose.connect(config.mongoUri, {
      // Add recommended connection options
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY);
      }
    });

    // Handle process termination
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    } else {
      console.error("Failed to connect to MongoDB after maximum retries");
      process.exit(1);
    }
  }
};

const cleanup = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB cleanup:', err);
    process.exit(1);
  }
};
