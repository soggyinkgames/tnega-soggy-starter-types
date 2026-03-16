export default {
  id: "orch-concurrent",  
  description: "Many agents do work in parallel, then you merge or compare.",
  supported_framework: ["langgraph"],
  default_framework: "langgraph",
  compatible_agent_types: ["data-analyst-debugger", "simulation-scenario", "creative-generation", "knowledge-insight"]
};
