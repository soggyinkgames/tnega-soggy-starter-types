export const goals = [
  {
    name: "parallel-option-exploration",
    description:
      "Generate and compare many different options in parallel for the same problem or brief.",
    suitedAgents: ["creative-generation", "strategy", "knowledge-insight"],
    capabilities: [
      "generate_content",
      "read_knowledge",
      "aggregate_results",
      "evaluate_content"
    ],
    outcomes: [
      "ranked option list",
      "shortlist with pros/cons",
      "notes on chosen options"
    ],
    examples: [
      "Produce multiple solution ideas for a single problem.",
      "Generate alternative descriptions or messages for one goal.",
      "Suggest different structures for the same document."
    ]
  },
  {
    name: "multi-variant-experiment",
    description:
      "Run the same process many times with different parameters in parallel, then compare results.",
    suitedAgents: ["simulation-scenario", "data-analyst-debugger", "strategy"],
    capabilities: [
      "run_simulation",
      "run_batch_jobs",
      "aggregate_results",
      "evaluate_content"
    ],
    outcomes: [
      "comparison table of variants",
      "recommended variant",
      "notes on sensitivity to inputs"
    ],
    examples: [
      "Test different parameter sets for a scoring function.",
      "Compare timelines or resource allocations using simple assumptions.",
      "Evaluate multiple rule sets for a generic decision process."
    ]
  },
  {
    name: "concurrent-diagnostics-scan",
    description:
      "Run many checks or inspections in parallel across datasets, documents, or systems.",
    suitedAgents: ["data-analyst-debugger", "dev-infrastructure", "knowledge-insight"],
    capabilities: [
      "run_batch_jobs",
      "read_knowledge",
      "aggregate_results",
      "notify_channel"
    ],
    outcomes: [
      "diagnostic summary",
      "list of issues or anomalies",
      "suggested follow-up checks"
    ],
    examples: [
      "Scan multiple logs or reports for basic warning signs.",
      "Check sets of documents for simple rule violations.",
      "Run environment checks across many targets at once."
    ]
  },
  {
    name: "bulk-item-processing",
    description:
      "Apply a common transformation or action to many items concurrently with an audit trail.",
    suitedAgents: ["personal-workflow-assistant", "dev-infrastructure", "data-analyst-debugger"],
    capabilities: [
      "run_batch_jobs",
      "write_knowledge",
      "sync_ticketing",
      "notify_channel"
    ],
    outcomes: [
      "count of items processed",
      "list of failures with reasons",
      "log or simple audit report"
    ],
    examples: [
      "Apply a shared update to many records.",
      "Normalise or reformat a set of entries.",
      "Trigger follow-up actions for a queue of similar tasks."
    ]
  }
];

