/**
 * Database Connection
 *
 * Initializes Knex using the config from knexfile.js
 * and exports a single connection pool for the whole app.
 */
const knex = require('knex');
const config = require('../../knexfile');
const logger = require('../config/logger');

// Determine environment (default to 'development')
const environment = process.env.NODE_ENV || 'development';

// Create the connection pool
const db = knex(config[environment]);

// Optional: Test the connection on startup
db.raw('SELECT 1')
  .then(() => logger.info('PostgreSQL connected via Knex'))
  .catch((err) => {
    logger.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;
