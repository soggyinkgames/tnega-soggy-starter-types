// agents/5-data-analyst-debugger/config.ts
export default {
    id: "5-data-analyst-debugger",
    title: "Data Analyst / Debugger Agent",
    orchestration: "llamaindex", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["basic", "system"],
    deploy: "vercel",
    ci: "github",
};
