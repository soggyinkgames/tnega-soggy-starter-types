import { describe, it, expect } from "vitest";
import { runTool } from ".";

describe("tools/analyzeData", () => {
  it("computes count and mean", async () => {
    const res = await runTool({ data: [1, 2, 3] });
    expect(res.count).toBe(3);
    expect(res.mean).toBeCloseTo(2);
  });
});

