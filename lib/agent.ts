import { z } from "zod";

export type Agent<TIn, TOut> = {
    name: string;
    description?: string;
    input: z.ZodType<TIn>;
    run: (input: TIn) => Promise<TOut>;
};

export function defineAgent<TIn, TOut>(cfg: Agent<TIn, TOut>) {
    return cfg; // simple identity wrapper for consistency/autocomplete
}
