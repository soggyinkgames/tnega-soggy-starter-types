export type AgentType = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  accent?: string;
};

export const agentTypes: AgentType[] = [
  { slug: '1-knowledge-insight', title: 'Knowledge Insight', description: 'RAG-first researcher with citations.', emoji: '📚', accent: '#7b61ff' },
  { slug: '2-strategy', title: 'Strategy', description: 'Planner that breaks down complex goals.', emoji: '🧭', accent: '#22d3ee' },
  { slug: '3-creative-generation', title: 'Creative Generation', description: 'Generate content, images, and ideas.', emoji: '🎨', accent: '#ff6ad5' },
  { slug: '4-personal-workflow-assistant', title: 'Personal Workflow', description: 'Automate personal routines and tasks.', emoji: '🗂️', accent: '#34d399' },
  { slug: '5-data-analyst-debugger', title: 'Data Analyst & Debugger', description: 'Analyze logs and datasets for insight.', emoji: '🧪', accent: '#a78bfa' },
  { slug: '6-simulation-scenario', title: 'Simulation Scenario', description: 'Run what-if scenarios and sims.', emoji: '🧪', accent: '#f59e0b' },
  { slug: '7-educational', title: 'Educational', description: 'Tutors and guided learning flows.', emoji: '🎓', accent: '#60a5fa' },
  { slug: '8-dev-infrastructure', title: 'Dev Infrastructure', description: 'DX helpers, CI/CD, and scaffolds.', emoji: '🛠️', accent: '#10b981' },
];

