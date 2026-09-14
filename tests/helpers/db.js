const knex = require("../../src/db/db");
const mongoose = require("mongoose");
const { redisClient } = require("../../src/config/redis");
const {
  HealthMetric,
  Notification,
  MealPlan,
  WorkoutTemplate,
} = require("../../src/models/index");

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
// const clearMongo = async () => {
//   // Only clear if MongoDB is connected
//   if (mongoose.connection.readyState !== 1) {
//     console.log("MongoDB not connected, skipping clear");
//     return;
//   }
//   const collections = [
//     "HealthMetric",
//     "WorkoutTemplate",
//     "MealPlan",
//     "Notification",
//   ];
//   for (const collection of collections) {
//     try {
//       const coll = mongoose.connection.collection(collection);
//       if (coll) {
//         await coll.deleteMany({});
//       }
//     } catch (err) {
//       console.warn(`Failed to clear collection ${collection}:`, err.message);
//     }
//   }
// };

const clearMongo = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("MongoDB not connected, skipping clear");
    return;
  }

  const models = [HealthMetric, WorkoutTemplate, MealPlan, Notification];

  for (const Model of models) {
    try {
      await Model.deleteMany({});
    } catch (err) {
      console.warn(
        `Failed to clear collection ${Model.collection.name}:`,
        err.message,
      );
    }
  }
};

// flush redis
const clearRedis = async () => {
  try {
    if (redisClient.flushall) {
      await redisClient.flushall();
    }
  } catch (error) {
    console.warn("Failed to clear Redis:", err.message);
  }
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
