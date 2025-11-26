export const goals = [
  {
    name: "plan-flight-itinerary",
    description: "Collaboratively gather routes, constraints, and costs to build an itinerary.",
    suitedAgents: ["knowledge-insight", "strategy", "creative-generation", "personal-workflow-assistant"],
    recommendedTools: ["queryKnowledgeBase", "analyzeData", "summarize"],
    outcomes: ["optimized travel route", "budget report", "itinerary summary"],
    examples: [
      "Sydney → Tokyo → Seoul multi-city itinerary with layovers.",
      "Budget planning for flights + accommodation tiers.",
      "Value comparison: shortest time vs. lowest cost."
    ]
  },
  {
    name: "collaborative-research",
    description: "Aggregate sources, synthesize insights, and share a common cache.",
    suitedAgents: ["knowledge-insight", "educational"],
    recommendedTools: ["queryKnowledgeBase", "vectorSearch", "summarize"],
    outcomes: ["source synthesis", "evidence-backed report"],
    examples: [
      "Summarize papers into a unified brief.",
      "Market scan of competitors with citations.",
      "Tech landscape overview with pros/cons."
    ]
  },
  {
    name: "living-knowledge-base",
    description:
      "Multiple agents continuously enrich and refactor a shared knowledge space.",
    suitedAgents: ["knowledge-insight", "educational"],
    recommendedTools: [
      "read_knowledge",
      "write_knowledge",
      "manage_memory"
    ],
    outcomes: [
      "updated knowledge entries",
      "improved structure or links",
      "change log of updates"
    ],
    examples: [
      "Merge new notes into existing topics.",
      "Clean up and restructure shared knowledge entries.",
      "Maintain a shared glossary or concept map."
    ]
  },
  {
    name: "stateful-collab-notes",
    description:
      "Agents work together in a shared memory to maintain evolving notes over multiple sessions.",
    suitedAgents: ["personal-workflow-assistant", "educational"],
    recommendedTools: [
      "manage_memory",
      "read_knowledge",
      "write_knowledge"
    ],
    outcomes: [
      "running session notes",
      "highlighted decisions and open questions",
      "compact recap for next session"
    ],
    examples: [
      "Keep an evolving set of notes for recurring meetings.",
      "Maintain a continuous study log over time.",
      "Build a running notebook for an ongoing investigation."
    ]
  },
  {
    name: "memory-aware-assistant",
    description:
      "Use shared memory as context so agents respond consistently over time.",
    suitedAgents: ["personal-workflow-assistant", "strategy"],
    recommendedTools: [
      "manage_memory",
      "read_knowledge",
      "write_knowledge",
      "generate_content"
    ],
    outcomes: [
      "contextual replies that reflect history",
      "stored preferences",
      "summary snapshots of long runs"
    ],
    examples: [
      "Recall user preferences when answering new questions.",
      "Maintain context for a long-running support thread.",
      "Summarise prior sessions and reuse that summary."
    ]
  }
];

