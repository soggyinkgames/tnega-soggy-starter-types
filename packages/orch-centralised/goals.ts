export const goals = [  
  {
    name: "central-briefing",
    description:
      "One owner agent gathers information from multiple sources and produces a single brief.",
    suitedAgents: ["strategy", "knowledge-insight"],
    capabilities: [
      "read_knowledge",
      "aggregate_results",
      "generate_content"
    ],
    outcomes: [
      "short briefing document",
      "key points list",
      "suggested next actions"
    ],
    examples: [
      "Create a one-page update from many reports.",
      "Summarise activity across several workstreams into one brief.",
      "Give a condensed overview of a topic using multiple documents."
    ]
  },
  {
    name: "central-roadmap",
    description:
      "Turn high-level goals into a coordinated roadmap and delegated tasks managed by one owner.",
    suitedAgents: ["strategy", "personal-workflow-assistant"],
    capabilities: [
      "generate_content",
      "write_knowledge",
      "schedule_tasks"
    ],
    outcomes: [
      "goal-to-task breakdown",
      "prioritised roadmap",
      "task schedule"
    ],
    examples: [
      "Break a quarterly objective into milestones and tasks.",
      "Turn a loose idea into a sequenced work plan.",
      "Create a roadmap grouping related tasks into phases."
    ]
  },
  {
    name: "central-content-gate",
    description:
      "Route generated content through a single gatekeeper that enforces style, policy, and quality rules.",
    suitedAgents: ["creative-generation", "educational"],
    capabilities: [
      "evaluate_content",
      "generate_content",
      "write_knowledge"
    ],
    outcomes: [
      "approved content set",
      "rejected items list with reasons",
      "clean reusable content blocks"
    ],
    examples: [
      "Check drafts for tone and structure before publishing.",
      "Normalise learning materials to a shared format.",
      "Filter generated texts against basic quality rules."
    ]
  },
  {
    name: "central-policy-gate",
    description:
      "Check proposed changes or actions against shared policies before deciding to approve or reject.",
    suitedAgents: ["strategy", "dev-infrastructure", "data-analyst-debugger"],
    capabilities: [
      "read_knowledge",
      "evaluate_content",
      "write_knowledge",
      "notify_channel"
    ],
    outcomes: [
      "policy-check result",
      "approved / rejected decision",
      "audit note explaining why"
    ],
    examples: [
      "Review a configuration change against rules.",
      "Evaluate a generic request against constraints.",
      "Record decisions with simple justification text."
    ]
  },
  {
    name: "central-router",
    description:
      "Expose a single entry-point agent that routes work across multiple tools while keeping one unified experience.",
    suitedAgents: ["personal-workflow-assistant", "dev-infrastructure"],
    capabilities: [
      "read_knowledge",
      "write_knowledge",
      "sync_ticketing",
      "notify_channel"
    ],
    outcomes: [
      "completed multi-step workflows",
      "log of actions across systems",
      "summary of what changed"
    ],
    examples: [
      "Use one chat to create/update records in different tools.",
      "Trigger a standard workflow that touches several systems.",
      "Record a run log for all actions taken on a request."
    ]
  },
  {
    name: "project-plan",
    description:
      "Coordinate inputs from multiple domains into one coherent roadmap and task breakdown.",
    suitedAgents: ["strategy", "personal-workflow-assistant", "dev-infrastructure"],
    recommendedTools: [
      "gatherRequirements",
      "generatePlan",
      "estimateEffort",
      "createTaskList"
    ],
    outcomes: [
      "milestone roadmap",
      "task backlog",
      "dependency map"
    ],
    examples: [
      "Plan a 6-month VR training production schedule.",
      "Plan refactor + infra upgrades around a release window.",
      "Draft a roadmap for launching an AI agent product."
    ]
  },
  //   name: "single-owner-briefing",
  //   description:
  //     "One owner agent gathers information from many sources and delivers a concise brief.",
  //   suitedAgents: ["strategy", "knowledge-insight", "personal-workflow-assistant"],
  //   recommendedTools: [
  //     "searchKnowledge",      // internal + external search
  //     "fetchDataSource",      // APIs, DBs, CRMs etc.
  //     "summarize",
  //     "rankIssues",
  //     "formatBrief"
  //   ],
  //   outcomes: [
  //     "executive summary",
  //     "key risks & opportunities list",
  //     "recommended next actions"
  //   ],
  //   examples: [
  //     "Daily company health brief from multiple systems.",
  //     "Market/competitor snapshot for a leadership meeting.",
  //     "Account brief before a client call."
  //   ]
  // },
  // {
  //   name: "multi-team-coordination",
  //   description:
  //     "Turn high-level objectives into coordinated tasks across teams, tools, and timelines.",
  //   suitedAgents: ["strategy", "dev-infrastructure", "personal-workflow-assistant"],
  //   recommendedTools: [
  //     "captureRequirements",
  //     "generateTaskGraph",
  //     "syncIssueTracker",      // Jira, Linear, Trello, etc.
  //     "scheduleTasks",
  //     "updateStatus",
  //     "notifyChannel"
  //   ],
  //   outcomes: [
  //     "shared roadmap",
  //     "cross-team task list",
  //     "status dashboard snapshot"
  //   ],
  //   examples: [
  //     "Coordinate a product launch across product, marketing, and support.",
  //     "Plan and track a migration involving infra + app teams.",
  //     "Align multiple squads on a shared quarterly objective."
  //   ]
  // },
  // {
  //   name: "governed-content-pipeline",
  //   description:
  //     "Ensure all generated content flows through a single owner that enforces brand, legal, and quality rules.",
  //   suitedAgents: ["creative-generation", "educational", "strategy"],
  //   recommendedTools: [
  //     "generateDraft",
  //     "applyStyleGuide",
  //     "checkCompliance",       // policy / legal / regulatory checks
  //     "deduplicateContent",
  //     "assembleDocument",
  //     "versionControl"
  //   ],
  //   outcomes: [
  //     "approved content package",
  //     "change log",
  //     "reusable content blocks"
  //   ],
  //   examples: [
  //     "Central review of marketing copy from multiple generators.",
  //     "Create learning materials that follow a shared template.",
  //     "Produce customer-facing FAQs combining inputs from several teams."
  //   ]
  // },
  // {
  //   name: "policy-and-control-hub",
  //   description:
  //     "Act as the central gatekeeper that validates changes and decisions against shared policies.",
  //   suitedAgents: ["dev-infrastructure", "strategy", "data-analyst-debugger"],
  //   recommendedTools: [
  //     "readConfig",
  //     "validatePolicy",
  //     "simulateImpact",
  //     "approveChange",
  //     "logDecision",
  //     "notifyChannel"
  //   ],
  //   outcomes: [
  //     "policy-compliance report",
  //     "approved/rejected change set",
  //     "audit trail of decisions"
  //   ],
  //   examples: [
  //     "Gate configuration changes before deployment.",
  //     "Approve discount or pricing changes within set rules.",
  //     "Review and approve access-control updates across systems."
  //   ]
  // },
  // {
  //   name: "cross-system-orchestrator",
  //   description:
  //     "Expose a single entry-point agent that routes work to many backend tools and services while keeping the experience coherent.",
  //   suitedAgents: ["personal-workflow-assistant", "dev-infrastructure"],
  //   recommendedTools: [
  //     "routeTask",
  //     "callIntegration",       // CRM, ticketing, file storage, etc.
  //     "transformPayload",
  //     "logActivity",
  //     "summarizeRun"
  //   ],
  //   outcomes: [
  //     "unified interaction log",
  //     "completed multi-system workflows",
  //     "human-readable run summary"
  //   ],
  //   examples: [
  //     "A 'front door' agent that can update tickets, send emails, and create docs.",
  //     "Ops console agent that runs playbooks across several internal tools.",
  //     "Single chat entry point for staff to trigger complex internal workflows."
  //   ]
  // }
];

    // recommendedTools: [
    //   "searchDocs",
    //   "summarize",
    //   "generateOptions",
    //   "compareOptions",
    //   "prioritize"
    //   "explainTopic",
    //   "generateQuiz",
    //   "trackLearnerProgress",
    //   "summarizeSession"
    //   "runChecks",
    //   "collectCiResults",
    //   "gateRelease",
    //   "notifyChannel"
    //   "captureGoal",
    //   "breakDownTasks",
    //   "scheduleTasks",
    //   "trackProgress",
    //   "analyzeLearnerProfile",
    //   "generateContent",
    //   "mapObjectives"
    //   "gatherRequirements",
    //   "generatePlan",
    //   "estimateEffort",
    //   "createTaskList"
      // "searchKnowledge",
      // "fetchDataSource",
      // "rankIssues",
      // "formatBrief"
      // "captureRequirements",
      // "generateTaskGraph",
      // "syncIssueTracker",
      // "updateStatus",
      // "generateDraft",
      // "applyStyleGuide",
      // "checkCompliance",       // policy / legal / regulatory checks
      // "deduplicateContent",
      // "assembleDocument",
      // "versionControl"
      
      // "captureRequirements",
      // "generateTaskGraph",
      // "syncIssueTracker",      // Jira, Linear, Trello, etc.
      // "scheduleTasks",
      // "updateStatus",
      // "notifyChannel"
      // "routeTask",
      // "callIntegration",       // CRM, ticketing, file storage, etc.
      // "transformPayload",
      // "logActivity",
      // "summarizeRun"
    // ],

