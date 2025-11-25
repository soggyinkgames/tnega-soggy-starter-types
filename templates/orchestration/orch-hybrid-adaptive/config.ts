export default {
  id: "orch-hybrid-adaptive",
  description: "Adaptive orchestration for dev-infrastructure agents",
  default_tooling: "langgraph",
  supported_tooling: ["langgraph", "crewai", "langchain"],
  memory_model: "dynamic",
  evaluation_mode: "system",
  node_roles: {},
};
