/**
 * Swagger / OpenAPI Configuration
 *
 * Centralizes API documentation setup.
 * Imports modular documentation files from src/docs/
 */
const swaggerUi = require('swagger-ui-express');
const logger = require('./logger');

// Import modular documentation
const { authPaths, authSchemas } = require('../docs/auth.docs');
const { adminPaths, adminSchemas } = require('../docs/admin.docs');
const { classPaths, classSchemas } = require('../docs/class.docs');
const { memberPaths, memberSchemas } = require('../docs/member.docs');
const { checkinPaths, checkinSchemas } = require('../docs/checkin.docs');
const { trainerPaths, trainerSchemas } = require('../docs/trainer.docs');
const { bookingPaths, bookingSchemas } = require('../docs/booking.docs');
const { healthPaths, healthSchemas } = require('../docs/health.docs');
const { templatePaths, templateSchemas } = require('../docs/template.docs');
const {
  notificationPaths,
  notificationSchemas,
} = require('../docs/notification.docs');
const { progressPaths, progressSchemas } = require('../docs/progress.docs');
const { ratingPaths, ratingSchemas } = require('../docs/rating.docs');
const { paymentPaths, paymentSchemas } = require('../docs/payment.docs');
const {
  subscriptionPaths,
  subscriptionSchemas,
} = require('../docs/subscription.docs');

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Gym Management System API',
    version: '1.0.0',
    description: 'API documentation for the Gym Management System backend.',
    contact: {
      name: 'Dev Abilak',
      email: 'abilak0716@gmail.com',
    },
  },
  servers: [
    {
      url: 'https://gym-management-system-backend-xb5m.onrender.com/api/v1',
      description: 'Production Server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development Server',
    },
  ],
  paths: {
    // Merge all modular paths here
    ...authPaths,
    ...adminPaths,
    ...classPaths,
    ...memberPaths,
    ...checkinPaths,
    ...trainerPaths,
    ...bookingPaths,
    ...healthPaths,
    ...templatePaths,
    ...notificationPaths,
    ...progressPaths,
    ...ratingPaths,
    ...paymentPaths,
    ...subscriptionPaths,
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (obtained from /auth/login)',
      },
    },
    schemas: {
      // Merge all modular schemas here
      ...authSchemas,
      ...adminSchemas,
      ...classSchemas,
      ...memberSchemas,
      ...checkinSchemas,
      ...trainerSchemas,
      ...bookingSchemas,
      ...healthSchemas,
      ...templateSchemas,
      ...notificationSchemas,
      ...progressSchemas,
      ...ratingSchemas,
      ...paymentSchemas,
      ...subscriptionSchemas,
    },
  },
};

const setupSwagger = (app) => {
  // Serve Swagger UI at /api-docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Gym API Docs',
    }),
  );

  // Optional: Serve raw spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('Swagger docs available at: http://localhost:3000/api-docs');
};

module.exports = { setupSwagger, swaggerSpec };
