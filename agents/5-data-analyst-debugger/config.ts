// agents/5-data-analyst-debugger/config.ts
export default {
    id: "5-data-analyst-debugger",
    title: "Data Analyst / Debugger Agent",
    orchestration: "orch-concurrent", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["basic", "system"],
    capabilities: {
        enabled: ["chat"],
        availableOnRequest: [],
        disallowed: [],
    },
    deploy: "vercel",
    ci: "github",
};
