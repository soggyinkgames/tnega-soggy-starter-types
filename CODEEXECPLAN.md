# Unify CLI, Orchestration, Evals, Memory, Tools — with Tests and Examples

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.
If CODEEXECPLAN.md exists in the repo, this plan is the source of truth. Any prior PLANS.md content has been merged here.

## Purpose / Big Picture

After implementing this plan, a developer can:
- Use a single CLI to scaffold and run: agents, orchestrations, eval suites, memory backends, and tool plugins.
- Run observable tests for each collection of work before moving on, with clear pass/fail gates.
- Generate example agents for all 8 agent types, wire them to all 8 orchestration patterns, and run evals that are selected by the orchestration strategy and memory type.
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

- [x] (2025-11-08 00:00Z) Create CLI foundation with subcommands: `new`, `test`, `run`.
- [x] (2025-11-08 00:00Z) Add scaffolds for: 8 agent examples, 8 orchestration patterns (already present), eval suites, memory backends, tool plugins.
- [x] (2025-11-08 00:00Z) Connect orchestration → eval selection (strategy decides eval type) and orchestration → memory selection.
- [x] (2025-11-08 00:00Z) Implement test harness with observable outputs and JSON artifacts.
- [x] (2025-11-26 00:00Z) Refactored orch-centralised and orch-concurrent specs to match controller delegation, per-index inputs, and error isolation.
- [ ] Validate end-to-end on a sample scenario (e.g., “generate pitch deck”).
- [ ] Document outcomes and finalize.

## Surprises & Discoveries

- Observation: CODEEXECPLAN.md previously showed encoding artifacts for em-dashes.
  Evidence: occurrences of “â€”” in headings and lists.
  Action: content reads correctly; normalize encoding in a follow-up if needed.

- Observation: Existing scripts were unintentionally touched during an earlier pass.
  Evidence: package.json duplicate script entries; modified scripts/new-agent.ts and scripts/run-agent.ts.
  Action: Restored original scripts via checkout; ensured all new functionality is additive under new files only.

## Decision Log

- Decision: Use minimal custom argv parser for CLI instead of a dependency.
  Rationale: Reduce dependencies and keep CLI simple.
  Date/Author: 2025-11-08 / codex

- Decision: Provide Redis/Supabase memory as stubs with graceful fallback to in-memory.
  Rationale: Ensure tests pass without external services while keeping extension points.
  Date/Author: 2025-11-08 / codex

- Decision: Implement default orchestration→eval and orchestration→memory maps in `cli/commands/helpers/discover.ts`.
  Rationale: Centralized selection logic with CLI overrides.
  Date/Author: 2025-11-08 / codex

- Decision: Preserve existing scripts; add new wrappers and tests under `/scripts` without renaming or replacing original commands.
  Rationale: Non-invasive integration to avoid regressions while expanding capabilities.
  Date/Author: 2025-11-08 / codex

- Decision: Consolidate eval suites to existing `packages/eval-*` modules; remove duplicate `evals/*` implementations.
  Rationale: Avoid duplication; align with repo’s existing eval packages.
  Date/Author: 2025-11-08 / codex

- Decision: Remove ad-hoc `/cli` prototype; keep helpers under `/scripts/helpers` and tests under `/scripts/*`.
  Rationale: Reduce clutter and unused entrypoints; align with package.json scripts.
  Date/Author: 2025-11-08 / codex

- Decision: Use Vitest as the single source of truth for orchestration unit tests.
  Action: Removed custom `scripts/test-orch.ts` runner; `test:orch` now runs `vitest` over `packages/orch-*/**/*.spec.ts`.
  Rationale: Avoid duplication and keep tests colocated with code using best-practice filenames.
  Date/Author: 2025-11-08 / codex
  Follow-up: Adjusted npm script glob to `packages/orch-*/**/*.spec.ts` for predictable discovery across shells.
  Update: Switched to dedicated `vitest.orch.config.ts` and script `vitest -c vitest.orch.config.ts run` to remove shell/glob ambiguity entirely.

- Decision: Use Vitest as single source for tools unit tests.
  Action: Added `vitest.tools.config.ts`, colocated tool specs, and updated `test:tools` to use the config.
  Rationale: Remove custom runner duplication; ensure reliable discovery across environments.
  Date/Author: 2025-11-08 / codex

## Outcomes & Retrospective

Summarize results, gaps, and lessons learned at completion.

## Context and Orientation

Repo areas relevant to this plan:

    /agents/
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

## Plan of Work & Concrete Steps (Codex-Ready, Self-Checking, Memory-Retaining)

This section replaces previous plans. It is idempotent, large-scope friendly, and requires no out-of-band explanation. Codex must treat this as the single source of truth and keep it updated as work proceeds.

---

### 0) Ground Rules (for Codex and Humans)

1. Never link an orchestration into scaffolds until all 8 orchestration packages have passing tests.
2. All generation or edits must run self-checks and write artifacts under evals/logs/.
3. Record any detected issues in CODEEXECPLAN_LOG.md under “Fuckups To Fix” and fail the step with a non-zero exit.
4. Keep context memory local: this file (CODEEXECPLAN.md) + CODEEXECPLAN_LOG.md are the living memory. Update both.
5. read the file and folder structure of this project and edit this `Current Repo Orientation` section accurately

---

### 1) Current Repo Orientation (accurate)

    /templates/agent-types/          ← 8 base agent types (config.ts, index.ts, eval.ts, tools.ts)
    /templates/orchestration/        ← orchestration templates (e.g., orch-centralised)
    /agents/                         ← generated agents (base 8 plus new ones like kirsten, boou, boout)
    /orchestrations/                 ← composed orchestration instances (e.g., here/, symphony/)
    /packages/                       ← orchestration + eval packages
        orch-centralised/
        orch-hierarchical/
        orch-shared-memory/
        orch-negotiate/
        orch-concurrent/
        orch-sequential/
        orch-group-collaborative/
        orch-hybrid-adaptive/
        eval-basic/
        eval-modelgraded/            ← note naming matches folder
        eval-regression/
        eval-safety/
        eval-system/
        eval-types/                  ← shared EvalSuite typings and interfaces
        memory/                      ← memory index for packages
        index.ts, registry.ts, runOrchFramework.ts, types.ts
    /evals/logs/                     ← runtime artifacts only (no eval source trees here)
    /memory/                         ← memory backends
      mem-inmemory/
      mem-redis/                     ← optional until backend ready
      mem-supabase/                  ← optional until backend ready
      types.ts
      config.ts                      ← maps memory “types” to backends
    /tools/                          ← reusable micro-components
      analyzeData/
      codegen/
      generateContent/
      queryKnowledgeBase/
      search/
      summarize/
      frameworks/                    ← orchestration frameworks
      types.ts
    /scripts/                        ← CLI UX scripts (Node+TS)
      new-agent.ts
      new-orchestration.ts
      run-agent.ts
      run-orchestration.ts
      helpers/ (discover.ts, io.ts, load.ts, artifacts.ts)
      tests/ (Vitest specs for CLI flows)
    /vitest*.config.ts               ← dedicated configs for orch, tools, scripts


Only /evals/logs/ exists for runtime artifacts; eval source lives under /packages/eval-*/.
---


### 2) Package Scripts (top-level UX)

In package.json add or update the following. Do not change names without updating this plan and scripts/README.md.

    "scripts": {
      "new-agent": "tsx ./scripts/new-agent.ts",
      "run-agent": "tsx ./scripts/run-agent.ts",
      "new-orchestration": "tsx ./scripts/new-orchestration.ts",
      "run-orchestration": "tsx ./scripts/run-orchestration.ts",
      "test:unit": "tsx ./scripts/test-unit.ts",
      "test:specs": "tsx ./scripts/test-specs.ts",
      "test:cli": "tsx ./scripts/test-cli.ts",
      "test:tools": "tsx ./scripts/test-tools.ts",
      "test:orch": "tsx ./scripts/test-orch.ts",
      "test:all": "npm run test:unit && npm run test:specs && npm run test:cli && npm run test:tools && npm run test:orch"
    }

Create or update /scripts/README.md with one-screen usage for each command and a list of flags. Every script must print a usage summary when run with --help.

---

### 3) Templates and Agents (correct placement)

Rules:
- The eight base agents remain in templates/agent-types/ (source of truth).
- Generated agents are instantiated into /agents/<name>/ only.
- Do not introduce an “agents catalog” folder; /agents/ is the catalog.

Each template folder in templates/agent-types/* must contain:
- config.ts      ← default metadata; includes defaults for eval, memory types, optional orchestration suggestion (not enforced)
- index.ts       ← implements run(), optional respond(), propose()
- eval.ts        ← imports an existing eval package (basic/system/model-graded); no new eval manager
- tools.ts       ← imports micro-tools from /tools/*, not inline agent-specific logic

---

### 4) Tools Refactor (micro-components)

Every agent feature must consume tools via /tools/* micro-components. Example shape:

    export async function runTool(spec: any, ctx: any): Promise<any> { ... }

Examples already present or to be created:
- /tools/queryKnowledgeBase/
- /tools/analyzeData/
- /tools/generateContent/
- /tools/summarize/
- /tools/search/
- /tools/codegen/

Agents must import these rather than hardcoding bespoke tool logic.

---

### 5) Memory Model (defaults now, richer later)

Memory backends:
- Default backend: mem-inmemory (always present)
- Optional: mem-redis, mem-supabase

Memory “types” (selected by orchestration or override):
- short-term, working, episodic, long-term

In /memory/config.ts define mapping notes for later:
- mem-inmemory → short-term, working (safe default)
- mem-redis → working, episodic (low-latency shared)
- mem-supabase → long-term, episodic (persistence)

An orchestration may pick one backend plus an array of memory types. If backend is unavailable, fallback to mem-inmemory and warn.

---

### 6) Discovery and Defaults (single source of truth)

Implement /scripts/helpers/discover.ts to export:

- discoverAgents(), discoverOrchestrations(), discoverEvals(), discoverMemory(), discoverTools()
- defaultSelectionForOrch(orchId):
    orch-shared-memory → mem-inmemory, evals/basic
    orch-concurrent → mem-redis (if available) else mem-inmemory, evals/system
    orch-centralised → mem-redis (if available) else mem-inmemory, evals/basic
    orch-sequential → mem-redis (if available) else mem-inmemory, evals/basic
    orch-negotiate → mem-supabase (if available) else mem-inmemory, evals/model-graded
    orch-group-collaborative → mem-inmemory, evals/model-graded
    orch-hybrid-adaptive → mem-supabase (if available) else mem-inmemory, evals/model-graded

Flag precedence everywhere:
- CLI flags > agent’s config defaults > orchestration defaults > discover.ts fallback

---

### 7) CLI: new-agent (no orchestration link until tests pass)

Behavior of /scripts/new-agent.ts:
- Prompt order: AGENTS → TOOLS → EVALS → MEMORY → (Orchestration is shown but disabled until orch tests pass)
- Source lists:
    Agents types from templates/agent-types/*
    Tools from /tools/*
    Evals from /evals/* (existing packages only)
    Memory from /memory/* backends
- Generate /agents/<name>/
    Copy from selected template
    Write /agents/<name>/config.json with:
        { evalId, memory: { backend, types: [...] }, tools: [ ... ] }
    Do not persist an orchestration link yet if any orch spec fails

Artifacts:
- evals/logs/<timestamp>-new-agent.json (choices, files created)
- Update evals/logs/index.json

Self-check:
- Validate imports resolve; if not, log to CODEEXECPLAN_LOG.md and exit non-zero.

---

### 8) CLI: run-agent (agent-only execution)

Behavior of /scripts/run-agent.ts:
- Inputs: --agent <name>, optional --eval, --memory, --scenario path/to/task.json
- Load /agents/<name>/config.json
- Resolve final eval and memory via precedence rules
- Execute agent.run() directly (no orchestration), with ctx.tools resolved
- Write artifact: evals/logs/<timestamp>-run-agent.json
- Run selected EvalSuite against result, append scores/pass to artifact
- Exit non-zero on failure; append issues to CODEEXECPLAN_LOG.md

---

### 9) Orchestrations: testing first, then creation

Step A — Specs for all 8 orch packages (must exist before linking in any wizard):
- Each /packages/orch-*/ must have orch.spec.ts covering:
    instantiation, run() happy-path, error capture, artifact structure (id, strategy, history)
- Add script test-orch.ts to execute all orch specs and table results

Only after Step A passes:

Step B — CLI: new-orchestration (compose an orchestration instance)
- /scripts/new-orchestration.ts:
    Prompt name of orchestration instance
    Prompt one of the 8 orchestration types (only if its spec is passing)
    Select agents from /agents/
    Select memory backend + types (pre-filled defaults from defaultSelectionForOrch)
    Select eval suite (pre-filled from defaultSelectionForOrch)
    Write /orchestrations/<name>/
        config.json:
            { orchId, agents: [..], evalId, memory: { backend, types: [...] } }
        README.md: generated summary (how to run)

Artifacts:
- evals/logs/<timestamp>-new-orchestration.json

Self-check:
- Validate all imports and paths; otherwise log and fail

---

### 10) CLI: run-orchestration (execute composed instance)

Behavior of /scripts/run-orchestration.ts:
- Inputs: --name <orchestrationName>, optional overrides --eval --memory --scenario
- Load /orchestrations/<name>/config.json
- Resolve orchestrator from /packages/orch-*/
- Resolve agent set from /agents/
- Resolve memory and eval via precedence rules
- Execute orchestrator.run(task, agents)
- Execute EvalSuite on orchestration result
- Artifact: evals/logs/<timestamp>-run-orchestration.json
- Exit non-zero on failure, append issues to CODEEXECPLAN_LOG.md

---

### 11) Tests (unit, specs, tools, cli; independent/grouped/full)

Minimum test placement:
- Each CLI script in /scripts/* has a co-located test in /scripts/test-*.ts (or matching pattern inside tests/)
- Each agent in /agents/<name>/<name>.spec.ts (created from template)
- Each orchestration in /packages/orch-*/orch.spec.ts
- Each tool in /tools/*/tool.spec.ts

Runners:
- npm run test:unit     ← light shape/contract tests
- npm run test:specs    ← agents + orchestrations + evals specs
- npm run test:cli      ← exercises new-agent, new-orchestration, run-* flows in dry-run or temp mode
- npm run test:tools    ← executes micro-tools deterministically
- npm run test:orch     ← focused orchestration behavior (throughput, error tolerance)
- npm run test:all      ← the full suite; must be green before scaffolds link orchestration

All runners:
- Print concise tables (status, duration, failures)
- Write JSON artifacts to evals/logs/
- On any failure:
    Append to CODEEXECPLAN_LOG.md under “Fuckups To Fix”
    Exit non-zero

---

### 12) Validation Flow (corrected order; orchestration is separate)

1. npm run new-agent
    Produces agent and config with tools, eval, memory
2. npm run run-agent -- --agent <name> [--scenario …]
    Runs agent alone; evaluate and log artifacts
3. npm run test:orch
    Ensures 8 orchestration packages pass before linking anywhere
4. npm run new-orchestration
    Compose orchestration instance from passing orch types + chosen agents/memory/eval
5. npm run run-orchestration -- --name <orchestrationName> [--scenario …]
    Full run; evaluate and log artifacts
6. npm run test:all
    Gate for regressions; artifacts written; non-zero on failure

---

### 13) Self-Memory, Error Log, and Auto-QA

Maintain /CODEEXECPLAN_LOG.md with these sections, updated by every script and test runner:

    # CODEEXECPLAN Error & Fix Log

    ## 🧨 Fuckups To Fix
    - [ ] Placeholder for next issue

    ## 🧩 Fixes Completed
    - [x] Example fix with date and brief rationale

    ## 🔁 Context Map
    Agents ↔ Orchestrations ↔ Evals ↔ Memory ↔ Tools ↔ CLI Scripts

Every CLI step ends with:
- Validate graph consistency (files, ids, imports)
- If errors: log entries into “Fuckups To Fix” and exit non-zero

---

### 14) Simple Daily Workflow (no re-explaining)

From your editor terminal:

    npm run new-agent
    npm run run-agent -- --agent my-writer --scenario agents/examples/tasks/pitch-deck.json
    npm run test:orch
    npm run new-orchestration
    npm run run-orchestration -- --name launch-proposal --scenario agents/examples/tasks/pitch-deck.json
    npm run test:all

Review artifacts in:
- evals/logs/
- CODEEXECPLAN_LOG.md

If anything fails, fixes go to “Fuckups To Fix” automatically. After a fix, move items to “Fixes Completed”.

---

### 15) Acceptance

- All 8 orchestration specs pass before any scaffold links them.
- new-agent produces an agent with working tools/eval/memory and passes run-agent.
- new-orchestration composes from existing pieces only; no eval manager introduced.
- Tools are imported from /tools/* micro-components; no per-agent hardcoding.
- test:all passes locally; artifacts exist and are readable.
- CODEEXECPLAN_LOG.md reflects the latest issues/fixes and the cross-component context map.

---


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
- On 2025-11-08, merged PLANS.md updates into this CODEEXECPLAN.md; marked initial milestones complete and recorded decisions.
- On 2025-11-08, executed plan steps additively: added specs, tools, helpers, scripts, templates, and artifacts indexer; restored original scripts after accidental edits; documented decisions and surprises.
- On 2025-11-08, removed duplicated eval implementations under `/evals/*` in favor of `packages/eval-*`; deleted unused `agents/again/*` and `lib/memory.ts` to reduce duplication.
- On 2025-11-08, moved knowledge-insight query tool into shared `@tools/queryKnowledgeBase` and updated template re-export to use the shared tool.
- On 2025-11-08, added orchestration templates under `templates/orchestration/*` and updated `scripts/new-orchestration.ts` to surface template use-cases. Added YAML prompts: `build_orchestration_templates.yaml` and `build_orchestration_config.yaml`.
 - On 2025-11-08, added `inquirer` dependency and updated `scripts/new-agent.ts` to use it for the new goals-aware flow.
- On 2025-11-08, added `vitest.orch.config.ts` and updated `test:orch` script to use the config for reliable test discovery.
- On 2025-11-08, added `ui/codex-prompts/build_tools_tests.yaml`, `vitest.tools.config.ts`, and colocated tool specs; updated `test:tools` and removed `scripts/test-tools.ts` to avoid duplication.
- On 2025-11-08, added scripts/tests/new-agent.spec.ts and scripts/tests/run-agent.spec.ts with dedicated Vitest config to validate CLI scaffolding and execution without modifying the CLI scripts.
 - On 2025-11-08, removed unused helper `scripts/helpers/tools.ts` after confirming no references remained.
- On 2025-11-08, removed the temporary `/cli` directory and ported helpers to `/scripts/helpers`; refactored orchestration unit tests with best-practice names and explicit assertions.
 - On 2025-11-08, removed `scripts/test-orch.ts` to prevent duplication; updated package script to run Vitest on `packages/orch-*/**/*.spec.ts`.
- On 2025-11-26, refactored `packages/orch-centralised/centralised.spec.ts` to cover new-agent creation via controller delegation and updated error-handling expectations.
- On 2025-11-26, expanded `packages/orch-concurrent/concurrent.spec.ts` to assert per-index inputs, context wiring, duration, and error isolation.
