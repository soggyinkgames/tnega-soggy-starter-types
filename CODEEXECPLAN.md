# Unify CLI, Orchestration, Evals, Memory, Tools — with Tests and Examples

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.
If PLANS.md exists in the repo, this plan must be maintained in accordance with it.

## Purpose / Big Picture

After implementing this plan, a developer can:
- Use a single CLI to scaffold and run: agents, orchestrations, eval suites, memory backends, and tool plugins.
- Run observable tests for each collection of work before moving on, with clear pass/fail gates.
- Generate **example agents for all 8 agent types**, wire them to **all 8 orchestration patterns**, and run **evals** that are selected by the orchestration strategy and **memory type**.
- Fine-tune tool plugins per agent, and verify integration via CLI-driven test scenarios.

User-visible behavior:
- You can run a single command to create or run any component:
    - `npm run soggy -- new agent`
    - `npm run soggy -- new orch`
    - `npm run soggy -- new eval`
    - `npm run soggy -- new memory`
    - `npm run soggy -- new tool`
    - `npm run soggy -- test run --type orch --pattern orch-concurrent`
- You will see tabled histories, pass/fail summaries, and JSON artifacts written to `evals/logs/`.

## Progress

- [ ] (YYYY-MM-DD hh:mmZ) Create CLI foundation with subcommands: `new`, `test`, `run`.
- [ ] Add scaffolds for: 8 agent examples, 8 orchestration patterns (already present), eval suites, memory backends, tool plugins.
- [ ] Connect orchestration → eval selection (strategy decides eval type) and orchestration → memory selection.
- [ ] Implement test harness with observable outputs and JSON artifacts.
- [ ] Validate end-to-end on a sample scenario (e.g., “generate pitch deck”).
- [ ] Document outcomes and finalize.

## Surprises & Discoveries

- Observation: …
  Evidence: …

## Decision Log

- Decision: …
  Rationale: …
  Date/Author: …

## Outcomes & Retrospective

Summarize results, gaps, and lessons learned at completion.

## Context and Orientation

Repo areas relevant to this plan:

    /agents/                       eight agent-type templates will live here:
      1-knowledge-insight/
      2-strategy/
      3-creative-generation/
      4-personal-workflow-assistant/
      5-data-analyst-debugger/
      6-simulation-scenario/
      7-educational/
      8-dev-infrastructure/

    /packages/
      orch-centralised/
      orch-hierarchical/
      orch-shared-memory/
      orch-negotiate/
      orch-concurrent/
      orch-sequential/
      orch-group-collaborative/
      orch-hybrid-adaptive/
      types.ts                     OrchestrationPattern, Agent, HistoryEntry, OrchestrationResult

    /evals/
      basic/
      model-graded/
      system/
      logs/                        JSON artifacts written here
      types.ts                     EvalSuite interface

    /memory/
      mem-inmemory/
      mem-redis/
      mem-supabase/
      types.ts                     Memory interface: getSession, saveSession, appendLongTerm

    /tools/
      search/
      codegen/
      vision/
      types.ts                     Tool interface: name, run(spec, ctx)

    /cli/
      index.ts                     entry (bin)
      commands/
        new.ts
        test.ts
        run.ts
        helpers/
          discover.ts              scans filesystem for agents/orchs/evals/memory/tools
          io.ts                    table/pretty-print/json emit
          load.ts                  dynamic import by id

Glossary (project-local):
- “Agent type”: one of the 8 roles above; each implements `run(input, ctx)` and may implement `respond`, `propose`.
- “Orchestration pattern”: one of the `orch-*` packages; each exports `*Orch` implementing `OrchestrationPattern`.
- “Eval suite”: pluggable runner that scores results; chosen by orchestration strategy or CLI flag.
- “Memory type”: pluggable persistence used by agents and orch for context and history (in-memory, Redis, Supabase).
- “Tool plugin”: capability invoked by agents (e.g., search, codegen); registered in `/tools`.

## Plan of Work

1) Create a single CLI entry that exposes “new”, “test”, and “run”.
   - File: `/cli/index.ts` exports a `main(argv)`; wire npm script `npm run soggy -- <args>`.
   - Subcommands in `/cli/commands/`:
     - `new.ts` → interactive scaffolder for agent/orch/eval/memory/tool.
     - `test.ts` → executes tests for any of the above, with pass/fail gates and JSON artifacts.
     - `run.ts` → executes a scenario (task JSON) through chosen agent/orchestration with chosen eval+memory.

2) Scaffolds for all 8 **agent examples** (minimal but runnable).
   - Each agent example provides:
     - `index.ts` with `id`, `name`, `run(input, ctx)` and optional `respond`, `propose`.
     - A small “tooling” example showing how to call one tool plugin.
   - Provide seed tasks in `/agents/examples/tasks/*.json`.

3) Memory selection is determined by orchestration (default) but overridable via CLI.
   - Map (default):
     - orch-shared-memory → mem-inmemory
     - orch-concurrent / orch-centralised / orch-sequential → mem-redis (if available) else mem-inmemory
     - orch-negotiate / orch-hybrid-adaptive → mem-supabase (if configured) else mem-inmemory
   - This map is centralized in `/cli/commands/helpers/discover.ts`.

4) Eval selection depends on orchestration strategy, with CLI override.
   - Map (default):
     - sequential / centralised → `evals/basic`
     - concurrent → `evals/system` (throughput & error tolerance)
     - negotiate / hybrid-adaptive / group-collaborative → `evals/model-graded` (quality and consensus)
   - Implement `EvalSuite` with `runEvalSuite(task, result, context) -> { scores, pass, notes }`.

5) Tool plugins fine-tuning.
   - Establish `Tool` interface in `/tools/types.ts`:
       name: string; run(spec: any, ctx: any): Promise<any>
   - Provide at least one tool per example agent (e.g., `tools/search/`, `tools/codegen/`).
   - Agents accept `ctx.tools` and call `await ctx.tools.get('search').run({ query }, ctx)`.

6) Test harness and artifacts.
   - `/cli/commands/test.ts` runs either:
       a) component tests (unit): agents, tools, evals
       b) scenario tests (integration): orch + agents + memory + eval
   - Always emit:
       - terminal table summary
       - JSON artifact to `evals/logs/<timestamp>-<kind>.json`
   - Exit non-zero on failure to gate progress.

7) Minimal backend and placeholder frontend hooks (pre-integration).
   - Backend: expose a file-based or in-memory API endpoint through a small Node script in `/backend/mini.ts` (optional).
   - Frontend: prepare `/frontend/README.md` with how the dashboard will read `evals/logs/` for visualization later.

## Concrete Steps

1. Create CLI entry and npm scripts.

    In package.json (root), add:
      "scripts":
        "soggy": "tsx ./cli/index.ts",
        "orch:test": "tsx ./cli/index.ts test --type orch",
        "agents:test": "tsx ./cli/index.ts test --type agent",
        "evals:test": "tsx ./cli/index.ts test --type eval",
        "tools:test": "tsx ./cli/index.ts test --type tool",
        "memory:test": "tsx ./cli/index.ts test --type memory"

    Create /cli/index.ts with argument parsing (yargs or minimal):
      - parse subcommand: new | test | run
      - delegate to /cli/commands/*.ts

    Create /cli/commands/new.ts:
      - prompt: kind = agent|orch|eval|memory|tool
      - generate from templates in /cli/templates/<kind>/

    Create /cli/commands/test.ts:
      - flags: --type, --pattern, --agent, --eval, --memory, --tool, --scenario
      - load selection via /cli/commands/helpers/discover.ts
      - execute and print a concise table (agentId, status, duration)
      - write JSON artifact to evals/logs/

    Create /cli/commands/run.ts:
      - flags: --pattern orch-*, --eval default|basic|system|model-graded, --memory mem-*, --scenario path/to/task.json
      - run orchestrator with discovered agents and write outputs to evals/logs/

2. Provide agent examples.

    For each agent type under /agents/<folder>/index.ts:
      - export const agent = { id, name, role, run(input, ctx) { … }, respond?(…), propose?(…) }
      - inside run: optionally call a tool via ctx.tools, and return a small transform of input.

    Provide a small set of sample tasks under /agents/examples/tasks/:
      - pitch-deck.json
      - blog-post.json
      - data-clean.json

3. Wire memory backends.

    /memory/types.ts:
      interface Memory {
        getSession(userId: string): Promise<any>;
        saveSession(userId: string, data: any): Promise<void>;
        appendLongTerm(userId: string, summary: string): Promise<void>;
      }

    Implement:
      /memory/mem-inmemory/index.ts
      /memory/mem-redis/index.ts
      /memory/mem-supabase/index.ts
    Ensure CLI `test --type memory` can run minimal CRUD validations.

4. Wire eval suites.

    /evals/types.ts:
      interface EvalSuite {
        id: string;
        name: string;
        runEvalSuite(task: any, result: any, context: any): Promise<{ scores: Record<string, number>, pass: boolean, notes?: string[] }>;
      }

    Implement:
      /evals/basic/index.ts
      /evals/system/index.ts
      /evals/model-graded/index.ts

    In /cli/commands/helpers/discover.ts implement selection maps:
      orch → default eval
      orch → default memory
    Allow CLI overrides with flags.

5. Tools.

    /tools/types.ts:
      interface Tool { name: string; run(spec: any, ctx: any): Promise<any> }

    Implement minimal:
      /tools/search/index.ts  → returns mock hits
      /tools/codegen/index.ts → returns stub code block

    Ensure `agents:test` invokes at least one tool call and asserts returned shape.

6. Test harness behavior (observable).

    Run examples:
      npm run soggy -- test run --type orch --pattern orch-concurrent
    Expect:
      prints a table (agentId, status, duration)
      writes evals/logs/<timestamp>-orch-concurrent.json

    Run agents unit tests:
      npm run agents:test
    Expect:
      prints OK for each agent example, writes logs.

    Run memory tests:
      npm run memory:test
    Expect:
      set/get/append validated; writes logs.

## Validation and Acceptance

Acceptance is behavioral and observable:

- CLI:
    - Running `npm run soggy -- new agent` scaffolds a working agent.
    - Running `npm run soggy -- test run --type orch --pattern orch-sequential` executes agents with visible step history and non-zero exit on failure.
- Evals:
    - Orchestration determines default eval; overriding via `--eval` works.
    - JSON artifacts are written to `evals/logs/` containing `{ id, strategy, history, scores, pass }`.
- Memory:
    - Default memory selected by orchestration; override with `--memory` works.
    - Memory backends pass CRUD tests via `npm run memory:test`.
- Tools:
    - At least one example agent calls a tool and returns tool output embedded in result.

## Idempotence and Recovery

- CLI generation is additive and safe; re-running prompts offers overwrite or skip.
- Tests can be rerun repeatedly; logs are timestamped to avoid collisions.
- If Redis/Supabase is unavailable, fallback to in-memory is automatic; print a warning and proceed.
- Cleanup: remove generated folders/files or clear `evals/logs/` safely.

## Artifacts and Notes

Example expected `test run` output:

    Strategy: concurrent
    Agents: 8
    Duration: 542ms
    Failures: 0
    Artifact: evals/logs/2025-11-06T04-30-00Z-orch-concurrent.json

Example artifact (trimmed):

    {
      "id": "orch-concurrent",
      "strategy": "concurrent",
      "history": [ { "agentId": "writer", "timestamp": 1730867400000, "output": "..." } ],
      "scores": { "quality": 0.82, "latency": 0.94 },
      "pass": true
    }

## Interfaces and Dependencies

- `/packages/types.ts`
    - OrchestrationPattern
    - OrchestrationResult
    - HistoryEntry
    - Agent (run, respond?, propose?)

- `/evals/types.ts`
    - EvalSuite

- `/memory/types.ts`
    - Memory

- `/tools/types.ts`
    - Tool

- CLI uses Node + tsx. Add minimal deps only if necessary (e.g., yargs or commander).
- Optional: Redis client, Supabase client (lazy-load; fallback if not configured).

## Milestones

1. CLI skeleton (new, test, run) with discovery and printing; no scaffolds yet.
   Result: You can run `soggy test` and see a placeholder pass.
   Proof: Terminal output and a JSON file in `evals/logs/`.

2. Agent example scaffolds (all 8), minimal tools, and unit tests.
   Result: `agents:test` passes. Example agents callable via `run.ts`.
   Proof: Table output and JSON artifacts.

3. Wire orchestration ↔ eval selection and orchestration ↔ memory selection, with overrides.
   Result: `orch:test --pattern orch-hybrid-adaptive` shows dynamic eval/memory choice.
   Proof: Artifact contains chosen eval + memory IDs.

4. Scenario run end-to-end with logs and scores.
   Result: `run --pattern orch-concurrent --scenario agents/examples/tasks/pitch-deck.json` produces coherent output and scores.
   Proof: JSON artifact with `pass: true`.

5. Document everything in READMEs and update this ExecPlan sections.

If you follow the guidance above, a single, stateless agent — or a human novice — can read this ExecPlan from top to bottom and produce a working, observable result. That is the bar: SELF-CONTAINED, SELF-SUFFICIENT, NOVICE-GUIDING, OUTCOME-FOCUSED.

### Update Note
Describe any changes made to this plan, the reason, and the date here. For example:
- On 2025-11-06, tightened acceptance criteria to require JSON artifacts per run and added default orchestration→eval/memory maps.
