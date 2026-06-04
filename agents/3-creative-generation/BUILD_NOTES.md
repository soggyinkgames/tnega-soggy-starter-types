# Build Notes

## Generated from
- Primary goal: generate-content (guided selection)
- Agent type: creative-generation (primary goal recommendation)
- Goal variation: music (orchestration goals)
- Orchestration: orch-sequential (agent type recommendation)
- Framework: langchain (orchestration default)
- Evals: modelgraded, safety (existing agent config)
- Memory: supabase (orchestration default)
- Creative specialization: Music concepts from prompts, audio, and references (goal variation)
- Input kinds: prompt-text, audio, reference-set (goal variation)
- Output targets: music (goal variation)
- Tools: ingest.source-materials, normalize.references, derive.music-spec, assemble.output-payload (orchestration tools resolver)

## Manual verification checklist
- Confirm orchestration is implemented and intended for this agent type
- Confirm each tool exists and is discoverable in current tooling architecture
- Confirm memory provider is actually wired
- Run the orchestration-backed execution path and confirm the declared tools match the expected behavior
- Replace scaffold eval logic with project-specific checks if stronger coverage is needed
- Add tests once scaffold shape is confirmed
