export default {
  id: "orch-sequential",
  description: "Step-based sequential orchestration for workflow assistant agents",
  default_tooling: "langchain",
  supported_tooling: ["langchain", "langgraph"],
  memory_model: "per-session",
  evaluation_mode: "system",
  node_roles: {},
};
