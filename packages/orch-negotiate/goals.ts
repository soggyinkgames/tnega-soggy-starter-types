export const goals = [
  {
    name: "vendor-comparison",
    description: "Agents debate vendors along criteria and converge on a choice.",
    suitedAgents: ["strategy", "data-analyst-debugger"],
    recommendedTools: ["analyzeData", "summarize"],
    outcomes: ["scorecard", "consensus recommendation"],
    examples: [
      "Choose cloud provider for a new workload.",
      "Select LMS vendor for school rollout.",
      "Pick video hosting for streaming."
    ]
  },
  {
    name: "design-tradeoffs",
    description: "Explore tradeoffs in architecture and resolve conflicts.",
    suitedAgents: ["strategy", "dev-infrastructure"],
    recommendedTools: ["analyzeData", "formatReport"],
    outcomes: ["tradeoff matrix", "decision summary"],
    examples: [
      "URP vs HDRP pipeline selection.",
      "Postgres vs managed vector store.",
      "Serverless vs containerized runtime."
    ]
  },
  {
    name: "argument-balanced-summary",
    description:
      "Multiple agents propose viewpoints; a negotiation process balances them into one summary.",
    suitedAgents: ["strategy", "knowledge-insight"],
    recommendedTools: [
      "generate_content",
      "evaluate_content",
      "coordinate_agents",
      "aggregate_results"
    ],
    outcomes: [
      "summary with multiple perspectives",
      "list of main points and counterpoints",
      "conclusion or recommendation"
    ],
    examples: [
      "Summarise pros and cons of a decision.",
      "Combine opposing opinions into a balanced write-up.",
      "Present different angles on a topic and then reconcile them."
    ]
  },
  {
    name: "option-debate-and-choice",
    description:
      "Agents defend different options; a referee chooses or blends the best elements.",
    suitedAgents: ["strategy", "creative-generation"],
    recommendedTools: [
      "generate_content",
      "evaluate_content",
      "coordinate_agents"
    ],
    outcomes: [
      "debate log or notes",
      "chosen option or hybrid",
      "rationale for choice"
    ],
    examples: [
      "Have agents argue for different high-level directions.",
      "Let different solution proposals compete with justification.",
      "Blend strong aspects from multiple options."
    ]
  },
  {
    name: "criteria-driven-ranking",
    description:
      "Agents score options using shared criteria, then negotiate a final ranking.",
    suitedAgents: ["strategy", "data-analyst-debugger"],
    recommendedTools: [
      "evaluate_content",
      "aggregate_results",
      "coordinate_agents"
    ],
    outcomes: [
      "scored option list",
      "final ranking",
      "explanation of scoring"
    ],
    examples: [
      "Rank candidate ideas against simple criteria.",
      "Score options with separate agents for each criterion.",
      "Produce a ranked list with justifications."
    ]
  }
];

