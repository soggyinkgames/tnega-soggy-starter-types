import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

type HistoryEntry = { agentId: string; output: any };

export class CentralisedOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new CentralisedOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const history: HistoryEntry[] = [];
    let last: any = task;
    for (const agent of agents) {
      const output = await agent.run(last, { mode: "centralised", history: [...history] });
      history.push({ agentId: agent.id, output });
      last = output;
    }
    return { id: this.id, result: last, history };
  }
}

export default CentralisedOrch;

