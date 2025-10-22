import OpenAI from "openai";
import { z } from "zod";
import { defineAgent } from "@lib/agent"; // uses tsconfig alias
import { queryKnowledgeBase, type Match } from "./tools"; // note: .js for NodeNext

const inputSchema = z.object({
    query: z.string().min(1),
    maxResults: z.number().int().min(1).max(20).optional(),
    threshold: z.number().min(0).max(1).optional(),
});

export const knowledgeAgent = defineAgent({
    name: "KnowledgeInsight",
    description: "RAG-first researcher that retrieves and summarizes with citations.",
    input: inputSchema,
    async run(raw: unknown) {
        const { query, maxResults = 5, threshold = 0.7 } = inputSchema.parse(raw);

        const { matches } = await queryKnowledgeBase({ query, maxResults, threshold });

        const context = matches
            .map((m: Match) => `ID:${m.id} (score ${m.similarity.toFixed(3)}): ${m.content}`)
            .join("\n\n");

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const res = await client.responses.create({
            model: "gpt-4.1",
            input: [
                { role: "system", content: "Answer only from context. Cite [ID]." },
                { role: "user", content: `Q: ${query}\n\nContext:\n${context}` },
            ],
        });

        return {
            answer: res.output_text,
            sources: matches.map((m: Match) => ({ id: m.id, similarity: m.similarity })),
            usage: res.usage,
        };
    },
});
