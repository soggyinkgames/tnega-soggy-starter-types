// orchestrations/hybridAdaptive/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { HybridAdaptiveOrch, runOrchFramework } from ".";
import type { Agent, RuntimeContext } from "../types";

describe("HybridAdaptiveOrch", () => {
  it("chooses concurrent mode when task.strategy is 'concurrent'", async () => {
    const task = { strategy: "concurrent", payload: "x" };

    const agentA: Agent = {
      id: "a",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-concurrent");
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        return `${input.payload}-A`;
      })
    } as any;

    const agentB: Agent = {
      id: "b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-concurrent");
        return `${input.payload}-B`;
      })
    } as any;

    const res = await HybridAdaptiveOrch.run(task, [agentA, agentB]);

    expect(res.id).toBe("orch-hybrid-adaptive");
    expect(res.strategy).toBe("hybrid-concurrent");
    expect(typeof res.duration).toBe("number");

    // Result: both agents, same input
    expect(res.result).toEqual([
      { agentId: "a", input: task, output: "x-A" },
      { agentId: "b", input: task, output: "x-B" }
    ]);

    // History entries with timestamps
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    expect(agentA.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({ mode: "hybrid-concurrent" })
    );
    expect(agentB.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({ mode: "hybrid-concurrent" })
    );
  });

  it("chooses sequential mode when task.strategy is 'sequential'", async () => {
    const task = { strategy: "sequential", value: 1 };

    const agentA: Agent = {
      id: "a",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-sequential");
        expect(ctx?.step).toBe(0);
        return input.value + 1;
      })
    } as any;

    const agentB: Agent = {
      id: "b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-sequential");
        expect(ctx?.step).toBe(1);
        return input + 2;
      })
    } as any;

    const res = await HybridAdaptiveOrch.run(task, [agentA, agentB]);

    expect(res.strategy).toBe("hybrid-sequential");
    expect(res.result).toBe(4); // ((1 + 1) + 2)

    // Steps show each agent's output
    expect(res.steps).toEqual([
      { agentId: "a", output: 2 },
      { agentId: "b", output: 4 }
    ]);

    expect(res.history?.length).toBe(2);
    expect(agentA.run).toHaveBeenCalledTimes(1);
    expect(agentB.run).toHaveBeenCalledTimes(1);
  });

  it("chooses negotiate mode when task.strategy is 'negotiate' and picks the highest scoring agent", async () => {
    const task = { strategy: "negotiate", topic: "choice" };

    const lowScorer: any = {
      id: "low",
      cost: 1,
      propose: vi.fn(async () => ({ score: 0.2 })),
      run: vi.fn(async () => "low-result")
    };

    const highScorer: any = {
      id: "high",
      cost: 0.1,
      propose: vi.fn(async () => ({ score: 0.9 })),
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-negotiate");
        expect(ctx?.winner).toBe("high");
        expect(Array.isArray(ctx?.ranking)).toBe(true);
        return "high-result";
      })
    };

    const res = await HybridAdaptiveOrch.run(task, [
      lowScorer as Agent,
      highScorer as Agent
    ]);

    expect(res.strategy).toBe("hybrid-negotiate");
    expect(res.winner).toBe("high");
    expect(res.result).toBe("high-result");

    // Ranking should contain both agents
    expect(res.ranking).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agentId: "low" }),
        expect.objectContaining({ agentId: "high" })
      ])
    );

    // History: only the winner's run is recorded
    const winnerHistory = res.history?.find(h => h.agentId === "high");
    expect(winnerHistory?.output).toBe("high-result");
  });

  it("defaults to hybrid-default sequential pipeline when no strategy is provided", async () => {
    const task = { value: 10 };

    const agentA: Agent = {
      id: "a",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-default");
        return input.value + 5;
      })
    } as any;

    const agentB: Agent = {
      id: "b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("hybrid-default");
        return input * 2;
      })
    } as any;

    const res = await HybridAdaptiveOrch.run(task, [agentA, agentB]);

    expect(res.strategy).toBe("hybrid-default");
    expect(res.result).toBe(30); // (10 + 5) * 2

    expect(res.history?.length).toBe(2);
    expect(agentA.run).toHaveBeenCalledTimes(1);
    expect(agentB.run).toHaveBeenCalledTimes(1);
  });

  it("executes tools through the injected runtime context", async () => {
    const runtimeContext: RuntimeContext = {
      executeTool: vi.fn(async (_toolId, input) => ({
        ...input,
        executedByRuntimeContext: true,
      })),
      requestCapability: async (request) => ({
        status: "unimplemented",
        request,
      }),
    };
    const agent: Agent = {
      id: "hybrid-tool-agent",
      run: vi.fn(async (_input: any, ctx?: any) => {
        return ctx.executeTool("search", { query: "runtime bridge" });
      }),
    } as any;

    const res = await HybridAdaptiveOrch.run("task", [agent], runtimeContext);

    expect(runtimeContext.executeTool).toHaveBeenCalledWith(
      "search",
      { query: "runtime bridge" },
      expect.objectContaining({
        agentId: "hybrid-tool-agent",
        orchestrationId: "orch-hybrid-adaptive",
        mode: "hybrid-default",
        history: [],
      }),
    );
    expect(res.result).toEqual({
      query: "runtime bridge",
      executedByRuntimeContext: true,
    });
  });

  it("throws when no agents are provided", async () => {
    await expect(
      HybridAdaptiveOrch.run("task", [])
    ).rejects.toThrow("HybridAdaptiveOrch requires at least one agent");
  });
});
