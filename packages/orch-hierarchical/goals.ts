export const goals = [
  {
    name: "build-buyer-quote",
    description: "Assemble a detailed cost proposal with rationale and deliverables.",
    suitedAgents: ["strategy", "data-analyst-debugger", "creative-generation", "dev-infrastructure"],
    recommendedTools: ["analyzeData", "summarize", "generateContent", "formatReport"],
    outcomes: ["pricing report", "narrative proposal", "exported PDF"],
    examples: [
      "Quote for hardware/materials including logistics and contingencies.",
      "Custom game development estimate with phases and milestones.",
      "Consulting service tiers with scope, assumptions, and timelines."
    ]
  },
  {
    name: "evaluate-investment-value",
    description: "Compare alternatives and compute ROI to recommend the best option.",
    suitedAgents: ["strategy", "data-analyst-debugger", "educational"],
    recommendedTools: ["analyzeData", "formatReport", "summarize"],
    outcomes: ["ROI matrix", "recommendation report"],
    examples: [
      "Assess ROI of upgrading GPUs or cloud instances.",
      "Estimate benefits of staff training or certifications.",
      "Compare tooling subscriptions by cost vs. productivity."
    ]
  },
  {
    name: "strategic-planning",
    description: "Decompose long-term objectives into milestones and risks.",
    suitedAgents: ["strategy", "dev-infrastructure"],
    recommendedTools: ["analyzeData", "summarize", "planSubtasks"],
    outcomes: ["structured plan", "timeline roadmap"],
    examples: [
      "Quarterly roadmap for a product team.",
      "Architecture migration plan with milestones.",
      "Studio content plan across multiple channels."
    ]
  },
  {
    name: "supervised-research-pack",
    description:
      "A supervisor agent defines questions and delegates focused research tasks to specialists.",
    suitedAgents: ["knowledge-insight", "strategy"],
    recommendedTools: [
      "coordinate_agents",
      "read_knowledge",
      "aggregate_results",
      "generate_content"
    ],
    outcomes: [
      "multi-section research pack",
      "per-section findings",
      "top-level summary"
    ],
    examples: [
      "Split a topic into sub-areas and assign each to a specialist.",
      "Collect separate findings and merge into a structured pack.",
      "Provide both detailed notes and a supervisor summary."
    ]
  },
  {
    name: "tiered-review-pipeline",
    description:
      "Specialist agents create or analyse content and supervisor agents review and approve.",
    suitedAgents: ["creative-generation", "educational", "data-analyst-debugger"],
    recommendedTools: [
      "generate_content",
      "evaluate_content",
      "coordinate_agents",
      "write_knowledge"
    ],
    outcomes: [
      "initial drafts or analyses",
      "review comments",
      "final approved version"
    ],
    examples: [
      "Draft content at one level, review at higher level.",
      "Produce analysis summaries with a separate reviewer.",
      "Refine items through two or more review stages."
    ]
  },
  {
    name: "layered-decision-support",
    description:
      "Lower-level agents aggregate raw signals; higher-level agents synthesize and advise.",
    suitedAgents: ["strategy", "data-analyst-debugger"],
    recommendedTools: [
      "read_knowledge",
      "aggregate_results",
      "evaluate_content",
      "coordinate_agents"
    ],
    outcomes: [
      "raw signal summaries",
      "layered synthesis",
      "advisor-style recommendation"
    ],
    examples: [
      "Summarise multiple inputs then offer a clear suggestion.",
      "Use subordinate agents to collect metrics and a top agent to interpret them.",
      "Produce both base numbers and top-level implications."
    ]
  }
];

