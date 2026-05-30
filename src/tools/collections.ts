import { resolveTool, resolveTools } from "./resolve_tools";
import { ToolDefinition, UnknownToolCollectionError } from "./types";

const TOOL_COLLECTIONS = [
  {
    id: "source-material-preparation",
    toolIds: [
      "ingest.source-materials",
      "normalize.references",
    ],
  },
  {
    id: "line-art-specification",
    toolIds: [
      "derive.line-art-spec",
      "assemble.output-payload",
    ],
  },
  {
    id: "music-specification",
    toolIds: [
      "derive.music-spec",
      "assemble.output-payload",
    ],
  },
] as const;

const TOOL_COLLECTION_BY_ID = new Map(
  TOOL_COLLECTIONS.map((collection) => [collection.id, collection]),
);

/**
 * Normalize a framework tooling string (e.g., "langchain") into a catalog tool id.
 */
export function frameworkToolId(tooling: string): string {
  if (!tooling) return "";
  return tooling.startsWith("framework-") ? tooling : `framework-${tooling}`;
}

/**
 * Compute the set of tool ids selected by an orchestration config.
 * Includes framework tooling, named tool collections, and explicit tool ids.
 */
export function toolIdsForOrchestration(config: {
  default_framework?: string;
  tool_ids?: string[];
  tools?: string[];
  toolCollections?: string[];
  tool_collections?: string[];
}): string[] {
  const ids: string[] = [];

  if (config?.default_framework) {
    ids.push(frameworkToolId(config.default_framework));
  }

  const collections = config?.toolCollections ?? config?.tool_collections ?? [];
  ids.push(...resolveToolIdsForCollections(collections));

  const extras = config?.tool_ids ?? config?.tools ?? [];
  ids.push(...extras);

  return ids;
}

function resolveToolIdsForCollection(collectionId: string): string[] {
  const collection = TOOL_COLLECTION_BY_ID.get(collectionId);
  if (!collection) {
    throw new UnknownToolCollectionError(collectionId);
  }

  return [...collection.toolIds];
}

export function resolveToolIdsForCollections(collectionIds: readonly string[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const collectionId of collectionIds) {
    for (const toolId of resolveToolIdsForCollection(collectionId)) {
      if (seen.has(toolId)) continue;
      ordered.push(toolId);
      seen.add(toolId);
    }
  }

  return ordered;
}

/**
 * Resolve the orchestration tool collection against the canonical catalog.
 * Throws if any tool id is unknown.
 */
export function resolveToolCollectionForOrchestration(config: {
  default_framework?: string;
  tool_ids?: string[];
  tools?: string[];
  toolCollections?: string[];
  tool_collections?: string[];
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
