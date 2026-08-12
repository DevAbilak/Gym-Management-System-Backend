const globals = require("globals");

module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      semi: ["error", "always"],
      quotes: ["error", "single"],
    },
  },
];
