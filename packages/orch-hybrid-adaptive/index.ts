// orchestrations/hybridAdaptive/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class HybridAdaptiveOrch implements OrchestrationPattern {
  id = config.id;
  name = "Hybrid Adaptive Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new HybridAdaptiveOrch();
    return orch.run(task, agents, runtimeContext);
  }

  private async runConcurrent(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const history: HistoryEntry[] = [];

    await Promise.all(
      agents.map(async (agent) => {
        const entry: HistoryEntry = {
          agentId: agent.id,
          input: task,
          timestamp: Date.now()
        };

        try {
          const output = await agent.run(task, {
            mode: "hybrid-concurrent",
            runOrchFramework,
            executeTool: (toolId: string, input: Record<string, unknown>) => {
              if (!runtimeContext?.executeTool) {
                throw new Error("Hybrid adaptive tooling requires runtimeContext.executeTool().");
              }

              return runtimeContext.executeTool(toolId, input, {
                agentId: agent.id,
                orchestrationId: this.id,
                mode: "hybrid-concurrent",
                history: [...history],
              });
            },
            requestCapability: runtimeContext?.requestCapability,
          });
          entry.output = output;
        } catch (err) {
          entry.error = String(err);
        }

        history.push(entry);
      })
    );

    const result = history
      .filter((h) => typeof (h as any).output !== "undefined")
      .map((h) => ({
        agentId: h.agentId,
        input: h.input,
        output: (h as any).output
      }));

    return { result, history };
  }

  private async runSequential(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const history: HistoryEntry[] = [];
    let current = task;
    const steps: { agentId: string; output: any }[] = [];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const entry: HistoryEntry = {
        agentId: agent.id,
        input: current,
        timestamp: Date.now()
      };

      try {
        const output = await agent.run(current, {
          mode: "hybrid-sequential",
          step: i,
          runOrchFramework,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Hybrid adaptive tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: agent.id,
              orchestrationId: this.id,
              mode: "hybrid-sequential",
              step: i,
              history: [...history],
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });
        current = output;
        entry.output = output;
        steps.push({ agentId: agent.id, output });
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return { result: current, steps, history };
  }

  private async runNegotiate(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const history: HistoryEntry[] = [];

    const scored = await Promise.all(
      agents.map(async (agent) => {
        let baseScore = 0.5;

        try {
          const proposal = (agent as any).propose
            ? await (agent as any).propose(task)
            : null;
          if (proposal && typeof proposal.score === "number") {
            baseScore = proposal.score;
          }
        } catch {
          // ignore propose errors, agent just keeps default score
        }

        const costAdj =
          typeof (agent as any).cost === "number"
            ? 1 / (1 + (agent as any).cost)
            : 0.5;

        return {
          agent,
          score: (baseScore + costAdj) / 2
        };
      })
    );

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0]?.agent;

    let result: any = null;

    if (winner) {
      const entry: HistoryEntry = {
        agentId: winner.id,
        input: task,
        timestamp: Date.now()
      };

      try {
        result = await winner.run(task, {
          mode: "hybrid-negotiate",
          winner: winner.id,
          ranking: scored.map((s) => ({
            agentId: s.agent.id,
            score: s.score
          })),
          runOrchFramework,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Hybrid adaptive tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: winner.id,
              orchestrationId: this.id,
              mode: "hybrid-negotiate",
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
      winner: winner?.id,
      ranking: scored.map((s) => ({
        agentId: s.agent.id,
        score: s.score
      })),
      result,
      history
    };
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("HybridAdaptiveOrch requires at least one agent");
    }

    const start = Date.now();
    const pref = (task?.strategy ?? task?.mode ?? "")
      .toString()
      .toLowerCase();

    // 1) Prefer explicit user / task preference
    if (pref === "concurrent" || agents.length >= 3) {
      const { result, history } = await this.runConcurrent(task, agents, runtimeContext);
      return {
        id: this.id,
        strategy: "hybrid-concurrent",
        duration: Date.now() - start,
        result,
        history
      };
    }

    if (pref === "negotiate") {
      const { winner, ranking, result, history } = await this.runNegotiate(
        task,
        agents,
        runtimeContext
      );
      return {
        id: this.id,
        strategy: "hybrid-negotiate",
        duration: Date.now() - start,
        winner,
        ranking,
        result,
        history
      };
    }

    if (pref === "sequential") {
      const { result, steps, history } = await this.runSequential(
        task,
        agents,
        runtimeContext
      );
      return {
        id: this.id,
        strategy: "hybrid-sequential",
        duration: Date.now() - start,
        result,
        steps,
        history
      };
    }

    // 2) Default: simple sequential pipeline (no extra semantics)
    const history: HistoryEntry[] = [];
    let current = task;

    for (const agent of agents) {
      const entry: HistoryEntry = {
        agentId: agent.id,
        input: current,
        timestamp: Date.now()
      };

      try {
        const output = await agent.run(current, {
          mode: "hybrid-default",
          runOrchFramework,
          executeTool: (toolId: string, input: Record<string, unknown>) => {
            if (!runtimeContext?.executeTool) {
              throw new Error("Hybrid adaptive tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, input, {
              agentId: agent.id,
              orchestrationId: this.id,
              mode: "hybrid-default",
              history: [...history],
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });
        current = output;
        entry.output = output;
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return {
      id: this.id,
      strategy: "hybrid-default",
      duration: Date.now() - start,
      result: current,
      history
    };
  }
}

export default HybridAdaptiveOrch;
export { runOrchFramework };
