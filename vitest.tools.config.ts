import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/*/**/*.spec.ts"],
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

