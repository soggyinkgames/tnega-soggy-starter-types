# SequentialOrch

Executes agents one by one, passing each output as the next input.

**Core Idea:** Ideal for pipelines or ordered dependencies.

**Use Cases**
- Content creation (Research → Write → Edit)
- ETL pipelines
- Hiring workflow (Parse → Screen → Schedule)

**Example**
```ts
import { SequentialOrch } from "packages";

await SequentialOrch.run(
  { goal: "Produce blog post" },
  [ResearchAgent, WriterAgent, EditorAgent]
);
```

## currently does three main things.

It defines the sequential runtime loop in packages/orch-sequential/index.ts (line 1): run agents in order, pass each output into the next agent, capture history, and keep going even if one agent errors.

It owns the sequential tooling contract in packages/orch-sequential/tools.ts (line 1): for creative-generation agents it derives tool collections from stable config like inputKinds and outputTargets, resolves those collections into concrete tool ids, and validates that the selected tools stay inside the agent’s declared requiredTools.

It also exposes the sequential path’s user-facing creative goals in packages/orch-sequential/tools.ts (line 157): it turns template specializations like line-art and music into goal variations that new-agent can show, and recommends the corresponding tools for that path.

Short version:

runs agents in order
injects orchestration runtime context
selects and validates sequential tools
exposes sequential-specific goal variations for scaffolding

