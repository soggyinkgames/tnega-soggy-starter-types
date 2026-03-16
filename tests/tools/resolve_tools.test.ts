import { describe, expect, it } from "vitest";

import { canonicalToolCatalog } from "../../src/tools/catalog";
import { resolveTool, resolveTools } from "../../src/tools/resolve_tools";
import { UnknownToolIdError } from "../../src/tools/types";

const [firstTool, secondTool, thirdTool] = canonicalToolCatalog;

describe("tool resolver", () => {
  it("happy: resolver returns known tool", () => {
    const resolved = resolveTool(firstTool.id);
    expect(resolved).toEqual(firstTool);
  });

  it("invalid: resolver rejects unknown tool", () => {
    expect(() => resolveTool("non-existent-tool")).toThrow(UnknownToolIdError);
  });

  it("edge: resolver preserves input order", () => {
    const ids = [thirdTool.id, secondTool.id, firstTool.id];
    const resolvedIds = resolveTools(ids).map((tool) => tool.id);
    expect(resolvedIds).toEqual(ids);
  });

  it("protection (behavior): resolver does not return duplicates", () => {
    const ids = [firstTool.id, firstTool.id, secondTool.id, secondTool.id];
    const resolvedIds = resolveTools(ids).map((tool) => tool.id);
    expect(resolvedIds).toEqual([firstTool.id, secondTool.id]);
  });
});
