import { EvalModule, EvalInput, EvalResult, Verdict } from "packages/eval-types";
import OpenAI from "openai";

export const name = "eval-modelgraded";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function evaluate(input: EvalInput): Promise<EvalResult[]> {
    const gradingPrompt = `
Grade the following answer for factuality (0–1 scale):
Question: ${input.prompt}
Answer: ${input.output}`;
    const res = await client.responses.create({
        model: "gpt-4o-mini",
        input: gradingPrompt,
    });

    const score = parseFloat(res.output_text.match(/(\d(\.\d+)?)/)?.[1] ?? "0");
    return [{
        name: `${name}.factuality`,
        score,
        verdict: score > 0.8 ? Verdict.PASS : Verdict.WARN,
        details: { raw: res.output_text },
    }];
}

export default { name, evaluate } as EvalModule;
