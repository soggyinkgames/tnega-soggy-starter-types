Pattern: creative-generation-template-first boundary

Build creative-generation agent scaffolding as template-based generation behind a stable agent template boundary.
Resolve creative-generation support by explicit template registration, not by ad hoc conditional generation logic.
Let the starter generator own agent-type selection and template composition.
Let the existing runtime own execution through shared agent contracts.
Later replace local starter template files with a different template source or packaging boundary without changing generated agent-facing behavior or contracts.