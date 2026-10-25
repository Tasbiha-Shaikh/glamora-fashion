const mongoose = require('mongoose');

/**
 * Global cache for Mongoose connection across serverless invocations (Vercel).
 * In serverless environments, functions are kept warm between invocations.
 * Caching the connection prevents hitting MongoDB connection limits (e.g. Atlas 500 connections limit).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('⚠️ [Database Error]: MONGO_URI is not defined in environment variables.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Return immediate error instead of hanging when disconnected
      serverSelectionTimeoutMS: 5000, // Timeout fast after 5s instead of hanging serverless function
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongooseInstance) => {
        console.log(`✓ MongoDB Connected successfully: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error(`✕ MongoDB Connection Failed: ${err.message}`);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
