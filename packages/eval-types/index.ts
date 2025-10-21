// packages/eval-types

/** Core schema for all evaluation packages */
export interface EvalInput {
    runId: string;
    prompt: string;
    output: string;
    context?: Record<string, any>;    // retrieved docs, memory, tools
    reference?: Record<string, any>; // golden answers
    trace?: Record<string, any>;     // full agent trace
    meta?: Record<string, any>;      // model version, config, etc.
}

/** Result object returned by any eval module */
export interface EvalResult {
    name: string;                     // e.g., "basic.match", "system.trace"
    score: number;                    // 0..1 numeric result
    verdict?: "pass" | "warn" | "fail";
    details?: Record<string, any>;
}

/** Minimal adapter interface that each eval-* implements */
export interface EvalModule {
    name: string;
    evaluate(input: EvalInput): Promise<EvalResult[]>;
}

/** Enum of standardized verdict levels */
export enum Verdict {
    PASS = "pass",
    WARN = "warn",
    FAIL = "fail",
}


export abstract class BaseEval implements EvalModule {
    abstract name: string;
    abstract evaluate(input: EvalInput): Promise<EvalResult[]>;

    protected normalizeScore(score: number): number {
        return Math.min(Math.max(score, 0), 1);
    }
}