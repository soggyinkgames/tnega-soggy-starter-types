export default {
  id: "orch-negotiate",
  description: "Initiator agent broadcasts a call-for-proposals to accomplish a task to agents, agents respond with quote or refusal, from quotes initiator agent selects best offer and sends an accept-proposal to successful agent (contract net protocol)",
  supported_framework: ["crewai", "langgraph"],
  default_framework: "crewai",
  compatible_agent_types: ["simulation-scenario", "creative-generation", "strategy", "data-analyst-debugger"]
};
