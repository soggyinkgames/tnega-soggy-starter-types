export type AgentType = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  accent?: string;
  image?: string;
};

export const agentTypes: AgentType[] = [
  { slug: '1-knowledge-insight', title: 'Knowledge Insight', description: 'RAG-first researcher with citations.', emoji: '📚', accent: '#7b61ff', image: '/agents/1-knowledge-insight.svg' },
  { slug: '2-strategy', title: 'Strategy', description: 'Planner that breaks down complex goals.', emoji: '🧭', accent: '#22d3ee', image: '/agents/2-strategy.svg' },
  { slug: '3-creative-generation', title: 'Creative Generation', description: 'Generate content, images, and ideas.', emoji: '🎨', accent: '#ff6ad5', image: '/agents/3-creative-generation.svg' },
  { slug: '4-personal-workflow-assistant', title: 'Personal Workflow', description: 'Automate personal routines and tasks.', emoji: '🗂️', accent: '#34d399', image: '/agents/4-personal-workflow-assistant.svg' },
  { slug: '5-data-analyst-debugger', title: 'Data Analyst & Debugger', description: 'Analyze logs and datasets for insight.', emoji: '🧪', accent: '#a78bfa', image: '/agents/5-data-analyst-debugger.svg' },
  { slug: '6-simulation-scenario', title: 'Simulation Scenario', description: 'Run what-if scenarios and sims.', emoji: '🧪', accent: '#f59e0b', image: '/agents/6-simulation-scenario.svg' },
  { slug: '7-educational', title: 'Educational', description: 'Tutors and guided learning flows.', emoji: '🎓', accent: '#60a5fa', image: '/agents/7-educational.svg' },
  { slug: '8-dev-infrastructure', title: 'Dev Infrastructure', description: 'DX helpers, CI/CD, and scaffolds.', emoji: '🛠️', accent: '#10b981', image: '/agents/8-dev-infrastructure.svg' },
];
