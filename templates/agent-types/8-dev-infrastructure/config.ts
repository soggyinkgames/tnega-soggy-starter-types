// agents/8-dev-infrastructure/config.ts
export default {
    id: "8-dev-infrastructure",
    title: "Dev Infrastructure Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["regression", "system"],
    capabilities: { chat: true },
    deploy: "vercel",
    ci: "github",
};
