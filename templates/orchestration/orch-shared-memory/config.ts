export default {
  id: "orch-shared-memory",
  description: "Shared memory orchestration for knowledge-insight agents",
  default_tooling: "langgraph",
  supported_framework: ["langgraph", "langchain"],
  memory_model: "shared",
  evaluation_mode: "system",
  node_roles: {},
};
