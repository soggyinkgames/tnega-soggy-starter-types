Pattern: registry-based resolution

Keep a single source-of-truth registry for available capabilities.
Resolve entries by stable id, not by scattered imports.
Let higher-level systems select groups from the registry.
Let execution flow through one shared runtime path.
Later extend implementations without changing registry consumers.