import { describe, it, expect } from "vitest";
import { runTool } from ".";

describe("tools/summarize", () => {
  it("returns a summary under 64 chars", async () => {
    const res = await runTool({ text: "Hello world" });
    expect(typeof res.summary).toBe("string");
    expect(res.summary.length).toBeLessThanOrEqual(64);
  });
});

