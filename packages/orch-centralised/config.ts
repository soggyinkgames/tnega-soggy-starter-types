export const config = {
  id: "orch-centralised",
  name: "Centralised Orchestration",
  coordinationType: "centralised",
  version: "1.0.0",
  description: "A master orchestrator delegates tasks and merges results sequentially.",
};

export type CentralisedConfig = typeof config;

