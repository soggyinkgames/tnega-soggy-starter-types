# SharedMemoryOrch

Agents communicate through shared memory to collaborate asynchronously.

**Core Idea:** Encourages flexible cooperation without tight coupling.

**Use Cases**
- Cross-department dashboards
- Creative co-writing on shared drafts
- Live analytics aggregation

**Example**
```ts
import { SharedMemoryOrch } from "packages";

await SharedMemoryOrch.run(
  { goal: "Q4 Summary" },
  [SalesAgent, AnalyticsAgent, ProductAgent]
);
```

