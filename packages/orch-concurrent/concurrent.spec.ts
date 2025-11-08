import { describe, it, expect } from "vitest";
import { ConcurrentOrch } from ".";

describe("ConcurrentOrch", () => {
  it("runs in parallel and returns history with duration", async () => {
    const a = { id: "a", run: async () => ({ a: true }) } as any;
    const b = { id: "b", run: async () => ({ b: true }) } as any;
    const res = await ConcurrentOrch.run({ ping: true }, [a, b]);
    expect(res.id).toBe("orch-concurrent");
    expect(res.strategy).toBe("concurrent");
    expect(Array.isArray(res.history)).toBe(true);
    expect((res.history as any[]).length).toBe(2);
    expect(typeof (res as any).duration).toBe("number");
  });
});

