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

