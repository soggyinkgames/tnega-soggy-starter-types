// Goal: grade the whole agent trace — retrieval quality, tool success, memory usage, etc.

import { EvalModule, EvalInput, EvalResult, Verdict } from "packages/eval-types";

/** System / trace-level evaluation (end-to-end agent correctness) */
export const name = "eval-system";

export async function evaluate(input: EvalInput): Promise<EvalResult[]> {
    const trace = input.trace ?? {};
    const results: EvalResult[] = [];

    // Retrieval hit-rate: did we get enough context?
    const retrieved = trace.retrieved_docs?.length ?? 0;
    const usedDocs = trace.used_docs?.length ?? 0;
    const hitRate = retrieved > 0 ? usedDocs / retrieved : 1;
    results.push({
        name: `${name}.retrieval_hit_rate`,
        score: hitRate,
        verdict: hitRate > 0.6 ? Verdict.PASS : Verdict.WARN,
        details: { retrieved, usedDocs },
    });

    // Tool success rate
    const toolCalls = trace.tools ?? [];
    const success = toolCalls.filter((t: any) => t.success).length;
    const toolSuccessRate = toolCalls.length ? success / toolCalls.length : 1;
    results.push({
        name: `${name}.tool_success_rate`,
        score: toolSuccessRate,
        verdict: toolSuccessRate > 0.8 ? Verdict.PASS : Verdict.WARN,
        details: { success, total: toolCalls.length },
    });

    // Latency budget (e.g., under 10 s)
    const latency = trace.total_latency ?? 0;
    const latencyScore = latency <= 10 ? 1 : Math.max(0, 1 - (latency - 10) / 20);
    results.push({
        name: `${name}.latency`,
        score: latencyScore,
        verdict: latencyScore > 0.8 ? Verdict.PASS : Verdict.WARN,
        details: { latency },
    });

    // Memory recall accuracy
    const memoryHits = trace.memory_hits ?? 0;
    const memoryQueries = trace.memory_queries ?? 0;
    const memoryAccuracy = memoryQueries ? memoryHits / memoryQueries : 1;
    results.push({
        name: `${name}.memory_recall`,
        score: memoryAccuracy,
        verdict: memoryAccuracy > 0.7 ? Verdict.PASS : Verdict.WARN,
        details: { memoryHits, memoryQueries },
    });

    // Token efficiency
    const tokens = trace.total_tokens ?? 0;
    const efficiency = tokens > 0 ? Math.min(1, 2000 / tokens) : 1; // arbitrary budget
    results.push({
        name: `${name}.token_efficiency`,
        score: efficiency,
        verdict: efficiency > 0.7 ? Verdict.PASS : Verdict.WARN,
        details: { tokens },
    });

    return results;
}

export default { name, evaluate } as EvalModule;

