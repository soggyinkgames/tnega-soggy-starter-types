import { describe, it, expect, vi } from "vitest";
import { CentralisedOrch } from ".";
import type { Agent, RuntimeContext } from "../types";

describe("CentralisedOrch", () => {
  it("creates a new agent via controller + worker delegation", async () => {
    const controllerRun = vi.fn(async (task: any, ctx?: any) => {
      const newAgent = await ctx?.runSubTask(task, "new-agent-worker");
      return { createdAgent: newAgent };
    });

    const workerRun = vi.fn(async (subTask: any, ctx?: any) => {
      expect(ctx?.mode).toBe("centralised-worker");
      expect(Array.isArray(ctx?.history)).toBe(true);
      return {
        id: subTask.name,
        default_orch: "orch-centralised",
        goals: subTask.goals,
        framework: subTask.framework,
      };
    });

    const controller: Agent = { id: "controller", run: controllerRun } as any;
    const worker: Agent = { id: "new-agent-worker", run: workerRun } as any;
    const task = { name: "fresh-agent", goals: ["assist users"], framework: "langchain" };

    const res = await CentralisedOrch.run(task, [controller, worker]);

    expect(res.id).toBe("orch-centralised");
    expect(res.strategy).toBe("centralised");
    expect(res.result?.createdAgent?.id).toBe("fresh-agent");
    expect(res.result?.createdAgent?.framework).toBe("langchain");
    expect(res.history?.length).toBe(2);
    const [workerHistory, controllerHistory] = res.history ?? [];
    expect(workerHistory.agentId).toBe("new-agent-worker");
    expect(workerHistory.input).toEqual(task);
    expect(workerHistory.output?.id).toBe("fresh-agent");
    expect(typeof workerHistory.timestamp).toBe("number");
    expect(controllerHistory.agentId).toBe("controller");
    expect(controllerHistory.output?.createdAgent?.id).toBe("fresh-agent");
    expect(controllerRun).toHaveBeenCalledTimes(1);
    const controllerCtx = controllerRun.mock.calls[0][1];
    expect(controllerCtx.workers?.[0].id).toBe("new-agent-worker");
    expect(typeof controllerCtx.runSubTask).toBe("function");
  });

  it("records errors but continues remaining agents", async () => {
    const controller: Agent = {
      id: "controller",
      run: vi.fn(async (_task: any, ctx?: any) => {
        const outputs: any[] = [];
        try {
          const first = await ctx?.runSubTask({ step: 1 }, "worker-error");
          outputs.push(first);
        } catch (err) {
          outputs.push({ failed: String(err) });
        }
        const second = await ctx?.runSubTask({ step: 2 }, "worker-ok");
        outputs.push(second);
        return outputs;
      }),
    } as any;

    const errorWorker: Agent = {
      id: "worker-error",
      run: vi.fn(async () => {
        throw new Error("boom");
      }),
    } as any;

    const okWorker: Agent = {
      id: "worker-ok",
      run: vi.fn(async (task: any) => ({ done: task.step })),
    } as any;

    const res = await CentralisedOrch.run("task", [controller, errorWorker, okWorker]);

    expect(res.history?.length).toBe(3);
    const [errHistory, okHistory, controllerHistory] = res.history ?? [];
    expect(errHistory.agentId).toBe("worker-error");
    expect(errHistory.error).toContain("boom");
    expect(okHistory.agentId).toBe("worker-ok");
    expect(okHistory.output).toEqual({ done: 2 });
    expect(controllerHistory.agentId).toBe("controller");
    expect(controllerHistory.output?.length).toBe(2);
    expect(controllerHistory.output?.[0]).toEqual({ failed: "Error: boom" });
    expect(controllerHistory.output?.[1]).toEqual({ done: 2 });
    expect(controller.run).toHaveBeenCalledTimes(1);
    expect(errorWorker.run).toHaveBeenCalledTimes(1);
    expect(okWorker.run).toHaveBeenCalledTimes(1);
  });

  it("executes controller tools through the injected runtime context", async () => {
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
    const controller: Agent = {
      id: "controller",
      run: vi.fn(async (_task: any, ctx?: any) => {
        return ctx.executeTool("query_knowledge_base", { query: "runtime bridge" });
      }),
    } as any;

    const res = await CentralisedOrch.run("task", [controller], runtimeContext);

    expect(runtimeContext.executeTool).toHaveBeenCalledWith(
      "query_knowledge_base",
      { query: "runtime bridge" },
      expect.objectContaining({
        agentId: "controller",
        orchestrationId: "orch-centralised",
        mode: "centralised",
        history: [],
      }),
    );
    expect(res.result).toEqual({
      query: "runtime bridge",
      executedByRuntimeContext: true,
    });
  });

  it("delegates to framework loader in runOrchFramework", async () => {
    vi.resetModules();
    const initMock = vi.fn(async () => {});
    const runMock = vi.fn(async () => "framework-result");
    const loadFrameworkMock = vi.fn(async () => ({ init: initMock, run: runMock }));

    vi.doMock("../../tools/frameworks/index", () => ({ loadFramework: loadFrameworkMock }));

    const { runOrchFramework } = await import("./index.js");
    const cfg = { default_framework: "langchain" };
    const result = await runOrchFramework("query", cfg);

    expect(loadFrameworkMock).toHaveBeenCalledWith("langchain");
    expect(initMock).toHaveBeenCalledWith(cfg);
    expect(runMock).toHaveBeenCalledWith("query", cfg);
    expect(result).toBe("framework-result");

    vi.resetModules();
    vi.doUnmock("../../tools/frameworks/index");
  });
});
