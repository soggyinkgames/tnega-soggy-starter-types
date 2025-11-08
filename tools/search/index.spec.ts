import { describe, it, expect } from "vitest";
import { searchTool } from ".";

describe("tools/search", () => {
  it("returns hits for a query", async () => {
    const res = await searchTool.run({ query: "demo" }, {} as any);
    expect(res).toBeTruthy();
    expect(Array.isArray(res.hits)).toBe(true);
    expect(res.hits.length).toBeGreaterThan(0);
  });
});

