import { describe, it, expect } from "vitest";
import { GroupCollaborativeOrch } from ".";

describe("GroupCollaborativeOrch", () => {
  it("cycles dialogue for 3 rounds and returns transcript and consensus", async () => {
    const a = { id: "a", name: "A", respond: async (p: string) => `respA:${p}` } as any;
    const b = { id: "b", name: "B", respond: async (p: string) => `respB:${p}` } as any;
    const res = await GroupCollaborativeOrch.run({ prompt: "hi" }, [a, b]);
    expect(res.id).toBe("orch-group-collaborative");
    expect(res.strategy).toBe("group-collaborative");
    expect(Array.isArray(res.transcript)).toBe(true);
    expect(res.transcript.length).toBe(3 * 2);
    expect(typeof res.consensus).toBe("string");
    expect(res.history?.length).toBe(3 * 2);
  });
});

