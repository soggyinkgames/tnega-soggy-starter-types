// agents/2-strategy/config.ts
export default {
    id: "2-strategy",
    title: "Strategy Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["modelgraded", "regression"], //recomended
    capabilities: {
        enabled: ["chat"],
        availableOnRequest: [],
        disallowed: [],
    },
    deploy: "vercel",
    ci: "github",
};
