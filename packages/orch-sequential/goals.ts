export const goals = [
  {
    name: "onboarding-checklist",
    description: "Create and execute a stepwise onboarding plan.",
    suitedAgents: ["personal-workflow-assistant", "dev-infrastructure"],
    recommendedTools: ["summarize", "scheduleEvents", "notifyUser"],
    outcomes: ["task list", "calendar entries"],
    examples: [
      "New hire onboarding with day-by-day steps.",
      "Tool installation checklist with links.",
      "Project kick-off tasks with owners."
    ]
  },
  {
    name: "stepwise-execution",
    description: "Execute a plan as a deterministic chain of steps.",
    suitedAgents: ["personal-workflow-assistant"],
    recommendedTools: ["summarize", "formatReport"],
    outcomes: ["execution log", "summary report"],
    examples: [
      "Content publishing pipeline checklist.",
      "Release checklist for a Unity build.",
      "QA pass with recorded outcomes."
    ]
  },
  {
    name: "data-clean-analyse-report",
    description:
      "Process input data through a fixed pipeline: clean, analyse, then report.",
    suitedAgents: ["data-analyst-debugger"],
    recommendedTools: [
      "run_batch_jobs",
      "read_knowledge",
      "generate_content",
      "evaluate_content"
    ],
    outcomes: [
      "cleaned dataset description",
      "key metrics or findings",
      "simple written report"
    ],
    examples: [
      "Take noisy tabular data, clean it, and summarise results.",
      "Run a fixed series of checks and then generate a short report.",
      "Perform a basic analysis pipeline on repeated inputs."
    ]
  },
  {
    name: "draft-refine-polish",
    description:
      "Generate an initial draft, then refine it through sequential improvement stages.",
    suitedAgents: ["creative-generation", "educational"],
    recommendedTools: [
      "generate_content",
      "evaluate_content"
    ],
    outcomes: [
      "initial draft",
      "refined version",
      "final polished output"
    ],
    examples: [
      "Produce a rough text, then tighten and polish it in steps.",
      "Draft exercises, then refine instructions and wording.",
      "Create a multi-pass edit flow for any written content."
    ]
  },
  {
    name: "plan-execute-summarise",
    description:
      "Plan steps, execute them in order, and produce a final summary at the end.",
    suitedAgents: ["personal-workflow-assistant", "strategy"],
    recommendedTools: [
      "generate_content",
      "schedule_tasks",
      "write_knowledge"
    ],
    outcomes: [
      "ordered action list",
      "execution notes",
      "run summary"
    ],
    examples: [
      "Plan a series of small tasks, record what happened, then summarise.",
      "Guide a user through a multi-step process and recap the outcome.",
      "Execute a simple playbook and store what was done."
    ]
  }
];

