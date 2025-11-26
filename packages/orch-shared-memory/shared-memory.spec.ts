// orchestrations/sharedMemory/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { SharedMemoryOrch, runOrchFramework } from ".";
import type { Agent } from "../types";

describe("SharedMemoryOrch", () => {
  it("runs agents with a shared blackboard that accumulates contributions", async () => {
    const task = { topic: "shared" };

    let boardSeenByA: any;
    let boardSeenByB: any;

    const agentA: Agent = {
      id: "agent-a",
      run: vi.fn(async (blackboard: any, ctx?: any) => {
        // First agent sees initial blackboard
        expect(blackboard.task).toBe(task);
        expect(ctx?.mode).toBe("shared-memory");
        expect(ctx?.index).toBe(0);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);

        boardSeenByA = blackboard;
        return { note: "A was here" };
      })
    } as any;

    const agentB: Agent = {
      id: "agent-b",
      run: vi.fn(async (blackboard: any, ctx?: any) => {
        // Second agent sees A's contribution on the same object
        expect(blackboard.task).toBe(task);
        expect(blackboard["agent-a"]).toEqual({ note: "A was here" });
        expect(ctx?.mode).toBe("shared-memory");
        expect(ctx?.index).toBe(1);

        boardSeenByB = blackboard;
        return { note: "B was here" };
      })
    } as any;

    const res = await SharedMemoryOrch.run(task, [agentA, agentB]);

    // Orchestration metadata
    expect(res.id).toBe("orch-shared-memory");
    expect(res.strategy).toBe("shared-memory");
    expect(typeof res.duration).toBe("number");

    // Blackboard accumulates contributions under agent ids
    expect(res.blackboard.task).toBe(task);
    expect(res.blackboard["agent-a"]).toEqual({ note: "A was here" });
    expect(res.blackboard["agent-b"]).toEqual({ note: "B was here" });

    // Both agents saw the same live blackboard object
    expect(boardSeenByA).toBe(boardSeenByB);

    // History snapshots input state and output per agent
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    expect(res.history?.[0]).toMatchObject({
      agentId: "agent-a",
      input: { task }, // before A ran
      output: { note: "A was here" }
    });

    expect(res.history?.[1].agentId).toBe("agent-b");
    expect(res.history?.[1].input).toMatchObject({
      task,
      "agent-a": { note: "A was here" }
    });

    // Calls
    expect(agentA.run).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ mode: "shared-memory", index: 0 })
    );
    expect(agentB.run).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ mode: "shared-memory", index: 1 })
    );
  });

  it("captures errors per agent while continuing with others", async () => {
    const task = "shared-error";

    const failingAgent: Agent = {
      id: "fail",
      run: vi.fn(async () => {
        throw new Error("boom");
      })
    } as any;

    const okAgent: Agent = {
      id: "ok",
      run: vi.fn(async (blackboard: any) => {
        // Even if fail didn't write anything, ok still sees task
        expect(blackboard.task).toBe(task);
        // Return something to write under ok's key
        return { status: "ok" };
      })
    } as any;

    const res = await SharedMemoryOrch.run(task, [failingAgent, okAgent]);

    // Blackboard should at least have task + ok's contribution
    expect(res.blackboard.task).toBe(task);
    expect(res.blackboard["ok"]).toEqual({ status: "ok" });

    const failHistory = res.history?.find(h => h.agentId === "fail");
    const okHistory = res.history?.find(h => h.agentId === "ok");

    expect(failHistory?.error).toContain("boom");
    expect(okHistory?.output).toEqual({ status: "ok" });

    expect(failingAgent.run).toHaveBeenCalledTimes(1);
    expect(okAgent.run).toHaveBeenCalledTimes(1);
  });

  it("throws when no agents are provided", async () => {
    await expect(
      SharedMemoryOrch.run("task", [])
    ).rejects.toThrow("SharedMemoryOrch requires at least one agent");
  });
});
