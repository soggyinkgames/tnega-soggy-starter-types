import { describe, expect, it } from "vitest";

import {
  frameworkToolId,
  resolveToolIdsForCollections,
  resolveFrameworkTool,
  resolveToolCollectionForOrchestration,
  toolIdsForOrchestration,
} from "../../src/tools/collections.js";
import { UnknownToolCollectionError, UnknownToolIdError } from "../../src/tools/types.js";

describe("tool collections for orchestration", () => {
  it("resolves default_framework to framework tool id", () => {
    const ids = toolIdsForOrchestration({ default_framework: "langgraph" });
    expect(ids).toEqual(["framework-langgraph"]);
  });

  it("resolves full collection against catalog", () => {
    const defs = resolveToolCollectionForOrchestration({
      default_framework: "langchain",
      tool_ids: ["search", "summarize"],
    });
    const ids = defs.map((definition) => definition.id);
    expect(ids).toEqual(["framework-langchain", "search", "summarize"]);
  });

  it("throws for unknown framework tooling", () => {
    expect(() => resolveFrameworkTool("does-not-exist")).toThrow(UnknownToolIdError);
  });

  it("normalizes already-prefixed framework ids", () => {
    expect(frameworkToolId("framework-crewai")).toBe("framework-crewai");
  });

  it("resolves collection ids against the canonical catalog", () => {
    const definitions = resolveToolCollectionForOrchestration({
      toolCollections: ["source-material-preparation"],
    });

    expect(definitions.map((tool) => tool.id)).toEqual([
      "ingest.source-materials",
      "normalize.references",
    ]);
  });

  it("deduplicates resolved tool ids across ordered collections", () => {
    expect(
      resolveToolIdsForCollections([
        "source-material-preparation",
        "line-art-specification",
        "line-art-specification",
      ]),
    ).toEqual([
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "assemble.output-payload",
    ]);
  });

  it("throws for unknown tool collection ids", () => {
    expect(() => resolveToolIdsForCollections(["creative-does-not-exist"])).toThrow(
      UnknownToolCollectionError,
    );
  });

  it("includes collection-based tool ids when resolving orchestration tooling", () => {
    const ids = toolIdsForOrchestration({
      default_framework: "langgraph",
      toolCollections: ["source-material-preparation", "line-art-specification"],
    });

    expect(ids).toEqual([
      "framework-langgraph",
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "assemble.output-payload",
    ]);
  });
});
