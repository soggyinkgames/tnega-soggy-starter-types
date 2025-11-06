# CentralisedOrch

A single orchestrator manages all agents, delegating tasks and merging their results.

**Core Idea:** Centralised control ensures predictable execution and traceable output.

**Use Cases**
- Customer support routing (delegates tickets)
- Financial reporting (aggregates data agents)
- Marketing campaign orchestration (coordinates content, design, analytics)

**Example**
```ts
import { CentralisedOrch } from "packages";

await CentralisedOrch.run(
  { goal: "Generate campaign report" },
  [CopyAgent, DesignAgent, AnalyticsAgent]
);
```

