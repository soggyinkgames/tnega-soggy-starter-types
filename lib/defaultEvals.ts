// lib/defaultEvals.ts
// Central fallback mapping from agent type IDs (folder slugs)
// to arrays of recommended eval identifiers.

export const DEFAULT_EVALS: Record<string, string[]> = {
  "1-knowledge-insight": ["basic", "modelgraded", "system"],
  "2-strategy": ["regression", "modelgraded"],
  "3-creative-generation": ["safety", "modelgraded"],
  "4-personal-workflow-assistant": ["regression", "safety", "system" ],
  "5-data-analyst-debugger": ["basic", "system"],
  "6-simulation-scenario": ["regression", "system"],
  "7-educational": ["modelgraded", "safety"],
  "8-dev-infrastructure": ["regression", "system"],
};

