import { describe, expect, it } from "vitest";

import { canonicalToolCatalog } from "../../src/tools/catalog.js";
import { CONTROLLED_TOOL_CATEGORIES } from "../../src/tools/types.js";

describe("tool catalog integrity", () => {
  it("protection (invariant): catalog has unique tool ids", () => {
    const ids = canonicalToolCatalog.map((tool) => tool.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("protection (invariant): catalog uses controlled categories", () => {
    const allowed = new Set(CONTROLLED_TOOL_CATEGORIES);
    const invalid = canonicalToolCatalog
      .map((tool) => tool.category)
      .filter((category) => !allowed.has(category));

    expect(invalid).toHaveLength(0);
  });

  it("contains the creative-generation tool ids behind stable names", () => {
    const ids = canonicalToolCatalog.map((tool) => tool.id);
    expect(ids).toEqual(expect.arrayContaining([
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "derive.music-spec",
      "assemble.output-payload",
    ]));
  });
});
