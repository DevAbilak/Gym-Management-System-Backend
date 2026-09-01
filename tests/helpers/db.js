const knex = require("../../src/db/db");
const mongoose = require("mongoose");
const { redisClient } = require("../../src/config/redis");

// truncate all postgres tables
const truncatePostgres = async () => {
  const tables = [
    "users",
    "member_profiles",
    "trainers",
    "subscriptions",
    "classes",
    "class_bookings",
    "attendance_records",
    "ratings",
    "invoices",
    "member_assignments",
  ];

  for (const table of tables) {
    await knex.raw(`TRUNCATE TABLE ${table} CASCADE`);
  }
};

// delete all mongoDB collections
const clearMongo = async () => {
  const collections = [
    "healthmetrics",
    "workouttemplates",
    "mealplans",
    "notifications",
  ];
  for (const collection of collections) {
    await mongoose.connection.collection(collection).deleteMany({});
  }
};

// flush redis
const clearRedis = async () => {
  await redisClient.flushAll();
};

// clean all test databases
const cleanAll = async () => {
  await truncatePostgres();
  await clearMongo();
  await clearRedis();
};

module.exports = {
  truncatePostgres,
  clearMongo,
  clearRedis,
  cleanAll,
};
