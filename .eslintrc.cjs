module.exports = {
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  settings: {
    jest: {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      version: require("jest/package.json").version,
    },
  },
};
