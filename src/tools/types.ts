export type ToolCategory =
  | "analysis"
  | "generation"
  | "retrieval"
  | "summarization"
  | "framework";

export const CONTROLLED_TOOL_CATEGORIES: readonly ToolCategory[] = [
  "analysis",
  "generation",
  "retrieval",
  "summarization",
  "framework",
] as const;

export interface ToolDefinition {
  /** Stable canonical identifier */
  id: string;
  /** Human-friendly name */
  title: string;
  /** Concise description of what the tool does */
  description: string;
  /** Controlled category drawn from CONTROLLED_TOOL_CATEGORIES */
  category: ToolCategory;
  /** Module path that implements the tool */
  modulePath: string;
  /** Optional semantic version for the tool definition */
  version?: string;
  /** Optional controlled tags for additional grouping */
  tags?: string[];
}

export type ToolCatalog = ReadonlyArray<ToolDefinition>;

export class UnknownToolIdError extends Error {
  constructor(toolId: string) {
    super(`Unknown tool id: ${toolId}`);
    this.name = "UnknownToolIdError";
  }
}

export class DuplicateToolIdError extends Error {
  constructor(toolId: string) {
    super(`Duplicate tool id detected: ${toolId}`);
    this.name = "DuplicateToolIdError";
  }
}

export function isControlledCategory(
  category: string,
): category is ToolCategory {
  return (CONTROLLED_TOOL_CATEGORIES as readonly string[]).includes(category);
}
