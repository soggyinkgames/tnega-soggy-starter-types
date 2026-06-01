Goal: implement the first local tools catalog under `src/tools` so agents can execute tooling selected by existing orchestration packages in `packages/orch-*`, proving the runtime loop works before the tools layer is extracted into an API.

Context:
- relevant subsystem: tools resolution and execution for generated agents
- important existing files: CLI agent templates, `packages/orch-*` packages, goal-to-tool collection mapping, agent runtime/tool execution path
- current known constraint: tool implementations are local for now, but must be structured so they can later move behind a tools API with minimal contract changes

Constraints:
- edit only `src/tools/**` and minimal existing integration points needed for tool registration, lookup, and execution
- do not add dependencies
- do not broaden architecture
- preserve existing public contracts
- add or update tests for changed behavior

Done when:
- `src/tools` contains the local source-of-truth catalog for available tools
- existing orchestration packages can reference tool collections that resolve against that catalog
- generated agents can execute resolved tools through the current runtime
- local tool execution works end-to-end without the external API
- tests cover registration, lookup, and execution behavior
- tests pass
- typecheck passes
- no unrelated files changed