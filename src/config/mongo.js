const mongoose = require('mongoose');
const logger = require('./logger');

const mongoURI = process.env.MONGODB_URI;

const options = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections to keep open
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Timeout for socket operations
  family: 4, // Use IPv4
  retryWrites: true, // Retry write operations
  retryReads: true, // Retry read operations
};

let isConnected = false;

const connectMongo = async () => {
  try {
    // check if already connected
    if (isConnected) {
      logger.info('MongoDB already connected');
      return mongoose.connection;
    }

    // connect to MongoDB
    await mongoose.connect(mongoURI, options);
    isConnected = true;
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected event');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    // Gracefully close connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed via SIGINT');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

const disconnectMongo = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('MongoDB disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error.message);
  }
};

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectMongo,
  disconnectMongo,
  isMongoConnected,
  mongoose,
};
