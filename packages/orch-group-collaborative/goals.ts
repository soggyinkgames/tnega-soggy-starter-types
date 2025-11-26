export const goals = [
  {
    name: "brainstorm-proposal",
    description: "Generate multiple creative options and converge on the strongest.",
    suitedAgents: ["creative-generation", "strategy"],
    recommendedTools: ["generateContent", "combineIdeas", "summarize"],
    outcomes: ["concept gallery", "shortlist & rationale"],
    examples: [
      "Campaign concepts across three audiences.",
      "Narrative hooks and taglines for a trailer.",
      "Visual moodboards with rationale text."
    ]
  },
  {
    name: "creative-brief",
    description: "Draft a clear brief with objectives, tone, target, and deliverables.",
    suitedAgents: ["creative-generation", "strategy"],
    recommendedTools: ["generateContent", "summarize"],
    outcomes: ["brief document", "acceptance criteria"],
    examples: [
      "Video brief for a 60s product spot.",
      "Landing page copy brief with sections.",
      "Character concept pack brief for artists."
    ]
  },
  {
    name: "collaborative-brainstorm",
    description:
      "Multiple agents freely brainstorm around a prompt and cluster ideas into themes.",
    suitedAgents: ["creative-generation", "strategy"],
    recommendedTools: [
      "generate_content",
      "aggregate_results",
      "coordinate_agents"
    ],
    outcomes: [
      "raw idea list",
      "grouped themes",
      "highlighted top ideas"
    ],
    examples: [
      "Explore many angles on a new concept.",
      "Collect diverse suggestions and group related ones.",
      "Surface the strongest themes from a brainstorm."
    ]
  },
  {
    name: "co-authored-outline",
    description:
      "Agents co-create an outline by proposing sections and refining structure together.",
    suitedAgents: ["creative-generation", "educational"],
    recommendedTools: [
      "generate_content",
      "evaluate_content",
      "coordinate_agents"
    ],
    outcomes: [
      "jointly created outline",
      "section notes",
      "list of open questions"
    ],
    examples: [
      "Design a shared outline for a longer document.",
      "Co-create a lesson outline with different teaching angles.",
      "Collaboratively decide sections for a guide or spec."
    ]
  },
  {
    name: "role-based-collaboration",
    description:
      "Each agent takes a role (e.g. critic, explainer, creator) and they work together towards a shared artifact.",
    suitedAgents: ["creative-generation", "educational", "strategy"],
    recommendedTools: [
      "generate_content",
      "evaluate_content",
      "coordinate_agents",
      "manage_memory"
    ],
    outcomes: [
      "artifact with multi-role input",
      "notes from different roles",
      "final agreed version"
    ],
    examples: [
      "Have one agent propose, another critique, another revise.",
      "Combine different perspective roles into a shared output.",
      "Maintain a record of what each role contributed."
    ]
  }
];

