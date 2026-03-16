export default {
  id: "orch-hybrid-adaptive",
  description: "Mix and switch modes automatically based on context/outcome.",
  supported_framework: ["langgraph", "crewai"],
  default_framework: "langgraph",
  compatible_agent_types: ["dev-infrastructure", "simulation-scenario", "strategy", "personal-workflow-assistant"]
};
