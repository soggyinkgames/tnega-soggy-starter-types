import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
      "tools/**/*.spec.ts",
      "packages/**/*.spec.ts",
      "scripts/tests/**/*.spec.ts",
    ],
    environment: "node",
    globals: true,
  },
});
