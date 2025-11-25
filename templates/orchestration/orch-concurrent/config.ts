export default {
  id: "orch-concurrent",
  description: "Parallel concurrent orchestration for data analysis/debugging",
  default_tooling: "langgraph",
  supported_tooling: ["langgraph", "langchain"],
  memory_model: "per-session",
  evaluation_mode: "system",
  node_roles: {},
};
