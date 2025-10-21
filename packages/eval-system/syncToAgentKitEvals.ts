// todo: implement when openai agentkit exposes their api's to send eval data from these agents to the kit (future-proof)

import OpenAI from "openai";
import { EvalResult, EvalInput } from "packages/eval-types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Syncs a completed eval run + trace to the OpenAI AgentKit Evals dashboard.
 * Call this after running all your eval modules.
 */
export async function syncToAgentKit(runId: string, input: EvalInput, results: EvalResult[]) {
    try {
        const payload = {
            run_id: runId,
            trace: input.trace,
            results: results.map((r) => ({
                metric: r.name,
                score: r.score,
                verdict: r.verdict,
                details: r.details,
            })),
        };

        // Placeholder for future AgentKit Evals endpoint
        const res = await client.post("/v1/agentkit/evals/trace_grading", { body: payload });
        console.log(`✅ Synced eval results to AgentKit for run ${runId}`, res);
    } catch (err) {
        console.warn("⚠️ Failed to sync to AgentKit:", (err as Error).message);
    }
}
