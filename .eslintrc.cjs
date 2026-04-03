module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:prettier/recommended",
  ],
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": ["warn", { "newlines-between": "always" }],
    "no-console": "warn",
  },
  ignorePatterns: [
    "artifacts/",
    "cache/",
    "coverage/",
    "node_modules/",
    "dist/",
  ],
};
