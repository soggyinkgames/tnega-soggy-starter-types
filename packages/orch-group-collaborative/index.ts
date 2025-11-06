import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class GroupCollaborativeOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new GroupCollaborativeOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
    const transcript: string[] = [];
    const history: HistoryEntry[] = [];
    let summary = typeof task?.prompt === "string" ? task.prompt : JSON.stringify(task);
    for (let round = 0; round < 3; round++) {
      for (const agent of agents) {
        const entry: HistoryEntry = { agentId: agent.id, input: summary, timestamp: Date.now() };
        try {
          const reply = agent.respond
            ? await agent.respond(summary, { mode: "group-collaborative", round })
            : await agent.run({ message: summary }, { mode: "group-collaborative", round });
          entry.output = reply;
          transcript.push(`${agent.name || agent.id}: ${String(reply)}`);
          summary = `Round ${round + 1} update -> ${String(reply)}`;
        } catch (err) {
          entry.error = String(err);
        }
        history.push(entry);
      }
    }
    return { id: this.id, strategy: "group-collaborative", transcript, consensus: summary, history };
  }
}

export default GroupCollaborativeOrch;
