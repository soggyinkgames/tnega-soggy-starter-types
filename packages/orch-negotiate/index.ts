// orchestrations/negotiate/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class NegotiateOrch implements OrchestrationPattern {
  id = config.id;
  name = "Negotiation Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new NegotiateOrch();
    return orch.run(task, agents, runtimeContext);
  }

  private async score(agent: Agent, task: any): Promise<number> {
    let baseScore = 0.5;

    try {
      const proposal = (agent as any).propose
        ? await (agent as any).propose(task)
        : null;

      if (proposal && typeof proposal.score === "number") {
        baseScore = proposal.score;
      }
    } catch {
      // ignore propose errors, fall back to cost-based scoring
    }

    const cost =
      typeof (agent as any).cost === "number"
        ? (agent as any).cost
        : 1;

    const costAdj = 1 / (1 + cost);

    // Simple blend: proposal score + cost adjustment
    return (baseScore + costAdj) / 2;
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("NegotiateOrch requires at least one agent");
    }

    const start = Date.now();

    // Compute scores for each agent
    const scored = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        score: await this.score(agent, task)
      }))
    );

    // Highest score wins
    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0]?.agent ?? null;

    const ranking = scored.map((s) => ({
      agentId: s.agent.id,
      score: s.score
    }));

    const history: HistoryEntry[] = [];
    let result: any = null;

    if (winner) {
      const entry: HistoryEntry = {
        agentId: winner.id,
        input: task,
        timestamp: Date.now()
      };

      try {
        result = await winner.run(task, {
          mode: "negotiate",
          winner: winner.id,
          ranking,
          runOrchFramework,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Negotiate tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: winner.id,
              orchestrationId: this.id,
              mode: "negotiate",
              ranking,
              history: [...history],
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });
        entry.output = result;
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return {
      id: this.id,
      strategy: "negotiate",
      duration: Date.now() - start,
      winner: winner?.id,
      ranking,
      result,
      history
    };
  }
}

export default NegotiateOrch;
export { runOrchFramework };
