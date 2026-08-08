require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./src/migrations" },
    seeds: { directory: "./src/seeders" },
    pool: { min: 2, max: 10 },
  },
};
