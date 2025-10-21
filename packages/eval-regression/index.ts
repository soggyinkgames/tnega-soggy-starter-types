// Goal: compare the current agent’s results to a stored baseline (for CI/CD gating).

import { EvalModule, EvalInput, EvalResult, Verdict } from "packages/eval-types";
import fs from "fs";

/** Regression evaluation – detects performance drift against baseline runs */
export const name = "eval-regression";

/**
 * Looks for a local JSON baseline file and compares
 * scores of key metrics. If baseline is missing, passes by default.
 */
export async function evaluate(input: EvalInput): Promise<EvalResult[]> {
    const baselinePath = `baselines/${input.meta?.agent_type || "default"}.json`;
    let score = 1;
    let verdict = Verdict.PASS;
    let details: Record<string, any> = {};

    try {
        if (fs.existsSync(baselinePath)) {
            const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
            const previous = baseline[input.prompt]?.score ?? 1;
            // naive regression detection
            score = Math.max(0, 1 - Math.abs(previous - (input.meta?.score ?? 1)));
            verdict = score < 0.6 ? Verdict.WARN : Verdict.PASS;

            // todo: implement FAIL metric if eval is part of a quality gate eg CI/CD
            // if (score < 0.6) verdict = Verdict.FAIL;
            //     else if (score < 0.8) verdict = Verdict.WARN;
            //     else verdict = Verdict.PASS;

            details = { baseline: previous, current: input.meta?.score ?? 1 };
        } else {
            details = { note: "no baseline found; pass by default" };
        }
    } catch (err) {
        verdict = Verdict.WARN;
        details = { error: (err as Error).message };
    }

    return [{ name, score, verdict, details }];
}

export default { name, evaluate } as EvalModule;
