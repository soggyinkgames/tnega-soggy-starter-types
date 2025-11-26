export default {
  id: "orch-sequential",
  description: "Sequential pipeline — output of one agent becomes input for the next.",
  supported_tooling: ["langchain", "langgraph"],
  default_tooling: "langchain",
  compatible_agent_types: ["personal-workflow-assistant", "creative-generation", "educational", "data-analyst-debugger", "dev-infrastructure"]
};
