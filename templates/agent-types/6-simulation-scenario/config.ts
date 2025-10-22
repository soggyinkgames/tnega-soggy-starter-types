// agents/6-simulation-scenario/config.ts
export default {
    id: "6-simulation-scenario",
    title: "Simulation Scenario Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["system", "regression"],
    deploy: "vercel",
    ci: "github",
};
