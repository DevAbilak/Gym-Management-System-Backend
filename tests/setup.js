const knex = require("../src/db/db");
const mongoose = require("mongoose");
const { redisClient } = require("../src/config/redis");
const { cleanAll } = require("./helpers/db");

// safety guard
if (process.env.NODE_ENV !== "test") {
  console.error("FATAL: Tests must be run with NODE_ENV=test");
  console.error("Run: NODE_ENV=test npm test");
  process.exit(1);
}

// global hooks
beforeAll(async () => {
  // connect mongodb if not already connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  await cleanAll();
});

beforeEach(async () => {
  await cleanAll();
});

afterAll(async () => {
  await knex.destroy();
  await redisClient.quit();
  await mongoose.disconnect();
});

module.exports = { cleanAll };
