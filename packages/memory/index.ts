// packages/memory/memory.ts
import { supabase as sharedSupabase } from "@lib/supabase";

type LongTermType = "supabase" | undefined;
type ShortTermType = "redis" | undefined;

export class MemoryManager {
    private supabase: typeof sharedSupabase | undefined;
    private redis: any | undefined;

    constructor(private config: { shortTerm?: ShortTermType; longTerm?: LongTermType } = {}) {}

    async init() {
        if (this.config.shortTerm === "redis") await this.connectRedis();
        if (this.config.longTerm === "supabase") await this.connectSupabase();
    }

    private async connectSupabase() {
        // Use shared client; credentials come from env via lib/supabase
        this.supabase = sharedSupabase;
        // minimal trace to follow existing lightweight style
        // console.log(`[memory] Supabase long-term memory initialized`);
    }

    private async connectRedis() {
        // TODO: wire real Redis client per environment; placeholder no-op
        // console.log(`[memory] Redis short-term memory initialized`);
        this.redis = this.redis ?? undefined;
    }

    // Store eval results to long-term memory (Supabase); safe no-op if unavailable
    async storeEval(agentId: string, evalResults: any[]) {
        if (this.config.longTerm !== "supabase" || !this.supabase) {
            // console.log(`[memory] storeEval skipped (no long-term store configured)`);
            return; // no-op
        }
        try {
            await this.supabase
                .from("agent_evals")
                .insert(evalResults.map((r) => ({ agent_id: agentId, ...r })));
        } catch (err) {
            // Swallow to avoid regressing existing flows; surface minimal trace
            // console.error(`[memory] storeEval error:`, err);
        }
    }

    // Load recent evals from long-term memory; safe no-op behavior if unavailable
    async loadRecentEvals(agentId: string, limit = 5) {
        if (this.config.longTerm !== "supabase" || !this.supabase) {
            // console.log(`[memory] loadRecentEvals skipped (no long-term store configured)`);
            return [] as any[];
        }
        try {
            const { data } = await this.supabase
                .from("agent_evals")
                .select("*")
                .eq("agent_id", agentId)
                .order("created_at", { ascending: false })
                .limit(limit);
            return data ?? [];
        } catch (err) {
            // console.error(`[memory] loadRecentEvals error:`, err);
            return [] as any[];
        }
    }
}
