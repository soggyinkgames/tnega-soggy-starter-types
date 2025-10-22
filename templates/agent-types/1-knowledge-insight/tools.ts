import OpenAI from "openai";
import { supabase } from "@lib/supabase";

export type Match = {
    id: string;
    content: string;
    similarity: number;
};

// Use shared server-side Supabase client

export async function queryKnowledgeBase({
    query,
    maxResults = 5,
    threshold = 0.7,
}: {
    query: string;
    maxResults?: number;
    threshold?: number;
}): Promise<{ matches: Match[] }> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const emb = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: query,
    });

    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: emb.data[0].embedding,
        match_threshold: threshold,
        match_count: maxResults,
    });

    if (error) throw new Error(error.message);
    return { matches: (data ?? []) as Match[] };
}
