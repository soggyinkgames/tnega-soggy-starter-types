import { EvalModule, EvalInput, EvalResult, Verdict } from "packages/eval-types";

export const name = "eval-basic";

export async function evaluate(input: EvalInput): Promise<EvalResult[]> {
    const { output, reference } = input;
    const pass = reference ? output.includes(reference.answerSnippet) : true;
    return [{
        name: `${name}.match`,
        score: pass ? 1 : 0,
        verdict: pass ? Verdict.PASS : Verdict.FAIL,
        details: { compared: reference?.answerSnippet },
    }];
}

export default { name, evaluate } as EvalModule;
