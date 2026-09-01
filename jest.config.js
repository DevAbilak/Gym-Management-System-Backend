module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  forceExit: true,
  detectOpenHandles: true,
};
