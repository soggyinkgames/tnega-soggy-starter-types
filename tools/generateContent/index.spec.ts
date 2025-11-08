import { describe, it, expect } from "vitest";
import { runTool } from ".";

describe("tools/generateContent", () => {
  it("generates content for topic", async () => {
    const res = await runTool({ topic: "X" });
    expect(String(res.content)).toContain("X");
  });
});

