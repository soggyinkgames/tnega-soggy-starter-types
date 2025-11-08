import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/tests/**/*.spec.ts"],
    environment: "node",
    globals: true,
    reporters: [[
        "default",
        {
          "summary": false
        }
      ]],
  },
});

