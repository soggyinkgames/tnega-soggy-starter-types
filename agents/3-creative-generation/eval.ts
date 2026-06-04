import type { EvalInput, EvalResult } from "packages/eval-types";
import { evaluate as basic } from "packages/eval-basic";
import { evaluate as modelgraded } from "packages/eval-modelgraded";
import { evaluate as regression } from "packages/eval-regression";
import { evaluate as safety } from "packages/eval-safety";
import { evaluate as system } from "packages/eval-system";

const evalRunners = {
    basic,
    modelgraded,
    regression,
    safety,
    system,
};

export async function runEvals(input: EvalInput): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

    for (const evalId of JSON.parse('["modelgraded","safety"]') as string[]) {
        const evaluator = evalRunners[evalId as keyof typeof evalRunners];
        if (!evaluator) continue;
        results.push(...(await evaluator(input)));
    }

    return results;
}
