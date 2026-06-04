import { describe, it, expect, vi } from "vitest";
import { ConcurrentOrch, runOrchFramework } from ".";
import type { Agent, RuntimeContext } from "../types";

describe("ConcurrentOrch", () => {
  it("runs all agents concurrently with per-index inputs and context", async () => {
    // Given: one task per agent (multi-variant case)
    const tasks = [{ goal: "g1" }, { goal: "g2" }];

    const agentA: Agent = {
      id: "agent-a",
      run: vi.fn(async (input: any, ctx?: any) => {
        // Context should be populated correctly
        expect(ctx?.mode).toBe("concurrent");
        expect(ctx?.index).toBe(0);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);

        // Return a value derived from the input so we can assert mapping
        return `${input.goal}-A`;
      })
    } as any;

    const agentB: Agent = {
      id: "agent-b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("concurrent");
        expect(ctx?.index).toBe(1);
        return `${input.goal}-B`;
      })
    } as any;

    // When: running the concurrent orchestration
    const res = await ConcurrentOrch.run(tasks, [agentA, agentB]);

    // Then: orchestration metadata is correct
    expect(res.id).toBe("orch-concurrent");
    expect(res.strategy).toBe("concurrent");
    expect(typeof res.duration).toBe("number");

    // And: result preserves per-agent input/output mapping
    expect(res.result).toEqual([
      { agentId: "agent-a", input: tasks[0], output: "g1-A" },
      { agentId: "agent-b", input: tasks[1], output: "g2-B" }
    ]);

    // And: history entries are recorded with timestamps
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    // And: agents were called with the expected inputs and context
    expect(agentA.run).toHaveBeenCalledWith(
      tasks[0],
      expect.objectContaining({ mode: "concurrent", index: 0 })
    );
    expect(agentB.run).toHaveBeenCalledWith(
      tasks[1],
      expect.objectContaining({ mode: "concurrent", index: 1 })
    );
  });

  it("captures errors per agent while still running other agents", async () => {
    // Given: one failing agent and one successful agent
    const failingAgent: Agent = {
      id: "fail",
      run: vi.fn(async () => {
        throw new Error("boom");
      })
    } as any;

    const okAgent: Agent = {
      id: "ok",
      run: vi.fn(async (input: any) => `${input}-ok`)
    } as any;

    // When: running with a shared task for all agents
    const res = await ConcurrentOrch.run("task", [failingAgent, okAgent]);

    // Then: result only includes successful agent outputs
    expect(res.result).toEqual([
      { agentId: "ok", input: "task", output: "task-ok" }
    ]);

    // And: history includes both success and failure, with error captured
    const failHistory = res.history?.find(h => h.agentId === "fail");
    const okHistory = res.history?.find(h => h.agentId === "ok");

    expect(failHistory?.error).toContain("boom");
    expect(okHistory?.output).toBe("task-ok");

    // And: both agents were invoked exactly once
    expect(failingAgent.run).toHaveBeenCalledTimes(1);
    expect(okAgent.run).toHaveBeenCalledTimes(1);
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
      id: "tool-agent",
      run: vi.fn(async (_input: any, ctx?: any) => {
        return ctx.executeTool("search", { query: "runtime bridge" });
      }),
    } as any;

    const res = await ConcurrentOrch.run("task", [agent], runtimeContext);

    expect(runtimeContext.executeTool).toHaveBeenCalledWith(
      "search",
      { query: "runtime bridge" },
      expect.objectContaining({
        agentId: "tool-agent",
        orchestrationId: "orch-concurrent",
        mode: "concurrent",
        index: 0,
      }),
    );
    expect(res.result).toEqual([
      {
        agentId: "tool-agent",
        input: "task",
        output: {
          query: "runtime bridge",
          executedByRuntimeContext: true,
        },
      },
    ]);
  });

  it("throws when no agents are provided", async () => {
    await expect(
      ConcurrentOrch.run("task", [])
    ).rejects.toThrow("ConcurrentOrch requires at least one agent");
  });
});
