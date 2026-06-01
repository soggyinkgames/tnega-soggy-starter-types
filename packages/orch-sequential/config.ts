export default {
  id: "orch-sequential",
  description: "Sequential pipeline - output of one agent becomes input for the next.",
  supported_framework: ["langchain", "langgraph"],
  default_framework: "langchain",
  compatible_agent_types: [
    "personal-workflow-assistant",
    "creative-generation",
    "educational",
    "data-analyst-debugger",
    "dev-infrastructure",
  ],
  recommended_for: {
    "creative-generation": true,
  },
};
