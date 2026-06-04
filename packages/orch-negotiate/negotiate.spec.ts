// orchestrations/negotiate/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { NegotiateOrch, runOrchFramework } from ".";
import type { Agent, RuntimeContext } from "../types";

describe("NegotiateOrch", () => {
  it("picks the highest scoring agent based on proposal score and cost", async () => {
    const task = { topic: "choice" };

    const low: any = {
      id: "low",
      cost: 1,
      propose: vi.fn(async () => ({ score: 0.3 })),
      run: vi.fn(async () => "low-result")
    };

    const high: any = {
      id: "high",
      cost: 0.1,
      propose: vi.fn(async () => ({ score: 0.9 })),
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(input).toBe(task);
        expect(ctx?.mode).toBe("negotiate");
        expect(ctx?.winner).toBe("high");
        expect(Array.isArray(ctx?.ranking)).toBe(true);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        return "high-result";
      })
    };

    const res = await NegotiateOrch.run(task, [low as Agent, high as Agent]);

    expect(res.id).toBe("orch-negotiate");
    expect(res.strategy).toBe("negotiate");
    expect(typeof res.duration).toBe("number");

    // Winner & result
    expect(res.winner).toBe("high");
    expect(res.result).toBe("high-result");

    // Ranking includes both agents with scores
    expect(res.ranking).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agentId: "low", score: expect.any(Number) }),
        expect.objectContaining({ agentId: "high", score: expect.any(Number) })
      ])
    );

    // History only records the winning run
    expect(res.history?.length).toBe(1);
    const winnerHistory = res.history?.[0];
    expect(winnerHistory?.agentId).toBe("high");
    expect(winnerHistory?.output).toBe("high-result");
  });

  it("falls back to cost-based scoring when propose is missing or fails", async () => {
    const task = "fallback";

    const cheapNoPropose: any = {
      id: "cheap",
      cost: 0.1,
      run: vi.fn(async () => "cheap-result")
    };

    const expensiveWithErrorPropose: any = {
      id: "expensive",
      cost: 10,
      propose: vi.fn(async () => {
        throw new Error("propose-fail");
      }),
      run: vi.fn(async () => "expensive-result")
    };

    const res = await NegotiateOrch.run(task, [
      cheapNoPropose as Agent,
      expensiveWithErrorPropose as Agent
    ]);

    expect(res.winner).toBe("cheap");
    expect(res.result).toBe("cheap-result");

    const cheapScore = res.ranking.find((r: any) => r.agentId === "cheap")?.score;
    const expensiveScore = res.ranking.find((r: any) => r.agentId === "expensive")?.score;

    expect(cheapScore).toBeGreaterThan(expensiveScore as number);
  });

  it("captures errors when the winning agent run fails", async () => {
    const task = "error-case";

    const high: any = {
      id: "high",
      cost: 0.1,
      propose: vi.fn(async () => ({ score: 0.9 })),
      run: vi.fn(async () => {
        throw new Error("run-fail");
      })
    };

    const res = await NegotiateOrch.run(task, [high as Agent]);

    expect(res.winner).toBe("high");
    expect(res.result).toBeNull(); // or undefined if you prefer; adjust impl accordingly
    expect(res.history?.length).toBe(1);

    const h = res.history?.[0];
    expect(h?.agentId).toBe("high");
    expect(h?.error).toContain("run-fail");
  });

  it("executes winner tools through the injected runtime context", async () => {
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
    const agent: any = {
      id: "winner-tool-agent",
      cost: 0.1,
      propose: vi.fn(async () => ({ score: 0.9 })),
      run: vi.fn(async (_input: any, ctx?: any) => {
        return ctx.executeTool("search", { query: "runtime bridge" });
      }),
    };

    const res = await NegotiateOrch.run("task", [agent as Agent], runtimeContext);

    expect(runtimeContext.executeTool).toHaveBeenCalledWith(
      "search",
      { query: "runtime bridge" },
      expect.objectContaining({
        agentId: "winner-tool-agent",
        orchestrationId: "orch-negotiate",
        mode: "negotiate",
        ranking: expect.any(Array),
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
      NegotiateOrch.run("task", [])
    ).rejects.toThrow("NegotiateOrch requires at least one agent");
  });
});
