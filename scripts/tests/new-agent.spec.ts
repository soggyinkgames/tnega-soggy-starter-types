import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { SequentialOrch } from "../../packages/orch-sequential/index.js";

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
    default_framework: "langgraph",
    compatible_agent_types: ["knowledge-insight", "strategy", "creative-generation"],
    recommended_for: {
        "knowledge-insight": true,
        "creative-generation": true
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
export function getGoalVariations({ agentType, templateSpecializations }) {
    if (agentType !== "creative-generation") return null;
    return (templateSpecializations ?? []).map((specialization) => ({
        name: specialization.id,
        description: specialization.description,
        outcomes: [...specialization.outputTargets],
        examples: [specialization.label],
        suitedAgents: ["creative-generation"],
        recommendedTools:
            specialization.id === "music"
                ? ["ingest.source-materials", "normalize.references", "derive.music-spec", "assemble.output-payload"]
                : ["ingest.source-materials", "normalize.references", "derive.line-art-spec", "assemble.output-payload"],
    }));
}

export async function getRecommendedTools(goalName, runtime, config) {
    if (goalName === "retrieve-and-summarize" && runtime === "langgraph") {
        return ["query_knowledge_base", "summarize_context", "trace_steps"];
    }
    if (goalName === "answer-with-citations") {
        return ["query_knowledge_base", "format_citations"];
    }
    if (config?.outputTargets?.includes("line-art") || goalName === "line-art") {
        return ["ingest.source-materials", "normalize.references", "derive.line-art-spec", "assemble.output-payload"];
    }
    if (config?.outputTargets?.includes("music") || goalName === "music") {
        return ["ingest.source-materials", "normalize.references", "derive.music-spec", "assemble.output-payload"];
    }
    return [];
}
`
        );

        await writeFile(
            "packages/orch-centralised/config.ts",
            `
export default {
    id: "orch-centralised",
    description: "Centralised orchestration.",
    supported_framework: ["langgraph", "custom-runtime"],
    default_framework: "langgraph",
    compatible_agent_types: ["knowledge-insight", "strategy"],
    recommended_for: {
        "knowledge-insight": true
    },
    memory: {
        default: "supabase",
        supported: ["supabase", "none"]
    },
    evals_default: ["basic", "system"]
};
`
        );

        await writeFile(
            "packages/orch-centralised/goals.ts",
            `
export const goals = [
    {
        name: "central-answer",
        description: "Answer from a central controller.",
        outcomes: ["answer"],
        examples: ["Central answer"],
        recommendedTools: ["query_knowledge_base"]
    }
];
`
        );

        await writeFile(
            "packages/orch-hierarchical/config.ts",
            `
export default {
    id: "orch-hierarchical",
    description: "Hierarchical coordination.",
    supported_framework: ["crewai", "custom-runtime"],
    default_framework: "crewai",
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

        for (const fileName of [
            "config.ts",
            "eval.ts",
            "index.ts",
            "plan.md",
            "scaffold.ts",
            "schema.ts",
            "test.spec.ts",
            "tools.ts",
        ]) {
            const templatePath = path.join(
                originalCwd,
                "templates",
                "agent-types",
                "3-creative-generation",
                fileName,
            );
            const content = await fs.readFile(templatePath, "utf8");
            await writeFile(
                path.join("templates", "agent-types", "3-creative-generation", fileName),
                content,
            );
        }
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
                    "creative-generation": ["modelgraded", "safety"],
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
        expect(configText).toContain(`capabilities`);
        expect(configText).toContain(`"chat": true`);
        expect(configText).toContain(`provider: "supabase"`);
        expect(configText).toContain(`"retrieve-and-summarize"`);

        expect(toolsText).toContain(`"query_knowledge_base"`);
        expect(toolsText).toContain(`"summarize_context"`);
        expect(toolsText).toContain(`"trace_steps"`);
        expect(toolsText).not.toContain(`toolingStatus`);

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
        expect(configText).toContain(`"chat": true`);
        expect(configText).toContain(`framework: "custom-runtime"`);
        expect(configText).toContain(`provider: "redis"`);

        expect(toolsText).toContain(`"query_knowledge_base"`);
        expect(toolsText).toContain(`"format_citations"`);
        expect(toolsText).not.toContain(`toolingStatus`);

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

    it("scaffolds centralised orchestration agents with chat capability", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "central-chat-agent",
            "--primary-goal", "answer-from-knowledge",
            "--type", "knowledge-insight",
            "--orch", "orch-centralised",
            "--yes",
        ];

        questionAnswers = [];

        const run = await getRun();
        await run();

        const configText = await readFile("agents/central-chat-agent/config.ts");
        expect(configText).toContain(`default_orch: "orch-centralised"`);
        expect(configText).toContain(`"chat": true`);
    });

    it("scaffolds hierarchical orchestration agents with chat capability", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "hierarchy-chat-agent",
            "--primary-goal", "generate-content",
            "--type", "strategy",
            "--orch", "orch-hierarchical",
            "--yes",
        ];

        questionAnswers = [];

        const run = await getRun();
        await run();

        const configText = await readFile("agents/hierarchy-chat-agent/config.ts");
        expect(configText).toContain(`default_orch: "orch-hierarchical"`);
        expect(configText).toContain(`"chat": true`);
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

    it("scaffolds creative-generation with explicit config and closes the sequential tools loop", async () => {
        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "creative-agent",
            "--primary-goal", "generate-content",
            "--yes",
        ];

        questionAnswers = [];

        const run = await getRun();
        await run();

        expect(existsSync(path.join(tempRoot, "agents/creative-agent/config.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/index.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/tools.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/eval.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/schema.ts"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/plan.md"))).toBe(true);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/test.spec.ts"))).toBe(false);
        expect(existsSync(path.join(tempRoot, "agents/creative-agent/evals.ts"))).toBe(false);

        process.chdir(originalCwd);

        const configModule: any = await import(
            pathToFileURL(path.join(tempRoot, "agents", "creative-agent", "config.ts")).href
        );
        const agentModule: any = await import(
            pathToFileURL(path.join(tempRoot, "agents", "creative-agent", "index.ts")).href
        );

        const agent = {
            id: configModule.default.id,
            config: configModule.default,
            run: agentModule.runAgent,
        };

        expect(configModule.default).toMatchObject({
            id: "creative-agent",
            agentType: "creative-generation",
            defaultOrchestration: "sequential",
            goalProfile: "line-art",
            inputKinds: ["prompt-text", "image-photo", "reference-set"],
            outputTargets: ["line-art"],
            framework: "langgraph",
            evals: ["modelgraded", "safety"],
            capabilities: { chat: true },
        });
        expect(configModule.default.memory).toEqual({ provider: "supabase" });
        expect(configModule.default.toolCollections).toBeUndefined();

        const toolsText = await readFile("agents/creative-agent/tools.ts");
        expect(toolsText).toContain(`"ingest.source-materials"`);
        expect(toolsText).toContain(`"derive.line-art-spec"`);
        expect(toolsText).not.toContain(`toolingStatus`);

        const result = await SequentialOrch.run(
            {
                prompt: "Hero poster concept",
                images: [{ source: "hero.png", label: "hero" }],
                format: "poster",
                references: ["ink illustration", { label: "energy", summary: "dynamic composition" }],
                style: ["bold"],
                mood: ["dramatic"],
                theme: ["heroic"],
                constraints: ["single focal character"],
            },
            [agent as any],
        );

        expect(result.result.kind).toBe("creative-generation");
        expect(result.result.goalProfile).toBe("line-art");
        expect(result.result.outputTarget).toBe("line-art");
        expect(result.result.execution.selectedToolCollections).toEqual([
            "source-material-preparation",
            "line-art-specification",
        ]);
        expect(result.result.execution.executedToolIds).toEqual([
            "ingest.source-materials",
            "normalize.references",
            "derive.line-art-spec",
            "assemble.output-payload",
        ]);
        expect(result.result.references).toHaveLength(2);
        expect(result.result.constraints.format).toBe("poster");
        expect(result.result.artifact.summary).toContain("Line art output");
    });

    it("fails for creative-generation when the template scaffold is incomplete instead of using the generic fallback", async () => {
        await fs.rm(
            path.join(tempRoot, "templates", "agent-types", "3-creative-generation", "eval.ts"),
            { force: true },
        );

        process.argv = [
            "node",
            "new-agent.ts",
            "--name", "broken-creative-agent",
            "--primary-goal", "generate-content",
            "--yes",
        ];

        questionAnswers = [];

        const run = await getRun();

        await expect(run()).rejects.toThrow(
            "creative-generation scaffolding requires the starter template files and will not use the generic fallback. Missing required files: eval.ts."
        );

        expect(existsSync(path.join(tempRoot, "agents/broken-creative-agent/config.ts"))).toBe(false);
        expect(existsSync(path.join(tempRoot, "agents/broken-creative-agent/evals.ts"))).toBe(false);
    });
});
