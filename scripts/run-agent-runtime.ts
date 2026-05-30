import path from "path";
import fs from "fs-extra";
import { pathToFileURL } from "url";

import { OrchestrationRegistry } from "../packages/registry";
import type { Agent, OrchestrationResult } from "../packages/types";

export type RunAgentCommandOptions = {
  agentName: string;
  query: string;
  agentsRoot?: string;
  orchestrationRegistry?: Record<string, { run: (task: any, agents: Agent[]) => Promise<OrchestrationResult> }>;
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

export async function runAgentCommand(
  options: RunAgentCommandOptions,
): Promise<RunAgentCommandResult> {
  const agentsRoot = options.agentsRoot ?? path.resolve("agents");
  const registry = options.orchestrationRegistry ?? OrchestrationRegistry;
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
  const requiredTools = Array.isArray(toolsMod.requiredTools)
    ? toolsMod.requiredTools
    : [];
  const orchestrationId = normalizeOrchestrationId(
    config.defaultOrchestration ?? config.default_orch,
  );

  let output: any;
  if (orchestrationId) {
    const OrchestrationRunner = registry[orchestrationId];

    if (!OrchestrationRunner || typeof OrchestrationRunner.run !== "function") {
      throw new Error(`No orchestration runner is registered for "${orchestrationId}".`);
    }

    const orchestrationResult = await OrchestrationRunner.run(options.query, [
      {
        id: config.id ?? options.agentName,
        config,
        requiredTools,
        run: runAgent,
      },
    ]);

    output = orchestrationResult?.result;
  } else {
    output = await runAgent(options.query);
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
