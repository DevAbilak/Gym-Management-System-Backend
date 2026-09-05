const path = require("path");
const fs = require("fs");

// Only load .env.test if the file exists (local dev)
// In CI, environment variables are set directly via GitHub Actions secrets.
const envPath = path.resolve(__dirname, "../.env.test");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

// Safety guard
if (process.env.NODE_ENV !== "test") {
  console.error("FATAL: Tests must be run with NODE_ENV=test");
  console.error("Run: NODE_ENV=test npm test");
  process.exit(1);
}

const knex = require("../src/db/db");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { redisClient } = require("../src/config/redis");
const { truncatePostgres, clearMongo, clearRedis } = require("./helpers/db");

// GLOBAL HOOKS

// Increase timeout to 30 seconds
jest.setTimeout(30000);

let redisConnected = false;
let mongoServer;

beforeAll(async () => {
  // Connect to databases
  try {
    await knex.raw("SELECT 1");
    console.log("PostgreSQL connected (test)");
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
    process.exit(1);
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("MongoDB memory server started");
  } catch (err) {
    console.warn("MongoDB connection failed, continuing without MongoDB");
  }

  try {
    await redisClient.ping();
    redisConnected = true;
    console.log("Redis connected (test)");
  } catch (err) {
    console.warn("Redis connection failed, continuing without Redis");
    redisConnected = false;
  }

  // Clean ONCE before ALL tests
  await truncatePostgres();
  await clearMongo();
  if (redisConnected) {
    await clearRedis();
  }
  console.log("Database cleaned before tests");
}, 30000);

afterAll(async () => {
  await knex.destroy();
  if (redisConnected) {
    await redisClient.quit();
  }
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  console.log("Database connections closed");
}, 30000);
