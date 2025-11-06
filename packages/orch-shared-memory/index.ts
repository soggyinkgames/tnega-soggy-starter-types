import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class SharedMemoryOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new SharedMemoryOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const blackboard: Record<string, any> = { task };
    const history: HistoryEntry[] = [];
    for (const agent of agents) {
      const entry: HistoryEntry = { agentId: agent.id, input: { ...blackboard }, timestamp: Date.now() };
      try {
        const diff = await agent.run(blackboard, { mode: "shared-memory" });
        entry.output = diff;
        blackboard[agent.id] = diff;
      } catch (err) {
        entry.error = String(err);
      }
      history.push(entry);
    }
    return { id: this.id, strategy: "shared-memory", blackboard, history };
  }
}

export default SharedMemoryOrch;
