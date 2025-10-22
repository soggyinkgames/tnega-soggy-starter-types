// lib/runEvals.ts
// Helper to load eval modules, run them on an agent output,
// store results via MemoryManager, and return the collected results.

import { loadEvals } from "@lib/loadEvals";
import { MemoryManager } from "packages/memory";
import type { EvalInput, EvalResult } from "packages/eval-types";

type AgentConfigLite = { id: string; evals?: string[] };

type RunOptions = {
  context?: Record<string, any>;
  reference?: Record<string, any>;
  trace?: Record<string, any>;
  meta?: Record<string, any>;
};

export async function runEvalsAndStore(
  config: AgentConfigLite,
  memoryConfig: Record<string, any> | undefined,
  prompt: string,
  answer: string,
  opts: RunOptions = {}
): Promise<EvalResult[]> {
  const evalIds = config.evals ?? [];
  if (!evalIds.length) return [];

  const evaluators = await loadEvals(evalIds);

  const evalInput: EvalInput = {
    runId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prompt,
    output: answer ?? "",
    context: opts.context,
    reference: opts.reference,
    trace: opts.trace,
    meta: {
      system: { uptime: process.uptime() },
      agent_id: config.id,
      ...(opts.meta || {}),
    },
  };

  const results: EvalResult[] = [];
  for (const evaluator of evaluators) {
    try {
      const r = await evaluator.evaluate(evalInput);
      results.push(...r);
      console.log(
        `[eval] ${evaluator.name} -> ${r.map((x) => `${x.name}:${x.score.toFixed(2)}`).join(", ")}`
      );
    } catch (err) {
      console.warn(`[eval] evaluator '${evaluator.name}' failed:`, (err as Error).message);
    }
  }

  try {
    const memory = new MemoryManager(memoryConfig ?? {});
    await memory.init();
    await memory.storeEval(config.id, results);
  } catch (err) {
    console.warn(`[eval] storeEval skipped:`, (err as Error).message);
  }

  return results;
}

