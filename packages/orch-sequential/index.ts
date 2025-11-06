import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class SequentialOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new SequentialOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const history: HistoryEntry[] = [];
    let input = task;
    for (const agent of agents) {
      const entry: HistoryEntry = { agentId: agent.id, input, timestamp: Date.now() };
      try {
        const output = await agent.run(input, { mode: "sequential", step: history.length });
        entry.output = output;
        input = output;
      } catch (err) {
        entry.error = String(err);
      }
      history.push(entry);
    }
    return { id: this.id, strategy: "sequential", result: input, history };
  }
}

export default SequentialOrch;
