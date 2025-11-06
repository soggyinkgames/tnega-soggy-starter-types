import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class CentralisedOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new CentralisedOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const history: HistoryEntry[] = [];
    let last = task;
    for (const agent of agents) {
      const entry: HistoryEntry = { agentId: agent.id, input: last, timestamp: Date.now() };
      try {
        const output = await agent.run(last, { mode: "centralised", history });
        entry.output = output;
        last = output;
      } catch (err) {
        entry.error = String(err);
      }
      history.push(entry);
    }
    return { id: this.id, strategy: "centralised", result: last, history };
  }
}

export default CentralisedOrch;
