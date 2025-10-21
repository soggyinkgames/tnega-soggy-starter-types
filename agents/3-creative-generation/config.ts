// agents/3-creative-generation/config.ts
export default {
    id: "3-creative-generation",
    title: "Creative Generation Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["modelgraded", "safety"],
    deploy: "vercel",
    ci: "github",
};
