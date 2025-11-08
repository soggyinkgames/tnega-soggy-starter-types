import { describe, it, expect } from "vitest";
import { SharedMemoryOrch } from ".";

describe("SharedMemoryOrch", () => {
  it("updates blackboard per agent with history entries", async () => {
    const a = { id: "a", run: async (bb: any) => ({ a: Object.keys(bb).length }) } as any;
    const b = { id: "b", run: async (bb: any) => ({ b: Object.keys(bb).length }) } as any;
    const res = await SharedMemoryOrch.run({ goal: "t" }, [a, b]);
    expect(res.id).toBe("orch-shared-memory");
    expect(res.strategy).toBe("shared-memory");
    expect(res.blackboard).toBeTruthy();
    expect(res.blackboard["a"]).toBeTruthy();
    expect(res.blackboard["b"]).toBeTruthy();
    expect(res.history?.length).toBe(2);
  });
});

