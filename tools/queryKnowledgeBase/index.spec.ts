import { describe, it, expect } from "vitest";
import { runTool } from ".";

describe("tools/queryKnowledgeBase", () => {
  it("returns at least one match", async () => {
    const res = await runTool({ query: "demo" });
    expect(res).toHaveProperty("hits");
    expect(Array.isArray(res.hits)).toBe(true);
    expect(res.hits.length).toBeGreaterThan(0);
  });
});

