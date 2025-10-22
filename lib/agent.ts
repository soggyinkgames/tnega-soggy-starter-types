import { z } from "zod";

/** Generic agent type */
export type Agent<TIn, TOut> = {
    /** Internal name for the agent */
    name: string;
    /** Optional description for dashboards */
    description?: string;
    /** Input schema (Zod ensures runtime + TS validation) */
    input: z.ZodType<TIn>;
    /** Execution method */
    run: (input: TIn) => Promise<TOut>;
};

/** Helper to define strongly typed agents */
export function defineAgent<TIn, TOut>(cfg: Agent<TIn, TOut>): Agent<TIn, TOut> {
    return cfg;
}
