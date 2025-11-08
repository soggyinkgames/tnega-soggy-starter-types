import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/orch-*/**/*.spec.ts"],
    environment: "node",
    globals: true,
    reporters: [],
  },
});

