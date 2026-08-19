const { cleanEnv, str, port, url } = require('envalid');

module.exports = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  DATABASE_URL: url({ desc: 'Neon PostgreSQL connection string' }),
  MONGODB_URI: url({ desc: ' MongoDB Atlas connection string' }),
  REDIS_URL: url({ desc: 'Upstash Redis connection string' }),
  JWT_SECRET: str({ desc: 'Secret key for JWT signing' }),
  BREVO_API_KEY: str({ desc: 'Brevo (Sendinblue) API key for emails' }),
  EMAIL_FROM: str({ desc: 'Sender email address for system emails' }),
  CLIENT_URL: url({ desc: 'Frontend application URL for reset links' }),
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
    default: 'info',
  }),
});
