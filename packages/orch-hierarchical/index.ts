import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class HierarchicalOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new HierarchicalOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const managers = agents.filter(a => (a.role || "").toLowerCase().includes("manager"));
    const workers = agents.filter(a => !managers.includes(a));

    const workerOutputs: Record<string, any> = {};
    for (const worker of workers) {
      workerOutputs[worker.id] = await worker.run(task, { mode: "hierarchical", level: "worker" });
    }

    const decisions: Record<string, any> = {};
    if (managers.length > 0) {
      for (const manager of managers) {
        decisions[manager.id] = await manager.run({ task, workerOutputs }, { mode: "hierarchical", level: "manager" });
      }
      return { id: this.id, workerOutputs, decisions };
    }

    // Fallback: sequential if no managers are provided
    let input: any = task;
    const steps: any[] = [];
    for (const agent of agents) {
      input = await agent.run(input, { mode: "hierarchical", level: "sequential-fallback" });
      steps.push({ agentId: agent.id, output: input });
    }
    return { id: this.id, steps, result: input };
  }
}

export default HierarchicalOrch;

