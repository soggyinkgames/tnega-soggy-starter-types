import { describe, it, expect } from "vitest";
import { CentralisedOrch } from ".";
import type { Agent } from "../types";

describe("CentralisedOrch", () => {
  it("runs agents sequentially with history and result", async () => {
    const a: Agent = { id: "a", run: async (i: any) => `${i}-A` } as any;
    const b: Agent = { id: "b", run: async (i: any) => `${i}-B` } as any;
    const res = await CentralisedOrch.run("S", [a, b]);
    expect(res.id).toBe("orch-centralised");
    expect(res.strategy).toBe("centralised");
    expect(res.result).toBe("S-A-B");
    expect(res.history?.length).toBe(2);
    expect(res.history?.[0].agentId).toBe("a");
    expect(res.history?.[1].agentId).toBe("b");
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);
  });
});

