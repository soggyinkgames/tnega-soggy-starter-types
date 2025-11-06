import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class HierarchicalOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new HierarchicalOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const managers = agents.filter(a => (a.role || "").toLowerCase().includes("manager"));
    const workers = agents.filter(a => !managers.includes(a));
    const history: HistoryEntry[] = [];
    const workerOutputs: Record<string, any> = {};
    for (const worker of workers) {
      const entry: HistoryEntry = { agentId: worker.id, input: task, timestamp: Date.now() };
      try {
        const output = await worker.run(task, { mode: "hierarchical", level: "worker" });
        workerOutputs[worker.id] = output;
        entry.output = output;
      } catch (err) {
        entry.error = String(err);
      }
      history.push(entry);
    }
    const decisions: Record<string, any> = {};
    if (managers.length > 0) {
      for (const manager of managers) {
        const entry: HistoryEntry = { agentId: manager.id, input: { task, workerOutputs }, timestamp: Date.now() };
        try {
          entry.output = await manager.run({ task, workerOutputs }, { mode: "hierarchical", level: "manager" });
          decisions[manager.id] = entry.output;
        } catch (err) {
          entry.error = String(err);
        }
        history.push(entry);
      }
      return { id: this.id, strategy: "hierarchical", workerOutputs, decisions, history };
    }
    return { id: this.id, strategy: "hierarchical-fallback", workerOutputs, history };
  }
}

export default HierarchicalOrch;
