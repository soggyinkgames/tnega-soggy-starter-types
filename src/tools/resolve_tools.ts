import { canonicalToolCatalog } from "./catalog";
import { ToolDefinition, UnknownToolIdError } from "./types";

const catalogIndex: Map<string, ToolDefinition> = new Map(
  canonicalToolCatalog.map((tool) => [tool.id, tool]),
);

export function normalizeToolId(id: string): string {
  return id.trim();
}

export function resolveTool(id: string): ToolDefinition {
  const normalized = normalizeToolId(id);
  const tool = catalogIndex.get(normalized);
  if (!tool) {
    throw new UnknownToolIdError(id);
  }
  return tool;
}

export function resolveTools(ids: readonly string[]): ToolDefinition[] {
  const seen = new Set<string>();
  const resolved: ToolDefinition[] = [];

  for (const id of ids) {
    const normalized = normalizeToolId(id);
    if (seen.has(normalized)) continue;
    resolved.push(resolveTool(normalized));
    seen.add(normalized);
  }

  return resolved;
}

export function listTools(): ToolDefinition[] {
  return [...catalogIndex.values()];
}

export function listToolIds(): string[] {
  return [...catalogIndex.keys()];
}
