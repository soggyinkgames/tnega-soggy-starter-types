export default {
  id: "orch-centralised",
  description: "Central orchestrator pattern for educational tutor–learner loops",
  default_tooling: "langchain",
  supported_tooling: ["langchain", "langgraph"],
  memory_model: "central",
  evaluation_mode: "system",
  node_roles: {},
};
