import { describe, it, expect } from "vitest";
import { HierarchicalOrch } from ".";
import type { Agent } from "../types";

describe("HierarchicalOrch", () => {
  it("gathers worker outputs and manager decisions with history", async () => {
    const mgr: Agent = { id: "m1", role: "manager", run: async () => ({ decide: true }) } as any;
    const w1: Agent = { id: "w1", run: async () => ({ out: 1 }) } as any;
    const w2: Agent = { id: "w2", run: async () => ({ out: 2 }) } as any;
    const res = await HierarchicalOrch.run({ goal: "x" }, [mgr, w1, w2]);
    expect(res.id).toBe("orch-hierarchical");
    expect(res.strategy).toBe("hierarchical");
    expect(Object.keys(res.workerOutputs || {}).length).toBe(2);
    expect(Object.keys(res.decisions || {}).length).toBe(1);
    expect((res.history || []).length).toBeGreaterThanOrEqual(3);
  });
});

