import { Agent, OrchestrationPattern } from "../types";
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
    // Fallback heuristic: lower cost preferred, otherwise neutral 0.5
    const cost = typeof agent.cost === "number" ? agent.cost : 1;
    return 1 / (1 + cost);
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const scored = await Promise.all(
      agents.map(async (a) => ({ agent: a, score: await this.score(a, task) }))
    );

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0]?.agent;
    if (!winner) return { id: this.id, result: null, reason: "no-agents" };

    const result = await winner.run(task, { mode: "negotiate", winner: winner.id, ranking: scored });
    return { id: this.id, winner: winner.id, ranking: scored, result };
  }
}

export default NegotiateOrch;

