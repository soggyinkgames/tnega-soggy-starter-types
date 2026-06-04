import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class CentralisedOrch implements OrchestrationPattern {
  id = config.id;
  name = "Centralised Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new CentralisedOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("CentralisedOrch requires at least one agent");
    }

    const history: HistoryEntry[] = [];

    // First agent = controller / gatekeeper
    const controller = agents[0];
    const workers = agents.slice(1);

    // Helper for controller to call worker agents
    const runSubTask = async (subTask: any, targetAgentId?: string) => {
      const target: Agent | undefined =
        targetAgentId
          ? workers.find(a => a.id === targetAgentId) ??
            agents.find(a => a.id === targetAgentId)
          : workers[0];

      if (!target) {
        throw new Error("No worker agent available for sub-task");
      }

      const entry: HistoryEntry = {
        agentId: target.id,
        input: subTask,
        timestamp: Date.now()
      };

      try {
        const output = await target.run(subTask, {
          mode: "centralised-worker",
          history,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Centralised tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: target.id,
              orchestrationId: this.id,
              mode: "centralised-worker",
              history,
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });
        entry.output = output;
        history.push(entry);
        return output;
      } catch (err) {
        entry.error = String(err);
        history.push(entry);
        throw err;
      }
    };

    // Controller run
    const controllerEntry: HistoryEntry = {
      agentId: controller.id,
      input: task,
      timestamp: Date.now()
    };

    try {
      const result = await controller.run(task, {
        mode: "centralised",
        history,
        workers,
        agents,
        runSubTask,
        executeTool: (toolId: string, input: Record<string, unknown>) => {
          if (!runtimeContext?.executeTool) {
            throw new Error("Centralised tooling requires runtimeContext.executeTool().");
          }

          return runtimeContext.executeTool(toolId, input, {
            agentId: controller.id,
            orchestrationId: this.id,
            mode: "centralised",
            history,
          });
        },
        requestCapability: runtimeContext?.requestCapability,
        runOrchFramework // available if the controller wants to kick off sub-orchestrations
      });

      controllerEntry.output = result;
      history.push(controllerEntry);

      return {
        id: this.id,
        strategy: "centralised",
        result,
        history
      };
    } catch (err) {
      controllerEntry.error = String(err);
      history.push(controllerEntry);

      return {
        id: this.id,
        strategy: "centralised",
        result: null,
        history
      };
    }
  }
}

export default CentralisedOrch;
export { runOrchFramework };
