export default {
  id: "orch-hierarchical",
  description: "Planner–executor–reviewer orchestration",
  default_framework: "crewai",
  supported_framework: ["langgraph", "langchain"],
  memory_model: "per-session",
  evaluation_mode: "system",
  node_roles: {
    planner: "Breaks high-level tasks into subtasks",
    executor: "Executes subtasks",
    reviewer: "Validates and merges outputs",
  },
};
