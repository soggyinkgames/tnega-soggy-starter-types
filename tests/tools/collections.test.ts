import { describe, expect, it } from "vitest";

import {
  frameworkToolId,
  resolveFrameworkTool,
  resolveToolCollectionForOrchestration,
  toolIdsForOrchestration,
} from "../../src/tools/collections";
import { UnknownToolIdError } from "../../src/tools/types";

describe("tool collections for orchestration", () => {
  it("resolves default_tooling to framework tool id", () => {
    const ids = toolIdsForOrchestration({ default_tooling: "langgraph" });
    expect(ids).toEqual(["framework-langgraph"]);
  });

  it("resolves full collection against catalog", () => {
    const defs = resolveToolCollectionForOrchestration({
      default_tooling: "langchain",
      tool_ids: ["search", "summarize"],
    });
    const ids = defs.map((d) => d.id);
    expect(ids).toEqual(["framework-langchain", "search", "summarize"]);
  });

  it("throws for unknown framework tooling", () => {
    expect(() => resolveFrameworkTool("does-not-exist")).toThrow(UnknownToolIdError);
  });

  it("normalizes already-prefixed framework ids", () => {
    expect(frameworkToolId("framework-crewai")).toBe("framework-crewai");
  });
});
