// orchestrations/sequential/index.ts
import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";
import { resolveSequentialAgentToolRuntime } from "./tools";

export class SequentialOrch implements OrchestrationPattern {
  id = config.id;
  name = "Sequential Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new SequentialOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("SequentialOrch requires at least one agent");
    }

    const start = Date.now();
    const history: HistoryEntry[] = [];
    const steps: { agentId: string; output: any }[] = [];

    let current = task;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      const entry: HistoryEntry = {
        agentId: agent.id,
        input: current,
        timestamp: Date.now()
      };

      try {
        const {
          selectedToolCollections,
          selectedToolIds,
          declaredRequiredTools,
        } = resolveSequentialAgentToolRuntime({
          id: agent.id,
          config: agent.config,
          requiredTools: agent.requiredTools,
        });

        const output = await agent.run(current, {
          mode: "sequential",
          step: i,
          runOrchFramework,
          history,
          selectedToolCollections,
          selectedToolIds,
          declaredRequiredTools,
          // Keep this executeTool(toolId, state) contract stable so the
          // runtime can move from local tools to an API without changing agents.
          executeTool: (toolId: string, spec: Record<string, unknown>) => {
            if (!selectedToolIds.includes(toolId)) {
              throw new Error(
                `Sequential tooling denied unselected tool "${toolId}" for agent "${agent.id}".`,
              );
            }

            if (!runtimeContext?.executeTool) {
              throw new Error("Sequential tooling requires runtimeContext.executeTool().");
            }

            return runtimeContext.executeTool(toolId, spec, {
              agentId: agent.id,
              orchestrationId: this.id,
              step: i,
              selectedToolCollections,
              selectedToolIds,
              history,
            });
          },
          requestCapability: runtimeContext?.requestCapability,
        });

        entry.output = output;
        current = output;
        steps.push({ agentId: agent.id, output });
      } catch (err) {
        entry.error = String(err);
      }

      history.push(entry);
    }

    return {
      id: this.id,
      strategy: "sequential",
      duration: Date.now() - start,
      result: current,
      steps,
      history
    };
  }
}

export default SequentialOrch;
export { runOrchFramework };
