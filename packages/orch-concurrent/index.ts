import { Agent, OrchestrationPattern, HistoryEntry, RuntimeContext } from "../types";
import config from "./config";
import { runOrchFramework } from "../runOrchFramework";

export class ConcurrentOrch implements OrchestrationPattern {
  id = config.id;
  name = "Concurrent Orchestration";
  description = config.description;

  static async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    const orch = new ConcurrentOrch();
    return orch.run(task, agents, runtimeContext);
  }

  async run(task: any, agents: Agent[], runtimeContext?: RuntimeContext) {
    if (!agents || agents.length === 0) {
      throw new Error("ConcurrentOrch requires at least one agent");
    }

    const start = Date.now();
    const isArray = Array.isArray(task);

    const history: HistoryEntry[] = await Promise.all(
      agents.map(async (agent, index) => {
        const input = isArray ? (task[index] ?? task[0]) : task;

        const entry: HistoryEntry = {
          agentId: agent.id,
          input,
          timestamp: Date.now()
        };

        try {
          const output = await agent.run(input, {
            mode: "concurrent",
            index,
            runOrchFramework,
            executeTool: (toolId: string, toolInput: Record<string, unknown>) => {
              if (!runtimeContext?.executeTool) {
                throw new Error("Concurrent tooling requires runtimeContext.executeTool().");
              }

              return runtimeContext.executeTool(toolId, toolInput, {
                agentId: agent.id,
                orchestrationId: this.id,
                mode: "concurrent",
                index,
              });
            },
            requestCapability: runtimeContext?.requestCapability,
          });
          entry.output = output;
        } catch (err) {
          entry.error = String(err);
        }

        return entry;
      })
    );

    const result = history
      .filter((h) => typeof (h as any).output !== "undefined")
      .map((h) => ({
        agentId: h.agentId,
        input: h.input,
        output: (h as any).output
      }));

    return {
      id: this.id,
      strategy: "concurrent",
      duration: Date.now() - start,
      result,
      history
    };
  }
}

export default ConcurrentOrch;
export { runOrchFramework };
