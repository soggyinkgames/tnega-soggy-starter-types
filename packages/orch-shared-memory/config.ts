export default {
  id: "orch-shared-memory",
  description: "All agents collaborate via a shared data base asynchronously.",
  supported_tooling: ["langgraph", "crewai"],
  default_tooling: "langgraph",
  compatible_agent_types: ["knowledge-insight", "data-analyst-debugger", "simulation-scenario", "personal-workflow-assistant"]
};
