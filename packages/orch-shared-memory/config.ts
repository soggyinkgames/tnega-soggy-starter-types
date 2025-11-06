export const config = {
  id: "orch-shared-memory",
  name: "Shared Memory Orchestration",
  coordinationType: "shared-memory",
  version: "1.0.0",
  description: "Agents collaborate via a shared data structure (blackboard) asynchronously.",
};

export type SharedMemoryConfig = typeof config;

