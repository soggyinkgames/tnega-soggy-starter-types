// agents/4-personal-workflow-assistant/config.ts
export default {
    id: "4-workflow-assistant",
    title: "Workflow / Insight Agent",
    orchestration: "orch-sequential", // crewai | langchain | langgraph
    memory: { shortTerm: "redis", longTerm: "supabase" },
    vectorStore: "pgvector",
    llm: "openai:gpt-4-turbo",
    evals: ["regression", "safety", "system"], //recomended
    capabilities: { chat: true },
    deploy: "vercel",
    ci: "github",
};
