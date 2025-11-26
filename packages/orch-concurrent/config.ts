export default {
  id: "orch-concurrent",  
  description: "Multiple agents act in parallel on independent tasks, later merging results.",
  supported_tooling: ["langgraph"],
  default_tooling: "langgraph",
  compatible_agent_types: ["data-analyst-debugger", "simulation-scenario", "creative-generation", "knowledge-insight"]
};
