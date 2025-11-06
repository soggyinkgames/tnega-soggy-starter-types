import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class SequentialOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new SequentialOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    let input = task;
    const steps: Array<{ agentId: string; output: any }> = [];
    for (const agent of agents) {
      input = await agent.run(input, { mode: "sequential", step: steps.length });
      steps.push({ agentId: agent.id, output: input });
    }
    return { id: this.id, steps, result: input };
  }
}

export default SequentialOrch;

