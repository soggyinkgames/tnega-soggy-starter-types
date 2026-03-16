import { describe, expect, it } from "vitest";

import { executeTool, loadToolHandler } from "../../src/tools/runtime";
import { UnknownToolIdError } from "../../src/tools/types";

describe("tool runtime execution", () => {
  it("loads and executes a tool by id", async () => {
    const result = await executeTool("search", { query: "hello" });
    expect(result?.hits?.length).toBeGreaterThan(0);
  });

  it("handles function-style implementations (generate-content)", async () => {
    const { run } = await loadToolHandler("generate-content");
    const result = await run({ topic: "reports" });
    expect(result?.content).toContain("reports");
  });

  it("fails explicitly for unknown tool id", async () => {
    await expect(executeTool("not-a-tool", {})).rejects.toThrow(UnknownToolIdError);
  });
});
