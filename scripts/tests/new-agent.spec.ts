import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("new-agent integration", () => {
    let tempRoot: string;
    let originalCwd: string;
    let originalArgv: string[];
    let questionAnswers: string[];
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    async function writeFile(relativePath: string, content: string) {
        const fullPath = path.join(tempRoot, relativePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf8");
    }

    async function readFile(relativePath: string) {
        return fs.readFile(path.join(tempRoot, relativePath), "utf8");
    }

    async function setupFixtureRepo() {
        await writeFile(
            "packages/orch-sequential/config.ts",
            `
export default {
    id: "orch-sequential",
    description: "Sequential orchestration for focused agents.",
    supported_framework: ["langgraph", "custom-runtime"],
    default_tooling: "langgraph",
    compatible_agent_types: ["knowledge-insight", "strategy"],
    recommended_for: {
        "knowledge-insight": true
    },
    memory: {
        default: "supabase",
        supported: ["supabase", "redis", "none"],
        notes: {
            supabase: "vector + SQL store",
            redis: "fast cache",
            none: "stateless"
        }
    },
    evals_default: ["basic", "modelgraded", "system"]
};
`
        );

        await writeFile(
            "packages/orch-sequential/goals.ts",
            `
export const goals = [
    {
        name: "retrieve-and-summarize",
        description: "Retrieve and summarize source material.",
        outcomes: ["summary", "citations"],
        examples: ["Summarize docs", "Answer from KB"],
        recommendedTools: ["query_knowledge_base", "summarize_context"]
    },
    {
        name: "answer-with-citations",
        description: "Answer using retrieved evidence.",
        outcomes: ["answer", "citations"],
        examples: ["Cited answers"],
        recommendedTools: ["query_knowledge_base", "format_citations"]
    }
];
`
        );

        await writeFile(
            "packages/orch-sequential/tools.ts",
            `
export async function getRecommendedTools(goalName, runtime) {
    if (goalName === "retrieve-and-summarize" && runtime === "langgraph") {
        return ["query_knowledge_base", "summarize_context", "trace_steps"];
    }
    if (goalName === "answer-with-citations") {
        return ["query_knowledge_base", "format_citations"];
    }
    return [];
}
`
        );

        await writeFile(
            "packages/orch-hierarchical/config.ts",
            `
export default {
    id: "orch-hierarchical",
    description: "Hierarchical coordination.",
    supported_framework: ["crewai", "custom-runtime"],
    default_tooling: "crewai",
    compatible_agent_types: ["strategy", "dev-infrastructure"],
    recommended_for: {
        "strategy": true
    },
    memory: {
        default: "redis",
        supported: ["redis", "none"]
    },
    evals_default: ["basic", "system"]
};
`
        );

        await writeFile(
            "packages/orch-hierarchical/goals.ts",
            `
export const goals = [
    {
        name: "delegate-specialists",
        description: "Delegate work to specialists.",
        outcomes: ["delegation-plan"],
        examples: ["Route tasks"],
        recommendedTools: ["assign_task"]
    }
];
`
        );

        await writeFile(
            "templates/agent-types/knowledge-insight/config.ts",
            `
export default {
    evals: ["basic", "modelgraded", "system", "safety"]
};
`
        );

        await writeFile(
            "templates/agent-types/strategy/config.ts",
            `
export default {
    evals: ["basic", "system", "regression"]
};
`
        );
    }

    async function importSubject() {
        vi.resetModules();

        vi.doMock("node:readline/promises", () => {
            return {
                default: {
                    createInterface: () => ({
                        question: vi.fn(async () => {
                            const next = questionAnswers.shift();
                            return next ?? "";
                        }),
                        close: vi.fn(async () => undefined),
                    }),
                },
            };
        });

        vi.doMock("chalk", () => {
            const passthrough = (value: string) => value;
            return {
                default: {
                    blue: passthrough,
                    cyan: passthrough,
                    green: passthrough,
                    yellow: passthrough,
                    red: passthrough,
                },
            };
        });

        vi.doMock("lib/defaultEvals", () => {
            return {
                DEFAULT_EVALS: {
                    "knowledge-insight": ["basic", "modelgraded", "system"],
                    strategy: ["basic", "system", "regression"],
                },
            };
        });

        return import("../new-agent.js");
    }

    async function getRun() {
        const subject: any = await importSubject();
        const run = subject.run ?? subject.default?.run;

        if (typeof run !== "function") {
            throw new Error("Could not find run() export on new-agent module");
        }

        return run;
    }

    beforeEach(async () => {
        originalCwd = process.cwd();
        originalArgv = [...process.argv];
        tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "new-agent-spec-"));
        process.chdir(tempRoot);
        questionAnswers = [];
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        await setupFixtureRepo();
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        process.argv = originalArgv;
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        vi.resetModules();
        vi.clearAllMocks();
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("creates an agent end-to-end in guided mode", async () => {
        process.argv = ["node", "new-agent.ts"];

        questionAnswers = [
            "my-agent",
            "1",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ];

        const run = await getRun();
        await run();

        expect(existsSync(path.join(tempRoot, "agents/my-agent/config.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/my-agent/index.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/my-agent/tools.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/my-agent/evals.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/my-agent/schema.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/my-agent/BUILD_NOTES.md"))).toBe(true);

        const configText = await readFile("agents/my-agent/config.ts");
        const toolsText = await readFile("agents/my-agent/tools.ts");
        const evalsText = await readFile("agents/my-agent/evals.ts");
        const notesText = await readFile("agents/my-agent/BUILD_NOTES.md");

        expect(configText).toContain(`id: "my-agent"`);
        expect(configText).toContain(`primary_goal: "answer-from-knowledge"`);
        expect(configText).toContain(`agent_type: "knowledge-insight"`);
        expect(configText).toContain(`default_orch: "orch-sequential"`);
        expect(configText).toContain(`framework: "langgraph"`);
        expect(configText).toContain(`provider: "supabase"`);
        expect(configText).toContain(`"retrieve-and-summarize"`);

        expect(toolsText).toContain(`"query_knowledge_base"`);
        expect(toolsText).toContain(`"summarize_context"`);
        expect(toolsText).toContain(`"trace_steps"`);

        expect(evalsText).toContain(`run_basic`);
        expect(evalsText).toContain(`run_modelgraded`);
        expect(evalsText).toContain(`run_system`);
        expect(evalsText).toContain(`run_safety`);
        expect(evalsText).not.toContain(`run_regression`);

        expect(notesText).toContain(`Primary goal: answer-from-knowledge`);
        expect(notesText).toContain(`Agent type: knowledge-insight`);
        expect(notesText).toContain(`Orchestration: orch-sequential`);
    });

    it("supports flag-prefill plus guided adapt for later steps", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "prefilled-agent",
            "--primary-goal", "answer-from-knowledge",
            "--type", "knowledge-insight",
            "--orch", "orch-sequential",
            "--goal", "answer-with-citations",
        ];

        questionAnswers = [
            "",
            "",
            "",
            "n",
            "2",
            "n",
            "1,2,3,4,5",
            "n",
            "2",
            "",
            "",
        ];

        const run = await getRun();
        await run();

        const configText = await readFile("agents/prefilled-agent/config.ts");
        const toolsText = await readFile("agents/prefilled-agent/tools.ts");
        const evalsText = await readFile("agents/prefilled-agent/evals.ts");

        expect(configText).toContain(`id: "prefilled-agent"`);
        expect(configText).toContain(`"answer-with-citations"`);
        expect(configText).toContain(`framework: "custom-runtime"`);
        expect(configText).toContain(`provider: "redis"`);

        expect(toolsText).toContain(`"query_knowledge_base"`);
        expect(toolsText).toContain(`"format_citations"`);

        expect(evalsText).toContain(`run_basic`);
        expect(evalsText).toContain(`run_modelgraded`);
        expect(evalsText).toContain(`run_system`);
        expect(evalsText).toContain(`run_safety`);
        expect(evalsText).toContain(`run_regression`);
    });

    it("supports dry-run and does not write files", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "dry-agent",
            "--primary-goal", "answer-from-knowledge",
            "--yes",
            "--dry-run",
        ];

        questionAnswers = [];

        const run = await getRun();
        await run();

        expect(existsSync(path.join(tempRoot, "agents/dry-agent/config.ts"))).toBe(false);
        expect(consoleLogSpy.mock.calls.flat().join("\n")).toContain("Dry run");
    });

    it("fails loudly for invalid orchestration + agent type combination", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "bad-agent",
            "--primary-goal", "answer-from-knowledge",
            "--type", "knowledge-insight",
            "--orch", "orch-hierarchical",
            "--yes",
        ];

        questionAnswers = [];

        const run = await getRun();

        await expect(run()).rejects.toThrow(
            `Orchestration "orch-hierarchical" is not compatible with agent type "knowledge-insight".`
        );
    });

    it("prefers existing agent config evals over template/orchestration defaults when rerunning", async () => {
        await writeFile(
            "agents/existing-agent/config.ts",
            `
export default {
    id: "existing-agent",
    agent_type: "knowledge-insight",
    default_orch: "orch-sequential",
    tooling: { framework: "langgraph" },
    goals: ["retrieve-and-summarize"],
    evals: ["basic", "regression"],
    memory: { provider: "supabase" }
};
`
        );

        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "existing-agent",
        ];

        questionAnswers = [
            "1",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ];

        const run = await getRun();
        await run();

        const evalsText = await readFile("agents/existing-agent/evals.ts");
        expect(evalsText).toContain(`run_basic`);
        expect(evalsText).toContain(`run_regression`);
        expect(evalsText).not.toContain(`run_safety`);
    });
});