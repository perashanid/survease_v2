import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_platform';

// Connect to MongoDB
export const connectDatabase = async (): Promise<boolean> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // These options are good for Atlas connections
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ MongoDB Atlas connection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Already connected
      return true;
    }
    return await connectDatabase();
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB');
});