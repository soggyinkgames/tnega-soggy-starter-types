// orchestrations/sequential/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { SequentialOrch, runOrchFramework } from ".";
import type { Agent } from "../types";

describe("SequentialOrch", () => {
  it("runs agents in order, passing output of each as input to the next", async () => {
    const task = { value: 1 };

    const agentA: Agent = {
      id: "agent-a",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("sequential");
        expect(ctx?.step).toBe(0);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        return input.value + 1; // 2
      })
    } as any;

    const agentB: Agent = {
      id: "agent-b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("sequential");
        expect(ctx?.step).toBe(1);
        return input * 3; // 6
      })
    } as any;

    const res = await SequentialOrch.run(task, [agentA, agentB]);

    // Orchestration metadata
    expect(res.id).toBe("orch-sequential");
    expect(res.strategy).toBe("sequential");
    expect(typeof res.duration).toBe("number");

    // Final result
    expect(res.result).toBe(6);

    // Steps capture each agent's output
    expect(res.steps).toEqual([
      { agentId: "agent-a", output: 2 },
      { agentId: "agent-b", output: 6 }
    ]);

    // History has one entry per agent with timestamps
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    // Calls & inputs
    expect(agentA.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({ mode: "sequential", step: 0 })
    );
    expect(agentB.run).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ mode: "sequential", step: 1 })
    );
  });

  it("captures errors per agent while continuing the sequence", async () => {
    const task = 10;

    const failingAgent: Agent = {
      id: "fail",
      run: vi.fn(async () => {
        throw new Error("boom");
      })
    } as any;

    const okAgent: Agent = {
      id: "ok",
      run: vi.fn(async (input: any) => input + 5)
    } as any;

    const res = await SequentialOrch.run(task, [failingAgent, okAgent]);

    // Result comes from the last successful agent (okAgent)
    expect(res.result).toBe(15);

    const failHistory = res.history?.find(h => h.agentId === "fail");
    const okHistory = res.history?.find(h => h.agentId === "ok");

    expect(failHistory?.error).toContain("boom");
    expect(okHistory?.output).toBe(15);

    expect(failingAgent.run).toHaveBeenCalledTimes(1);
    expect(okAgent.run).toHaveBeenCalledTimes(1);
  });

  it("throws when no agents are provided", async () => {
    await expect(
      SequentialOrch.run("task", [])
    ).rejects.toThrow("SequentialOrch requires at least one agent");
  });
});
