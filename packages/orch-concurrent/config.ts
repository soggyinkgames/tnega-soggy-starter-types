export const config = {
  id: "orch-concurrent",
  name: "Concurrent Orchestration",
  coordinationType: "concurrent",
  version: "1.0.0",
  description: "Executes agent tasks in parallel and merges their results.",
};

export type ConcurrentConfig = typeof config;

