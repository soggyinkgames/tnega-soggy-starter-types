Goal: Build the creative-generation template so `new agent` can scaffold a usable creative-generation agent aligned with the existing starter patterns.

Context:
- agent scaffolding and template resolution in the starter CLI
- creative-generation agent type support
- important existing files:
  - CLI/template generator for agent creation
  - existing agent templates for the other agent types
  - shared `defineAgent` usage and agent config shape
  - creative-generation `schema.ts` contract
- current known constraint:
  - creative-generation should be scaffolded as a first-class agent type using current generator conventions, without inventing new runtime systems for creative pipelines yet

Constraints:
- edit only files required to add the creative-generation template and register it in the existing generator flow
- do not add dependencies
- do not broaden architecture
- preserve existing public contracts
- add or update tests for changed behavior

Done when:
- selecting the creative-generation agent type produces scaffolded files through the current CLI flow
- generated files include a coherent creative-generation schema and agent template
- the template uses existing starter contracts and conventions
- scaffold tests verify expected files/content for the creative-generation output
- tests pass
- typecheck passes
- no unrelated files changed