import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class SharedMemoryOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new SharedMemoryOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const blackboard: Record<string, any> = { task };
    const contributions: Array<{ agentId: string; diff: any }> = [];

    for (const agent of agents) {
      const diff = await agent.run(blackboard, { mode: "shared-memory" });
      contributions.push({ agentId: agent.id, diff });
      blackboard[agent.id] = diff;
    }

    return { id: this.id, blackboard, contributions };
  }
}

export default SharedMemoryOrch;

