import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class ConcurrentOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new ConcurrentOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const start = Date.now();
    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        const entry: HistoryEntry = { agentId: agent.id, input: task, timestamp: Date.now() };
        try {
          const output = await agent.run(task, { mode: "concurrent" });
          entry.output = output;
        } catch (err) {
          entry.error = String(err);
        }
        return entry;
      })
    );
    const history = results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) }));
    return { id: this.id, strategy: "concurrent", duration: Date.now() - start, history };
  }
}

export default ConcurrentOrch;
