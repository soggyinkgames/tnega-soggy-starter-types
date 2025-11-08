import { describe, it, expect } from "vitest";
import { HybridAdaptiveOrch } from ".";

describe("HybridAdaptiveOrch", () => {
  it("chooses concurrent strategy based on task preference", async () => {
    const a = { id: "a", run: async () => ({ a: true }) } as any;
    const b = { id: "b", run: async () => ({ b: true }) } as any;
    const res = await HybridAdaptiveOrch.run({ strategy: "concurrent" }, [a, b]);
    expect(res.id).toBe("orch-hybrid-adaptive");
    expect(res.strategy).toBe("concurrent");
    expect(Array.isArray((res as any).results)).toBe(true);
  });
  it("falls back to centralised-default with history when no pref provided", async () => {
    const a = { id: "a", run: async (i: any) => ({ step: 1 }) } as any;
    const b = { id: "b", run: async (i: any) => ({ step: 2 }) } as any;
    const res = await HybridAdaptiveOrch.run({ goal: "x" }, [a, b]);
    expect(res.id).toBe("orch-hybrid-adaptive");
    expect(res.strategy).toBe("centralised-default");
    expect(Array.isArray(res.history)).toBe(true);
    expect(res.history?.length).toBe(2);
  });
});

