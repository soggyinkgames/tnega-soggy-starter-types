// orchestrations/sharedMemory/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class SharedMemoryOrch implements OrchestrationPattern {
  id = config.id;
  name = "Shared Memory Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new SharedMemoryOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("SharedMemoryOrch requires at least one agent");
    }

    const start = Date.now();
    const history: HistoryEntry[] = [];

    // Shared state all agents can read/write
    const blackboard: Record<string, any> = { task };

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      // Snapshot of blackboard at the time of call for history
      const entry: HistoryEntry = {
        agentId: agent.id,
        input: { ...blackboard },
        timestamp: Date.now()
      };

      try {
        // Agents get the live blackboard object to mutate
        const diff = await agent.run(blackboard, {
          mode: "shared-memory",
          index: i,
          runOrchFramework,
          history,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Shared memory tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: agent.id,
              orchestrationId: this.id,
              mode: "shared-memory",
              index: i,
              history: [...history],
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });

        entry.output = diff;

        // Convention: store each agent’s contribution under its id
        blackboard[agent.id] = diff;
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return {
      id: this.id,
      strategy: "shared-memory",
      duration: Date.now() - start,
      blackboard,
      history
    };
  }
}

export default SharedMemoryOrch;
export { runOrchFramework };
