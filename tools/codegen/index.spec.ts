import { describe, it, expect } from "vitest";
import { codegenTool } from ".";

describe("tools/codegen", () => {
  it("returns code with a name", async () => {
    const res = await codegenTool.run({ name: "Foo", lang: "ts" }, {} as any);
    expect(res).toHaveProperty("code");
    expect(String(res.code)).toContain("Foo");
  });
});

