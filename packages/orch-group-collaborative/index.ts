import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class GroupCollaborativeOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new GroupCollaborativeOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const transcript: string[] = [];
    let summary = typeof task?.prompt === "string" ? task.prompt : JSON.stringify(task);

    for (let round = 0; round < 3; round++) {
      for (const agent of agents) {
        let reply: string;
        if (agent.respond) {
          reply = await agent.respond(summary, { mode: "group-collaborative", round });
        } else {
          const out = await agent.run({ message: summary }, { mode: "group-collaborative", round });
          reply = typeof out === "string" ? out : JSON.stringify(out);
        }
        transcript.push(`${agent.name}: ${reply}`);
        summary = `Round ${round + 1} update -> ${reply}`;
      }
    }

    const consensus = summary;
    return { id: this.id, transcript, consensus };
  }
}

export default GroupCollaborativeOrch;

