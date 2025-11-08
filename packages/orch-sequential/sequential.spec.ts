import { describe, it, expect } from "vitest";
import { SequentialOrch } from ".";

describe("SequentialOrch", () => {
  it("pipes output from each agent to the next", async () => {
    const a = { id: "a", run: async () => "X" } as any;
    const b = { id: "b", run: async (i: any) => i + "Y" } as any;
    const res = await SequentialOrch.run("S", [a, b]);
    expect(res.id).toBe("orch-sequential");
    expect(res.strategy).toBe("sequential");
    expect(res.result).toBe("XY");
    expect(res.history?.length).toBe(2);
  });
});

