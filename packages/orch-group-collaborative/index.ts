// orchestrations/groupCollaborative/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class GroupCollaborativeOrch implements OrchestrationPattern {
  id = config.id;
  name = "Group Collaborative Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new GroupCollaborativeOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("GroupCollaborativeOrch requires at least one agent");
    }

    const history: HistoryEntry[] = [];
    const start = Date.now();

    // Shared state for all agents – grows as each agent contributes
    const shared = {
      messages: [] as { agentId: string; output: any }[]
    };

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      const entry: HistoryEntry = {
        agentId: agent.id,
        input: task,
        timestamp: Date.now()
      };

      try {
        const output = await agent.run(task, {
          mode: "group-collaborative",
          turn: i,
          shared,
          runOrchFramework,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Group collaborative tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: agent.id,
              orchestrationId: this.id,
              mode: "group-collaborative",
              turn: i,
              history,
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });

        entry.output = output;
        shared.messages.push({ agentId: agent.id, output });
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return {
      id: this.id,
      strategy: "group-collaborative",
      duration: Date.now() - start,
      result: shared.messages,
      history
    };
  }
}

export default GroupCollaborativeOrch;
export { runOrchFramework };
