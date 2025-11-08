import { describe, it, expect } from "vitest";
import { NegotiateOrch } from ".";
import type { Agent } from "../types";

describe("NegotiateOrch", () => {
  it("selects winner by highest score and records history", async () => {
    const a: Agent = { id: "a", cost: 0.1, propose: async()=>({score:0.9}), run: async()=>"A" } as any;
    const b: Agent = { id: "b", cost: 0.9, propose: async()=>({score:0.2}), run: async()=>"B" } as any;
    const res = await NegotiateOrch.run({ goal: "t" }, [a,b]);
    expect(res.id).toBe("orch-negotiate");
    expect(res.strategy).toBe("negotiate");
    expect(res.winner).toBe("a");
    expect(Array.isArray(res.ranking)).toBe(true);
    expect(res.history?.length).toBe(1);
  });
});

