# CODEEXECPLAN Error & Fix Log

## 🧨 Fuckups To Fix
- [ ] Normalize encoding artifacts (“â€””) across plan files.
- [ ] Verify no lingering imports reference removed paths (evals/*, lib/memory, agents/again/*).
- [ ] Ensure Vitest includes packages/orch-*/**/*.spec.ts in CI runners.
- [ ] Validate glob `packages/orch-*/**/*.spec.ts` on Windows shells; fallback to explicit list if needed.

## 🧩 Fixes Completed
- [x] 2025-11-08: Merged PLANS.md into CODEEXECPLAN.md and normalized plan sections.
- [x] 2025-11-08: Restored original scripts/new-agent.ts and scripts/run-agent.ts; removed duplicate script declarations; ensured new additions are additive and non-invasive.
 - [x] 2025-11-08: Switched CLI eval loader to `packages/eval-*` modules; removed duplicate `/evals/basic`, `/evals/system`, `/evals/model-graded`, and `/evals/types.ts`.
- [x] 2025-11-08: Removed unused `agents/again/*` and `lib/memory.ts` duplicates.
- [x] 2025-11-08: Updated eval loader to wrap `packages/eval-*` into a unified `suite.runEvalSuite` interface for CLI testing.
- [x] 2025-11-08: Removed unused `/cli` and migrated helpers to `/scripts/helpers`.
- [x] 2025-11-08: Refactored orchestration unit tests with explicit behavior checks and best-practice filenames.
- [x] 2025-11-08: Removed custom `scripts/test-orch.ts`; `test:orch` now uses Vitest on packages/orch-*/**/*.spec.ts.
- [x] 2025-11-08: Updated `test:orch` glob to `packages/orch-*/**/*.spec.ts` for consistent discovery.

## 🔁 Context Map
Agents ↔ Orchestrations ↔ Evals ↔ Memory ↔ Tools ↔ CLI Scripts

Latest additions (non-invasive):
- Orchestration specs under packages/orch-*/orch.spec.ts
- CLI helpers (discover/io/load) under cli/commands/helpers/
- Scripts test runners and orchestration instance runners under /scripts
- Tools: search, codegen, analyzeData, generateContent, summarize, queryKnowledgeBase
- Memory config and backends; eval suites; artifact indexer

Additional updates (2025-11-08):
- Added vitest.orch.config.ts and updated test:orch to use it for reliable discovery.
- Prefer CI calling: `npm run test:orch` (config removes shell glob ambiguity).
- Added vitest.tools.config.ts; migrated tools tests to colocated Vitest specs; updated test:tools; removed scripts/test-tools.ts.
- Updated templates/agent-types/1-knowledge-insight/tools.ts to re-export from shared `@tools/queryKnowledgeBase`; implemented real tool with safe fallback for tests.
- Added scripts/tests/new-agent.spec.ts and scripts/tests/run-agent.spec.ts; added vitest.scripts.config.ts and `test:scripts` script.
- Replaced execa usage in run-agent.spec.ts with Node's child_process.spawn; switched to invoking local tsx binary for reliability across platforms.
- Removed unused helper scripts/helpers/tools.ts (no references in repo).
- Added orchestration templates and YAML prompts (`build_orchestration_templates.yaml`, `build_orchestration_config.yaml`); enhanced `new-orchestration` prompts with template summaries.
 - Installed dependency reference for `inquirer` and migrated `scripts/new-agent.ts` to use it.
