import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "path";
import { DEFAULT_EVALS } from "lib/defaultEvals";

const templatesRoot = path.resolve("templates/agent-types");

describe("scripts/new-agent prerequisites", () => {
  it("has all 8 agent template folders", async () => {
    const expected = [
      "1-knowledge-insight",
      "2-strategy",
      "3-creative-generation",
      "4-personal-workflow-assistant",
      "5-data-analyst-debugger",
      "6-simulation-scenario",
      "7-educational",
      "8-dev-infrastructure",
    ];
    for (const folder of expected) {
      const p = path.join(templatesRoot, folder);
      expect(await fs.pathExists(p)).toBe(true);
      expect((await fs.stat(p)).isDirectory()).toBe(true);
    }
  });

  it("template knowledge-insight uses shared queryKnowledgeBase tool", async () => {
    const toolsFile = path.join(templatesRoot, "1-knowledge-insight", "tools.ts");
    const content = await fs.readFile(toolsFile, "utf8");
    expect(content).toMatch(/export\s+\{\s*queryKnowledgeBase/);
    expect(content).not.toMatch(/new OpenAI\(/);
    expect(content).not.toMatch(/supabase\.rpc/);
  });

  it("DEFAULT_EVALS contains mappings for all 8 types", () => {
    const keys = Object.keys(DEFAULT_EVALS);
    const required = [
      "1-knowledge-insight",
      "2-strategy",
      "3-creative-generation",
      "4-personal-workflow-assistant",
      "5-data-analyst-debugger",
      "6-simulation-scenario",
      "7-educational",
      "8-dev-infrastructure",
    ];
    for (const k of required) expect(keys).toContain(k);
    for (const arr of Object.values(DEFAULT_EVALS)) expect(Array.isArray(arr)).toBe(true);
  });

  it("new-agent script exists and references templates + DEFAULT_EVALS", async () => {
    const scriptPath = path.resolve("scripts/new-agent.ts");
    expect(await fs.pathExists(scriptPath)).toBe(true);
    const content = await fs.readFile(scriptPath, "utf8");
    expect(content).toMatch(/templates\/agent-types/);
    expect(content).toMatch(/DEFAULT_EVALS/);
  });
});

