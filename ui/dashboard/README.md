Soggy Starter Agents Dashboard (Astro)

Overview
- Astro + TypeScript dashboard inspired by the Valorant UI reference.
- Shows 8 agent-type cards; each links to a placeholder “Create Agent” page.
- Styling uses vanilla CSS with CSS variables; no Tailwind required.

Getting Started
1) cd ui/dashboard && npm install
2) npm install
3) npm run dev
4) Visit http://localhost:4321

Structure
- src/pages/index.astro: main dashboard
- src/pages/agents/[type]/new.astro: “Create Agent” placeholder
- src/components/*: UI pieces (sidebar, hero, cards, right panel)
- src/data/agentTypes.ts: 8 agent type definitions

Next Steps
- Wire “Create” actions to call your backend generator (e.g., POST to an internal endpoint that runs `scripts/new-agent.ts`).
- Replace sample right-panel data with API-driven metrics.
- Optionally integrate your Supabase anon client in `ui/lib` if needed for auth/session.

