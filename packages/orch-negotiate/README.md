# NegotiateOrch

A decentralized model where agents bid or negotiate to handle tasks.

**Core Idea:** The best-suited agent wins dynamically, optimizing quality and cost.

**Use Cases**
- Procurement automation
- Multi-LLM task routing by confidence/cost
- Distributed compute job bidding

**Example**
```ts
import { NegotiateOrch } from "packages";

await NegotiateOrch.run(
  { goal: "Summarize document" },
  [ClaudeAgent, GPTAgent, GeminiAgent]
);
```

