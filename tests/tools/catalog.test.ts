import { describe, expect, it } from "vitest";

import { canonicalToolCatalog } from "../../src/tools/catalog";
import { CONTROLLED_TOOL_CATEGORIES } from "../../src/tools/types";

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
});
