export const goals = [
  {
    name: "migration-plan",
    description: "Combine planning, analysis, and execution logs across modes.",
    suitedAgents: ["dev-infrastructure", "strategy"],
    recommendedTools: ["analyzeData", "summarize", "formatReport"],
    outcomes: ["phased plan", "risk register", "runbook"],
    examples: [
      "Monolith → services migration.",
      "Database upgrade with rollback plan.",
      "Shader pipeline modernization plan."
    ]
  },
  {
    name: "incident-postmortem",
    description: "Collect evidence, analyze causes, and produce an actionable report.",
    suitedAgents: ["dev-infrastructure", "data-analyst-debugger"],
    recommendedTools: ["analyzeData", "summarize"],
    outcomes: ["timeline", "root-cause", "action items"],
    examples: [
      "Failed build pipeline root-cause analysis.",
      "XR performance regression investigation.",
      "Outage postmortem with follow-ups."
    ]
  },
  {
    name: "adaptive-discovery-to-decision",
    description:
      "Start with broad exploration, then narrow down and decide using different orchestration styles.",
    suitedAgents: ["strategy", "knowledge-insight"],
    recommendedTools: [
      "coordinate_agents",
      "read_knowledge",
      "aggregate_results",
      "evaluate_content",
      "generate_content"
    ],
    outcomes: [
      "exploration notes",
      "shortlisted options",
      "final recommendation"
    ],
    examples: [
      "Explore a topic widely, then shift into evaluation and choice.",
      "Begin with many ideas, then move to structured comparison.",
      "Use different modes as the problem moves from vague to specific."
    ]
  },
  {
    name: "adaptive-workflow-runner",
    description:
      "Choose between pipeline, parallel, or centralised handling depending on the task type.",
    suitedAgents: ["personal-workflow-assistant", "dev-infrastructure"],
    recommendedTools: [
      "coordinate_agents",
      "run_batch_jobs",
      "schedule_tasks",
      "write_knowledge",
      "notify_channel"
    ],
    outcomes: [
      "completed tasks routed by best pattern",
      "log of which approach was used",
      "simple performance/effort notes"
    ],
    examples: [
      "Handle small tasks sequentially and big sets concurrently.",
      "Switch between direct execution and delegated runs.",
      "Record which mode worked better for a given run."
    ]
  },
  {
    name: "adaptive-learning-loop",
    description:
      "Adjust orchestration based on feedback and outcomes over repeated runs.",
    suitedAgents: ["educational", "strategy", "data-analyst-debugger"],
    recommendedTools: [
      "manage_memory",
      "evaluate_content",
      "coordinate_agents",
      "read_knowledge",
      "write_knowledge"
    ],
    outcomes: [
      "history of runs with feedback",
      "updated preferences or settings",
      "improved behaviour over time"
    ],
    examples: [
      "Change how a recurring process is run based on results.",
      "Adapt goal handling as usage patterns become clearer.",
      "Store learnings about which approaches perform better."
    ]
  }
];

