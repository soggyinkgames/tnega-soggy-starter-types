// agents/1-knowledge-insight/config.ts
export default {
    id: "1-knowledge-insight",
    title: "Knowledge / Insight Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["basic", "modelgraded", "system"], //recomended
    deploy: "vercel",
    ci: "github",
};
