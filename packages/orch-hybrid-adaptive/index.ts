import { Agent, OrchestrationPattern } from "../types";
import { config } from "./config";

export class HybridAdaptiveOrch implements OrchestrationPattern {
  id = config.id;
  name = config.name;
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new HybridAdaptiveOrch();
    return orch.run(task, agents);
  }

  private async runConcurrent(task: any, agents: Agent[]) {
    return Promise.all(agents.map(async (a) => ({ agentId: a.id, output: await a.run(task, { mode: "hybrid-concurrent" }) })));
  }

  private async runSequential(task: any, agents: Agent[]) {
    let input = task;
    const steps: any[] = [];
    for (const a of agents) {
      input = await a.run(input, { mode: "hybrid-sequential", step: steps.length });
      steps.push({ agentId: a.id, output: input });
    }
    return { steps, result: input };
  }

  private async runNegotiate(task: any, agents: Agent[]) {
    const scored = await Promise.all(
      agents.map(async (a) => {
        let score = 0.5;
        try {
          const p = a.propose ? await a.propose(task) : null;
          if (p && typeof p.score === "number") score = p.score;
        } catch {}
        const adjust = typeof a.cost === "number" ? 1 / (1 + a.cost) : 0.5;
        return { agent: a, score: (score + adjust) / 2 };
      })
    );
    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0]?.agent;
    const result = winner ? await winner.run(task, { mode: "hybrid-negotiate", winner: winner.id, ranking: scored }) : null;
    return { winner: winner?.id, ranking: scored, result };
  }

  async run(task: any, agents: Agent[]): Promise<any> {
    const pref = (task?.strategy || task?.mode || "").toString().toLowerCase();

    if (pref === "concurrent" || agents.length >= 3) {
      const results = await this.runConcurrent(task, agents);
      return { id: this.id, strategy: "concurrent", results };
    }
    if (pref === "negotiate") {
      const outcome = await this.runNegotiate(task, agents);
      return { id: this.id, strategy: "negotiate", ...outcome };
    }
    if (pref === "sequential") {
      const outcome = await this.runSequential(task, agents);
      return { id: this.id, strategy: "sequential", ...outcome };
    }

    // Default: centralised-like sequential with history
    let input = task;
    const history: Array<{ agentId: string; output: any }> = [];
    for (const a of agents) {
      input = await a.run(input, { mode: "hybrid-default" });
      history.push({ agentId: a.id, output: input });
    }
    return { id: this.id, strategy: "centralised-default", result: input, history };
  }
}

export default HybridAdaptiveOrch;

