import { defineConfig } from "tsup";

export default defineConfig({
  name: "eslint-baseline",
  clean: true,
  dts: false,
  format: "esm",
  target: "node18",
});
