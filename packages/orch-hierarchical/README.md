# HierarchicalOrch

A layered orchestration model where managers supervise workers.

**Core Idea:** Enables large systems to scale through multiple coordination layers.

**Use Cases**
- Global operations (HQ → regional → local)
- Research hierarchy (Director → Analysts → Collectors)
- Multi-department projects (Program Manager → Team Leads → Contributors)

**Example**
```ts
import { HierarchicalOrch } from "packages";

await HierarchicalOrch.run(
  { goal: "Launch product" },
  [ProgramManager, TeamLead, Engineer]
);
```

