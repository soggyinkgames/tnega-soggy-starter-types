// orchestrations/hierarchical/index.test.ts
import { describe, it, expect, vi } from "vitest";
import { HierarchicalOrch, runOrchFramework } from ".";
import type { Agent } from "../types";

describe("HierarchicalOrch", () => {
  it("runs workers first, then managers with access to workerOutputs", async () => {
    const task = { topic: "hier-test" };

    const worker: Agent = {
      id: "worker-1",
      run: vi.fn(async (input: any, ctx?: any) => {
        // Worker context
        expect(input).toBe(task);
        expect(ctx?.mode).toBe("hierarchical");
        expect(ctx?.level).toBe("worker");
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        return "worker-output";
      })
    } as any;

    const manager: Agent = {
      id: "manager-1",
      role: "Manager",
      run: vi.fn(async (input: any, ctx?: any) => {
        // Manager context
        expect(ctx?.mode).toBe("hierarchical");
        expect(ctx?.level).toBe("manager");
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);

        // Manager should see all worker outputs
        expect(input.task).toBe(task);
        expect(input.workerOutputs).toEqual({ "worker-1": "worker-output" });

        return "manager-decision";
      })
    } as any;

    const res = await HierarchicalOrch.run(task, [worker, manager]);

    // Orchestration metadata
    expect(res.id).toBe("orch-hierarchical");
    expect(res.strategy).toBe("hierarchical");
    expect(typeof res.duration).toBe("number");

    // Worker and manager results
    expect(res.workerOutputs).toEqual({ "worker-1": "worker-output" });
    expect(res.managerDecisions).toEqual({ "manager-1": "manager-decision" });

    // History has both entries with timestamps
    expect(res.history?.length).toBe(2);
    expect(res.history?.every(h => typeof h.timestamp === "number")).toBe(true);

    // Agents were called with expected context
    expect(worker.run).toHaveBeenCalledWith(
      task,
      expect.objectContaining({ mode: "hierarchical", level: "worker" })
    );
    expect(manager.run).toHaveBeenCalledWith(
      { task, workerOutputs: { "worker-1": "worker-output" } },
      expect.objectContaining({ mode: "hierarchical", level: "manager" })
    );
  });

  it("captures errors from workers and managers independently", async () => {
    const task = "hier-error-case";

    const failingWorker: Agent = {
      id: "fail-worker",
      run: vi.fn(async () => {
        throw new Error("worker-boom");
      })
    } as any;

    const okWorker: Agent = {
      id: "ok-worker",
      run: vi.fn(async () => "ok-worker-output")
    } as any;

    const failingManager: Agent = {
      id: "fail-manager",
      role: "manager",
      run: vi.fn(async () => {
        throw new Error("manager-boom");
      })
    } as any;

    const okManager: Agent = {
      id: "ok-manager",
      role: "manager",
      run: vi.fn(async (input: any) => {
        // Should see only successful worker outputs
        expect(input.workerOutputs).toEqual({ "ok-worker": "ok-worker-output" });
        return "ok-manager-decision";
      })
    } as any;

    const res = await HierarchicalOrch.run(task, [
      failingWorker,
      okWorker,
      failingManager,
      okManager
    ]);

    // Only successful worker output should be present
    expect(res.workerOutputs).toEqual({ "ok-worker": "ok-worker-output" });

    // Only successful manager decision should be present
    expect(res.managerDecisions).toEqual({ "ok-manager": "ok-manager-decision" });

    const failWorkerHistory = res.history?.find(h => h.agentId === "fail-worker");
    const okWorkerHistory = res.history?.find(h => h.agentId === "ok-worker");
    const failManagerHistory = res.history?.find(h => h.agentId === "fail-manager");
    const okManagerHistory = res.history?.find(h => h.agentId === "ok-manager");

    expect(failWorkerHistory?.error).toContain("worker-boom");
    expect(okWorkerHistory?.output).toBe("ok-worker-output");
    expect(failManagerHistory?.error).toContain("manager-boom");
    expect(okManagerHistory?.output).toBe("ok-manager-decision");

    expect(failingWorker.run).toHaveBeenCalledTimes(1);
    expect(okWorker.run).toHaveBeenCalledTimes(1);
    expect(failingManager.run).toHaveBeenCalledTimes(1);
    expect(okManager.run).toHaveBeenCalledTimes(1);
  });

  it("returns fallback strategy when no managers are present", async () => {
    const task = "no-managers";

    const worker: Agent = {
      id: "worker-only",
      run: vi.fn(async () => "only-worker-output")
    } as any;

    const res = await HierarchicalOrch.run(task, [worker]);

    expect(res.strategy).toBe("hierarchical-fallback");
    expect(res.workerOutputs).toEqual({ "worker-only": "only-worker-output" });
    expect(res).not.toHaveProperty("managerDecisions");
  });

  it("throws when no agents are provided", async () => {
    await expect(
      HierarchicalOrch.run("task", [])
    ).rejects.toThrow("HierarchicalOrch requires at least one agent");
  });
});
