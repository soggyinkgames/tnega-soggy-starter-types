import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { DEFAULT_EVALS } from "lib/defaultEvals";

const templatesRoot = path.resolve("templates/agent-types");
const TEST_AGENT_NAME = "__test-new-agent-cli";
const testAgentDir = path.resolve("agents", TEST_AGENT_NAME);

afterEach(async () => {
  await fs.remove(testAgentDir);
  vi.resetModules();
  vi.restoreAllMocks();
});

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
    expect(content).toMatch(/agent-types/);
    expect(content).toMatch(/DEFAULT_EVALS/);
  });

  it(
    "scaffolds an agent using recommended orchestration, goals, evals, tools, and memory",
    async () => {
      const promptMock = vi.fn().mockImplementation((questions: any[]) => {
        const q = Array.isArray(questions) ? questions[0] : questions;
        const message: string = q?.message ?? "";
        if (message.includes("Agent folder name")) return Promise.resolve({ name: TEST_AGENT_NAME });
        if (message.includes("agent type")) return Promise.resolve({ pick: "knowledge-insight" });
        if (message.includes("orchestration")) return Promise.resolve({ ok: true });
        if (message.includes("framework")) return Promise.resolve({ ok: true });
        if (message.includes("goal")) return Promise.resolve({ pick: "collaborative-research" });
        if (message.includes("evals")) return Promise.resolve({ ok: true });
        if (message.includes("memory")) return Promise.resolve({ ok: true });
        return Promise.resolve({ ok: true });
      });

      vi.doMock("inquirer", () => ({ default: { prompt: promptMock } }));

      const originalArgv = [...process.argv];
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation((() => {
          throw new Error("process.exit called");
        }) as any);
      process.argv = ["node", "scripts/new-agent.ts", TEST_AGENT_NAME];

      try {
        await import("../new-agent.js");

        const configPath = path.join(testAgentDir, "config.ts");
        for (let i = 0; i < 20 && !(await fs.pathExists(configPath)); i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      expect(await fs.pathExists(configPath)).toBe(true);

      const configText = await fs.readFile(configPath, "utf8");
      expect(configText).toContain(`id: "${TEST_AGENT_NAME}"`);
      expect(configText).toContain(`agent_type: "knowledge-insight"`);
      expect(configText).toContain(`default_orch: "orch-shared-memory"`);
      expect(configText).toContain(`goals: ["collaborative-research"]`);
      expect(configText).toContain(
        `tools_needed: ["queryKnowledgeBase","vectorSearch","summarize"]`
      );
      expect(configText).toContain(`evals: ["basic","modelgraded","system"]`);
      expect(configText).toContain(`memory: { provider: "supabase" }`);

      const toolsText = await fs.readFile(path.join(testAgentDir, "tools.ts"), "utf8");
      expect(toolsText).toContain(`"queryKnowledgeBase"`);
      expect(toolsText).toContain(`"vectorSearch"`);
      expect(toolsText).toContain(`"summarize"`);

      const evalsText = await fs.readFile(path.join(testAgentDir, "evals.ts"), "utf8");
      expect(evalsText).toMatch(/run_basic/);
      expect(evalsText).toMatch(/run_modelgraded/);
      expect(evalsText).toMatch(/run_system/);

        expect(await fs.pathExists(path.join(testAgentDir, "index.ts"))).toBe(true);
        expect(await fs.pathExists(path.join(testAgentDir, "schema.ts"))).toBe(true);

        expect(promptMock).toHaveBeenCalledTimes(6);
      } finally {
        process.argv = originalArgv;
        exitSpy.mockRestore();
      }
    },
    80000
  );
});
