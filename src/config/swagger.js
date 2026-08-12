/**
 * Swagger / OpenAPI Configuration
 *
 * Centralizes API documentation setup.
 * Imports modular documentation files from src/docs/
 */
const swaggerUi = require("swagger-ui-express");

// Import modular documentation
const { authPaths, authSchemas } = require("../docs/auth.docs");
// Import future docs as they are created
// const { memberPaths, memberSchemas } = require('../docs/member.docs');
// const { subscriptionPaths, subscriptionSchemas } = require('../docs/subscription.docs');

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Gym Management System API",
    version: "1.0.0",
    description: "API documentation for the Gym Management System backend.",
    contact: {
      name: "Dev Abilak",
      email: "abilak0716@gmail.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development Server",
    },
    {
      url: "https://gym-management-system-backend-xb5m.onrender.com/api",
      description: "Production Server",
    },
  ],
  paths: {
    // Merge all modular paths here
    ...authPaths,
    // ...memberPaths,
    // ...subscriptionPaths,
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token (obtained from /auth/login)",
      },
    },
    schemas: {
      // Merge all modular schemas here
      ...authSchemas,
      // ...memberSchemas,
      // ...subscriptionSchemas,
    },
  },
};

const setupSwagger = (app) => {
  // Serve Swagger UI at /api-docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Gym API Docs",
    }),
  );

  // Optional: Serve raw spec as JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger docs available at: http://localhost:3000/api-docs");
};

module.exports = { setupSwagger, swaggerSpec };
