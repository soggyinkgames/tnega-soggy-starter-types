export const config = {
  id: "orch-sequential",
  name: "Sequential Orchestration",
  coordinationType: "sequential",
  version: "1.0.0",
  description: "Sequential pipeline — output of one agent becomes input for the next.",
};

export type SequentialConfig = typeof config;

