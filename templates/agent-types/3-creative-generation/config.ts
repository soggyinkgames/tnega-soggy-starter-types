export default {
    id: "__AGENT_NAME__",
    agentType: "creative-generation" as const,
    defaultOrchestration: "__DEFAULT_ORCHESTRATION__",
    goalProfile: "__GOAL_PROFILE__",
    inputKinds: JSON.parse('__INPUT_KINDS_JSON__') as string[],
    outputTargets: JSON.parse('__OUTPUT_TARGETS_JSON__') as string[],
    evals: JSON.parse('__EVALS_JSON__') as string[],
    memory: {
        provider: "__MEMORY_PROVIDER__",
    },
    framework: "__FRAMEWORK__",
};
