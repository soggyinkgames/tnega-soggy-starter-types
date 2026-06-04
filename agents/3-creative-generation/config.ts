export default {
    id: "3-creative-generation",
    agentType: "creative-generation" as const,
    defaultOrchestration: "sequential",
    goalProfile: "music",
    inputKinds: JSON.parse('["prompt-text","audio","reference-set"]') as string[],
    outputTargets: JSON.parse('["music"]') as string[],
    evals: JSON.parse('["modelgraded","safety"]') as string[],
    memory: {
        provider: "supabase",
    },
    framework: "langchain",
    capabilities: {
        enabled: ["chat"],
        availableOnRequest: [],
        disallowed: [],
    },
    deploy: "vercel",
    ci: "github",
    llm: "openai:gpt-4-turbo",
};
