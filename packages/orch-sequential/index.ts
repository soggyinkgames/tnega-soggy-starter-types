// orchestrations/sequential/index.ts
import { Agent, OrchestrationPattern, HistoryEntry } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";
import { executeTool } from "../../src/tools/runtime";
import { resolveSequentialAgentToolRuntime } from "./tools";

export class SequentialOrch implements OrchestrationPattern {
  id = config.id;
  name = "Sequential Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[]) {
    const orch = new SequentialOrch();
    return orch.run(task, agents);
  }

  async run(task: any, agents: Agent[]) {
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
          executeTool: (toolId: string, spec: any) =>
            executeTool(toolId, spec, {
              agentId: agent.id,
              orchestrationId: this.id,
              step: i,
              selectedToolCollections,
              selectedToolIds,
              history,
            }),
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
