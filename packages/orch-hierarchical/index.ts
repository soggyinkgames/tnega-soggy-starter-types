// orchestrations/hierarchical/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class HierarchicalOrch implements OrchestrationPattern {
  id = config.id;
  name = "Hierarchical Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new HierarchicalOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("HierarchicalOrch requires at least one agent");
    }

    const start = Date.now();
    const history: HistoryEntry[] = [];

    const isManager = (agent: Agent) =>
      typeof (agent as any).role === "string" &&
      (agent as any).role.toLowerCase().includes("manager");

    const managers = agents.filter(isManager);
    const workers = agents.filter(a => !isManager(a));

    const workerOutputs: Record<string, any> = {};
    const managerDecisions: Record<string, any> = {};

    // 1) Worker layer: specialists do their thing first
    for (const worker of workers) {
      const entry: HistoryEntry = {
        agentId: worker.id,
        input: task,
        timestamp: Date.now()
      };

      try {
        const output = await worker.run(task, {
          mode: "hierarchical",
          level: "worker",
          runOrchFramework,
          history,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Hierarchical tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: worker.id,
              orchestrationId: this.id,
              mode: "hierarchical",
              level: "worker",
              history,
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });
        workerOutputs[worker.id] = output;
        entry.output = output;
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    // 2) Manager layer: supervisors see task + all workerOutputs
    if (managers.length > 0) {
      for (const manager of managers) {
        const managerInput = { task, workerOutputs };

        const entry: HistoryEntry = {
          agentId: manager.id,
          input: managerInput,
          timestamp: Date.now()
        };

        try {
          const decision = await manager.run(managerInput, {
            mode: "hierarchical",
            level: "manager",
            runOrchFramework,
            history,
            executeTool: (toolId: string, input: Record<string, unknown>) => {
              if (!runtimeContext?.executeTool) {
                throw new Error("Hierarchical tooling requires runtimeContext.executeTool().");
              }

              return runtimeContext.executeTool(toolId, input, {
                agentId: manager.id,
                orchestrationId: this.id,
                mode: "hierarchical",
                level: "manager",
                history,
              });
            },
            requestCapability: runtimeContext?.requestCapability,
          });
          managerDecisions[manager.id] = decision;
          entry.output = decision;
        } catch (err) {
          entry.error = String(err);
        }

        history.push(entry);
      }

      return {
        id: this.id,
        strategy: "hierarchical",
        duration: Date.now() - start,
        workerOutputs,
        managerDecisions,
        history
      };
    }

    // 3) Fallback: no managers – just worker layer results
    return {
      id: this.id,
      strategy: "hierarchical-fallback",
      duration: Date.now() - start,
      workerOutputs,
      history
    };
  }
}

export default HierarchicalOrch;
export { runOrchFramework };
