import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import { config } from "./config";

export class NegotiateOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new NegotiateOrch();
    return orch.run(task, agents);
  }

  private async score(agent: Agent, task: any): Promise<number> {
    try {
      const proposal = agent.propose ? await agent.propose(task) : null;
      if (proposal && typeof proposal.score === "number") return proposal.score;
    } catch {}
    const cost = typeof agent.cost === "number" ? agent.cost : 1;
    return 1 / (1 + cost);
  }

  async run(task: any, agents: Agent[]) {
    const scored = await Promise.all(agents.map(async (a) => ({ agent: a, score: await this.score(a, task) })));
    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0]?.agent;
    const history: HistoryEntry[] = [];
    if (winner) {
      const entry: HistoryEntry = { agentId: winner.id, input: task, timestamp: Date.now() };
      try {
        entry.output = await winner.run(task, { mode: "negotiate", ranking: scored });
      } catch (err) {
        entry.error = String(err);
      }
      history.push(entry);
    }
    return { id: this.id, strategy: "negotiate", winner: winner?.id, ranking: scored, history };
  }
}

export default NegotiateOrch;
