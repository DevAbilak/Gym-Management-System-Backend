require("dotenv").config();
const app = require("./app");
const { testRedisConnection } = require("./config/redis");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Test Upstash Redis before starting
  const redisOk = await testRedisConnection();
  if (!redisOk) {
    console.error("Redis is not reachable. Shutting down.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received: closing HTTP server...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  });
};

startServer();
