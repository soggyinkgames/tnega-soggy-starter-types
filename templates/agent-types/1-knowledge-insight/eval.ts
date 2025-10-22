import { evaluate as basic } from "packages/eval-basic";
import { evaluate as modelgraded } from "packages/eval-modelgraded";
import { evaluate as systemEval } from "packages/eval-system";
import type { EvalInput, EvalResult } from "packages/eval-types/index"; // your shared types

export async function runEvals(input: EvalInput): Promise<EvalResult[]> {
    const results: EvalResult[] = [];

    // Deterministic match/fuzzy checks
    results.push(...(await basic(input)));

    // Model-graded rubric checks (quality, coherence, factuality)
    results.push(...(await modelgraded(input)));

    // End-to-end system trace evaluation
    results.push(...(await systemEval(input)));

    return results;
}
