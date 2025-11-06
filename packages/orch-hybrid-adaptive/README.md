# HybridAdaptiveOrch

A dynamic orchestrator that adapts between coordination strategies based on context or performance.

**Core Idea:** Adaptive orchestration selects the optimal style automatically.

**Use Cases**
- Enterprise systems adapting to workload
- Adaptive AI assistants
- Game AI balancing control and autonomy

**Example**
```ts
import { HybridAdaptiveOrch } from "packages";

await HybridAdaptiveOrch.run(
  { goal: "Optimize roadmap" },
  [StrategyAgent, FinanceAgent, MarketAgent]
);
```

