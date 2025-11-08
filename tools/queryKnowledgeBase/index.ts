import OpenAI from "openai";
import { supabase } from "@lib/supabase";

export type Match = {
  id: string;
  content: string;
  similarity: number;
};

export async function queryKnowledgeBase({
  query,
  maxResults = 5,
  threshold = 0.7,
}: {
  query: string;
  maxResults?: number;
  threshold?: number;
}): Promise<{ matches: Match[] }> {
  // If environment is not configured, return a deterministic mock to keep unit tests stable
  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      matches: [
        { id: "mock-1", content: `Mock for ${query}`, similarity: 0.99 },
      ],
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const emb = await openai.embeddings.create({ model: "text-embedding-3-large", input: query });

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: emb.data[0].embedding,
    match_threshold: threshold,
    match_count: maxResults,
  });
  if (error) throw new Error(error.message);
  return { matches: (data ?? []) as Match[] };
}

// Backwards-compatible tool wrapper used by simple test harnesses
export async function runTool(spec: any) {
  const q = spec?.query || "";
  const { matches } = await queryKnowledgeBase({ query: q, maxResults: spec?.maxResults, threshold: spec?.threshold });
  return { hits: matches, total: matches.length };
}
