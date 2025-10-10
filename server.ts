// server.ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { knowledgeAgent } from "@agents/1-knowledge-insight/index.js";

const app = new Hono();

// ✅ Example: basic route
app.get("/", (c) => c.text("🧠 Soggy Starter Agents API running"));

// ✅ Agent route
app.post("/agents/knowledge", async (c) => {
    const body = await c.req.json();
    const result = await knowledgeAgent.run(body);
    return c.json(result);
});

// Local development server
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
console.log(`🚀 Hono server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

// ✅ Export for Edge runtimes (Vercel, Supabase)
export default app;
