// agents/7-educational/config.ts
export default {
    id: "7-educational",
    title: "Educational Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["modelgraded", "safety"],
    deploy: "vercel",
    ci: "github",
};
