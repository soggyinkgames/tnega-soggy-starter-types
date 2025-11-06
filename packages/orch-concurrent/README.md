# ConcurrentOrch

Runs multiple agents in parallel and merges results when complete.

**Core Idea:** High throughput orchestration for independent subtasks.

**Use Cases**
- Data retrieval across APIs
- Market analysis
- Bulk document processing

**Example**
```ts
import { ConcurrentOrch } from "packages";

await ConcurrentOrch.run(
  { goal: "Aggregate reviews" },
  [TwitterAgent, RedditAgent, SurveyAgent]
);
```

