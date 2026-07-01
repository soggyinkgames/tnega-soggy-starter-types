import path from "path";
import fs from "fs-extra";
import { pathToFileURL } from "url";

import { OrchestrationRegistry } from "../packages/registry";
import type { Agent, OrchestrationResult, RuntimeContext } from "../packages/types";
import { executeTool as executeLocalTool } from "../src/tools/runtime.js";
import { assertAgentConfigCapabilities } from "./helpers/agentCapabilities.js";

export type RunAgentCommandOptions = {
  agentName: string;
  query: string;
  agentsRoot?: string;
  orchestrationRegistry?: Record<string, { run: (task: any, agents: Agent[], runtimeContext?: RuntimeContext) => Promise<OrchestrationResult> }>;
  runtimeContext?: RuntimeContext;
};

export type ChatConversationEntry = {
  role: "user" | "agent";
  content: string;
  output?: any;
};

export type RunAgentChatSessionOptions = {
  agentName: string;
  messages: AsyncIterable<string>;
  agentsRoot?: string;
  orchestrationRegistry?: Record<string, { run: (task: any, agents: Agent[], runtimeContext?: RuntimeContext) => Promise<OrchestrationResult> }>;
  runtimeContext?: RuntimeContext;
  onResponse?: (response: string, output: any, history: ChatConversationEntry[]) => void | Promise<void>;
  exitCommands?: string[];
};

export type RunAgentChatSessionResult = {
  agentName: string;
  config: Record<string, any>;
  requiredTools: string[];
  orchestrationId: string;
  history: ChatConversationEntry[];
};

type ChatTask = {
  mode: "chat";
  message: string;
  history: ChatConversationEntry[];
  state: {
    conversation: ChatConversationEntry[];
  };
};

export type RunAgentCommandResult = {
  agentName: string;
  query: string;
  config: Record<string, any>;
  requiredTools: string[];
  orchestrationId: string | null;
  output: any;
  displayOutput: string | null;
  evalPath?: string;
};

export type RunAgentEvalsOptions = {
  evalPath: string;
  input: string;
  output: string;
  agentName: string;
  loadEvalModule?: (evalPath: string) => Promise<{ runEvals?: (payload: any) => Promise<any> }>;
};

async function safeImport(modulePath: string) {
  const fullPath = path.isAbsolute(modulePath)
    ? pathToFileURL(modulePath).href
    : pathToFileURL(path.resolve(modulePath)).href;
  return import(fullPath);
}

export function normalizeOrchestrationId(value?: string): string | null {
  if (!value) return null;
  return value.startsWith("orch-") ? value : `orch-${value}`;
}

export function formatOutputForDisplay(output: any): string | null {
  if (typeof output === "string") {
    return output;
  }

  if (typeof output?.output === "string") {
    return output.output;
  }

  if (output === undefined) {
    return null;
  }

  return JSON.stringify(output, null, 2);
}

export function createLocalRuntimeContext(): RuntimeContext {
  return {
    executeTool: async (toolId, input, context) => executeLocalTool(toolId, input, context),
    requestCapability: async (request) => ({
      status: "unimplemented",
      request,
    }),
  };
}

async function loadAgentRuntime(options: {
  agentName: string;
  agentsRoot?: string;
  orchestrationRegistry?: RunAgentCommandOptions["orchestrationRegistry"];
  runtimeContext?: RuntimeContext;
}) {
  const agentsRoot = options.agentsRoot ?? path.resolve("agents");
  const registry = options.orchestrationRegistry ?? OrchestrationRegistry;
  const runtimeContext = options.runtimeContext ?? createLocalRuntimeContext();
  const baseDir = path.resolve(agentsRoot, options.agentName);
  const agentPath = path.join(baseDir, "index.ts");
  const configPath = path.join(baseDir, "config.ts");
  const evalPath = path.join(baseDir, "eval.ts");
  const toolsPath = path.join(baseDir, "tools.ts");

  if (!fs.existsSync(agentPath)) {
    throw new Error(`Agent not found at ${agentPath}`);
  }

  const agentMod = await safeImport(agentPath);
  const configMod = fs.existsSync(configPath) ? await safeImport(configPath) : {};
  const toolsMod = fs.existsSync(toolsPath) ? await safeImport(toolsPath) : {};

  const runAgent = agentMod.runAgent || agentMod.default;
  const config = configMod.default ?? {};
  assertAgentConfigCapabilities(config);
  const requiredTools = Array.isArray(toolsMod.requiredTools)
    ? toolsMod.requiredTools
    : [];
  const orchestrationId = normalizeOrchestrationId(
    config.defaultOrchestration ?? config.default_orch,
  );

  return {
    agentsRoot,
    registry,
    runtimeContext,
    agentPath,
    configPath,
    evalPath,
    toolsPath,
    runAgent,
    config,
    requiredTools,
    orchestrationId,
  };
}

function assertChatEnabled(config: Record<string, any>) {
  const enabled = config.capabilities?.enabled;
  if (!Array.isArray(enabled) || !enabled.includes("chat")) {
    throw new Error("Chat mode requires agent config capabilities.enabled to include chat.");
  }
}

function assertNoOrchestrationError(
  orchestrationResult: OrchestrationResult,
  orchestrationId: string,
) {
  const failedEntry = orchestrationResult?.history?.find((entry) => entry.error);
  if (failedEntry?.error) {
    throw new Error(
      `Agent "${failedEntry.agentId}" failed during ${orchestrationId}: ${failedEntry.error}`,
    );
  }
}

function toAgentChatInput(task: ChatTask) {
  return {
    message: task.message,
    query: task.message,
    prompt: task.message,
    history: task.history,
    state: task.state,
  };
}

export async function runAgentCommand(
  options: RunAgentCommandOptions,
): Promise<RunAgentCommandResult> {
  const loaded = await loadAgentRuntime(options);
  const {
    registry,
    runtimeContext,
    evalPath,
    runAgent,
    config,
    requiredTools,
    orchestrationId,
  } = loaded;

  let output: any;
  if (orchestrationId) {
    const OrchestrationRunner = registry[orchestrationId];

    if (!OrchestrationRunner || typeof OrchestrationRunner.run !== "function") {
      throw new Error(`No orchestration runner is registered for "${orchestrationId}".`);
    }

    const orchestrationResult = await OrchestrationRunner.run(
      options.query,
      [
        {
          id: config.id ?? options.agentName,
          config,
          requiredTools,
          run: runAgent,
        },
      ],
      runtimeContext,
    );

    assertNoOrchestrationError(orchestrationResult, orchestrationId);

    output = orchestrationResult?.result;
  } else {
    output = await runAgent(options.query, runtimeContext);
  }

  return {
    agentName: options.agentName,
    query: options.query,
    config,
    requiredTools,
    orchestrationId,
    output,
    displayOutput: formatOutputForDisplay(output),
    evalPath: fs.existsSync(evalPath) ? evalPath : undefined,
  };
}

export async function runAgentChatSession(
  options: RunAgentChatSessionOptions,
): Promise<RunAgentChatSessionResult> {
  const loaded = await loadAgentRuntime(options);
  const {
    registry,
    runtimeContext,
    runAgent,
    config,
    requiredTools,
    orchestrationId,
  } = loaded;

  assertChatEnabled(config);

  if (!orchestrationId) {
    throw new Error("Chat mode requires the agent to declare a default orchestration.");
  }

  const OrchestrationRunner = registry[orchestrationId];
  if (!OrchestrationRunner || typeof OrchestrationRunner.run !== "function") {
    throw new Error(`No orchestration runner is registered for "${orchestrationId}".`);
  }

  const exitCommands = options.exitCommands ?? ["/exit", "/quit"];
  const history: ChatConversationEntry[] = [];

  for await (const rawMessage of options.messages) {
    const message = rawMessage.trim();
    if (!message) continue;
    if (exitCommands.includes(message.toLowerCase())) break;

    const task: ChatTask = {
      mode: "chat",
      message,
      history: [...history],
      state: {
        conversation: [...history],
      },
    };

    const orchestrationResult = await OrchestrationRunner.run(
      task,
      [
        {
          id: config.id ?? options.agentName,
          config,
          requiredTools,
          run: (input: any, context?: Record<string, any>) => {
            if (input?.mode !== "chat") {
              return runAgent(input, context);
            }

            return runAgent(toAgentChatInput(input), {
              ...context,
              chat: input,
              conversationHistory: input.history,
              conversationState: input.state,
            });
          },
        },
      ],
      runtimeContext,
    );

    assertNoOrchestrationError(orchestrationResult, orchestrationId);

    const output = orchestrationResult?.result;
    const response = formatOutputForDisplay(output) ?? "";
    history.push({ role: "user", content: message });
    history.push({ role: "agent", content: response, output });

    await options.onResponse?.(response, output, [...history]);
  }

  return {
    agentName: options.agentName,
    config,
    requiredTools,
    orchestrationId,
    history,
  };
}

export async function runAgentEvals(options: RunAgentEvalsOptions) {
  const loadEvalModule = options.loadEvalModule ?? safeImport;
  const evalMod = await loadEvalModule(options.evalPath);

  if (typeof evalMod.runEvals !== "function") {
    throw new Error(`Eval module at ${options.evalPath} does not export runEvals().`);
  }

  return evalMod.runEvals({
    input: options.input,
    output: options.output,
    meta: { agent: options.agentName, time: new Date().toISOString() },
  });
}
