import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class ConcurrentOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new ConcurrentOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const results = await Promise.all(
      agents.map(async (agent) => ({ agentId: agent.id, output: await agent.run(task, { mode: "concurrent" }) }))
    );
    return { id: this.id, results };
  }
}

export default ConcurrentOrch;

