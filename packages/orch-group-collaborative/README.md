# GroupCollaborativeOrch

Agents collaborate through dialogue, exchanging ideas and building consensus.

**Core Idea:** Enables emergent creativity and collective reasoning.

**Use Cases**
- Brainstorming sessions
- Legal or policy deliberation
- Research synthesis

**Example**
```ts
import { GroupCollaborativeOrch } from "packages";

await GroupCollaborativeOrch.run(
  { prompt: "New brand strategy" },
  [DesignAgent, CopyAgent, StrategyAgent]
);
```

