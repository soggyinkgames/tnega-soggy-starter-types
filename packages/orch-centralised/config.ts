export default {
  id: "orch-centralised",
  description: "One boss agent routes work and merges outputs",
  supported_framework: ["langchain"],
  default_tooling: "langchain",
  compatible_agent_types: ["educational", "strategy", "personal-workflow-assistant", "dev-infrastructure"]
};
