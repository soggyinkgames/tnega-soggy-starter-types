export default {
  id: "orch-shared-memory",
  description: "All agents collaborate via a shared data base asynchronously.",
  supported_framework: ["langgraph", "crewai"],
  default_framework: "langgraph",
  compatible_agent_types: ["knowledge-insight", "data-analyst-debugger", "simulation-scenario", "personal-workflow-assistant"]
};
