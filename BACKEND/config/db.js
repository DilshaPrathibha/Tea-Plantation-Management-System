const mongoose = require("mongoose");

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool settings for better performance
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000
    });
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectdb;
