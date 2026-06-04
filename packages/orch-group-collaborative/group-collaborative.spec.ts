// orchestrations/groupCollaborative/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { GroupCollaborativeOrch, runOrchFramework } from ".";
import type { Agent, RuntimeContext } from "../types";

describe("GroupCollaborativeOrch", () => {
  it("runs agents in sequence sharing a collaborative context", async () => {
    const task = { topic: "together" };

    const sharedSeenByA: any[] = [];
    const sharedSeenByB: any[] = [];

    const agentA: Agent = {
      id: "agent-a",
      run: vi.fn(async (input: any, ctx?: any) => {
        // First agent: sees empty shared messages
        expect(input).toBe(task);
        expect(ctx?.mode).toBe("group-collaborative");
        expect(ctx?.turn).toBe(0);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        expect(ctx?.shared).toBeDefined();
        expect(Array.isArray(ctx?.shared.messages)).toBe(true);
        expect(ctx?.shared.messages.length).toBe(0);

        sharedSeenByA.push(ctx?.shared);
        return "A-output";
      })
    } as any;

    const agentB: Agent = {
      id: "agent-b",
      run: vi.fn(async (input: any, ctx?: any) => {
        // Second agent: sees A's output already in shared.messages
        expect(input).toBe(task);
        expect(ctx?.mode).toBe("group-collaborative");
        expect(ctx?.turn).toBe(1);
        expect(ctx?.shared.messages.length).toBe(1);
        expect(ctx?.shared.messages[0]).toEqual({
          agentId: "agent-a",
          output: "A-output"
        });

        sharedSeenByB.push(ctx?.shared);
        return "B-output";
      })
    } as any;

    const res = await GroupCollaborativeOrch.run(task, [agentA, agentB]);

    // Orchestration metadata
    expect(res.id).toBe("orch-group-collaborative");
    expect(res.strategy).toBe("group-collaborative");
    expect(typeof res.duration).toBe("number");

    // Result should be the shared messages in order
    expect(res.result).toEqual([
      { agentId: "agent-a", output: "A-output" },
      { agentId: "agent-b", output: "B-output" }
    ]);

    // History should have one entry per agent with timestamps
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    // Agents were called with the expected context
    expect(agentA.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({
        mode: "group-collaborative",
        turn: 0
      })
    );
    expect(agentB.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({
        mode: "group-collaborative",
        turn: 1
      })
    );

    // Both agents should see *the same* shared object reference
    expect(sharedSeenByA[0]).toBe(sharedSeenByB[0]);
  });

  it("captures errors per agent while still running others", async () => {
    const task = "collab-task";

    const failingAgent: Agent = {
      id: "fail",
      run: vi.fn(async () => {
        throw new Error("boom");
      })
    } as any;

    const okAgent: Agent = {
      id: "ok",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.shared.messages.length).toBe(0); // fail produced no output
        return `${input}-ok`;
      })
    } as any;

    const res = await GroupCollaborativeOrch.run(task, [failingAgent, okAgent]);

    // Result only includes successful contributions
    expect(res.result).toEqual([
      { agentId: "ok", output: "collab-task-ok" }
    ]);

    const failHistory = res.history?.find(h => h.agentId === "fail");
    const okHistory = res.history?.find(h => h.agentId === "ok");

    expect(failHistory?.error).toContain("boom");
    expect(okHistory?.output).toBe("collab-task-ok");

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
      id: "collab-tool-agent",
      run: vi.fn(async (_input: any, ctx?: any) => {
        return ctx.executeTool("summarize", { text: "runtime bridge" });
      }),
    } as any;

    const res = await GroupCollaborativeOrch.run("task", [agent], runtimeContext);

    expect(runtimeContext.executeTool).toHaveBeenCalledWith(
      "summarize",
      { text: "runtime bridge" },
      expect.objectContaining({
        agentId: "collab-tool-agent",
        orchestrationId: "orch-group-collaborative",
        mode: "group-collaborative",
        turn: 0,
        history: [],
      }),
    );
    expect(res.result).toEqual([
      {
        agentId: "collab-tool-agent",
        output: {
          text: "runtime bridge",
          executedByRuntimeContext: true,
        },
      },
    ]);
  });

  it("throws when no agents are provided", async () => {
    await expect(
      GroupCollaborativeOrch.run("task", [])
    ).rejects.toThrow("GroupCollaborativeOrch requires at least one agent");
  });
});
