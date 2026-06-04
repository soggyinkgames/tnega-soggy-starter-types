// agents/8-dev-infrastructure/config.ts
export default {
    id: "8-dev-infrastructure",
    title: "Dev Infrastructure Agent",
    orchestration: "orch-hybrid-adaptive", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["regression", "system"],
    capabilities: {
        enabled: ["chat"],
        availableOnRequest: [],
        disallowed: [],
    },
    deploy: "vercel",
    ci: "github",
};
