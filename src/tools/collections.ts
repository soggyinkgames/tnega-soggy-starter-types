import { resolveTool, resolveTools } from "./resolve_tools";
import { ToolDefinition } from "./types";

/**
 * Normalize a framework tooling string (e.g., "langchain") into a catalog tool id.
 */
export function frameworkToolId(tooling: string): string {
  if (!tooling) return "";
  return tooling.startsWith("framework-") ? tooling : `framework-${tooling}`;
}

/**
 * Compute the set of tool ids selected by an orchestration config.
 * Currently limited to framework tooling plus any explicit tool_ids provided.
 */
export function toolIdsForOrchestration(config: {
  default_framework?: string;
  tool_ids?: string[];
  tools?: string[];
}): string[] {
  const ids: string[] = [];

  if (config?.default_framework) {
    ids.push(frameworkToolId(config.default_framework));
  }

  const extras = config?.tool_ids ?? config?.tools ?? [];
  ids.push(...extras);

  return ids;
}

/**
 * Resolve the orchestration tool collection against the canonical catalog.
 * Throws if any tool id is unknown.
 */
export function resolveToolCollectionForOrchestration(config: {
  default_framework?: string;
  tool_ids?: string[];
  tools?: string[];
}): ToolDefinition[] {
  const ids = toolIdsForOrchestration(config);
  return resolveTools(ids);
}

/**
 * Validate and return the framework tool definition for the given tooling name.
 */
export function resolveFrameworkTool(tooling: string): ToolDefinition {
  const id = frameworkToolId(tooling);
  return resolveTool(id);
}
