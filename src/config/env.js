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
  STARPAY_API_SECRET: str({ desc: 'StarPay api secret for payment' }),

  STARPAY_CALLBACK_SECRET: str({
    desc: 'StarPay webhook secret code for payment verification',
  }),
  STARPAY_API_URL: url({ desc: 'StarPay sandbox api URL for payment' }),
  STARPAY_REDIRECT_URL: url({
    desc: 'Frontend application redirect URL for successful payment',
  }),
  STARPAY_WEBHOOK_URL: url({
    desc: 'Backend application webhook URL for payment',
  }),
});
