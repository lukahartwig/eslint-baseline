const jestPackageJson = require("jest/package.json");

module.exports = {
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "plugin:node/recommended", "prettier"],
  overrides: [
    {
      files: ["*.ts", "*.mts", "*.cts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jest/recommended",
      ],
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],
  },
  plugins: ["@typescript-eslint"],
  root: true,
  settings: {
    jest: {
      version: jestPackageJson.version,
    },
  },
};
