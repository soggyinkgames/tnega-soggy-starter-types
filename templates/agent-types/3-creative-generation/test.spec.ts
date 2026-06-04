import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const templateDir = fileURLToPath(new URL(".", import.meta.url));

const creativeTemplateFiles = [
    "config.ts",
    "eval.ts",
    "index.ts",
    "schema.ts",
    "tools.ts",
] as const;

const creativeTemplateReplacements: Record<string, string> = {
    "__AGENT_NAME__": "creative-agent",
    "__DEFAULT_ORCHESTRATION__": "sequential",
    "__GOAL_PROFILE__": "staged-transformation",
    "__INPUT_KINDS_JSON__": JSON.stringify(["prompt-text", "image-photo", "reference-set"]),
    "__OUTPUT_TARGETS_JSON__": JSON.stringify(["line-art"]),
    "__TOOLS_JSON__": JSON.stringify([
        "ingest.source-materials",
        "normalize.references",
        "derive.line-art-spec",
        "assemble.output-payload",
    ]),
    "__EVALS_JSON__": JSON.stringify(["modelgraded", "safety"]),
    "__CAPABILITIES_JSON__": JSON.stringify({ chat: true }),
    "__MEMORY_PROVIDER__": "redis",
    "__FRAMEWORK__": "langgraph",
};

function renderTemplateContent(content: string): string {
    let rendered = content;

    for (const [placeholder, value] of Object.entries(creativeTemplateReplacements)) {
        rendered = rendered.split(placeholder).join(value);
    }

    return rendered;
}

async function renderCreativeTemplateFixture() {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "creative-template-"));
    const tempDir = path.join(tempRoot, "agents", "creative-agent");

    await fs.mkdir(tempDir, { recursive: true });

    for (const fileName of creativeTemplateFiles) {
        const templatePath = path.join(templateDir, fileName);
        const renderedPath = path.join(tempDir, fileName);
        const content = await fs.readFile(templatePath, "utf8");
        await fs.writeFile(renderedPath, renderTemplateContent(content), "utf8");
    }

    const [{ runAgent }, schemaModule, { default: config }] = await Promise.all([
        import(pathToFileURL(path.join(tempDir, "index.ts")).href),
        import(pathToFileURL(path.join(tempDir, "schema.ts")).href),
        import(pathToFileURL(path.join(tempDir, "config.ts")).href),
    ]);

    return {
        tempRoot,
        tempDir,
        runAgent,
        config,
        ...schemaModule,
    };
}

describe("creative-generation template", () => {
    it("enables chat capability", async () => {
        const { config, tempRoot } = await renderCreativeTemplateFixture();

        expect(config.capabilities).toEqual({ chat: true });
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("normalizes multimodal inputs without forcing a prompt-only brief", async () => {
        const { normalizeCreativeGenerationInput, tempRoot } = await renderCreativeTemplateFixture();
        const normalized = normalizeCreativeGenerationInput({
            images: [{ source: "moodboard.png", label: "moodboard" }],
            references: ["ink study"],
        });

        expect(normalized.prompt).toBeUndefined();
        expect(normalized.images).toHaveLength(1);
        expect(normalized.references).toHaveLength(1);
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("validates the explicit creative-generation config shape", async () => {
        const {
            assertCreativeGenerationConfig,
            config,
            tempRoot,
        } = await renderCreativeTemplateFixture();

        expect(assertCreativeGenerationConfig(config)).toMatchObject({
            agentType: "creative-generation",
            defaultOrchestration: "sequential",
            inputKinds: ["prompt-text", "image-photo", "reference-set"],
            outputTargets: ["line-art"],
            capabilities: { chat: true },
            framework: "langgraph",
        });
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("rejects config without chat capability", async () => {
        const {
            assertCreativeGenerationConfig,
            config,
            tempRoot,
        } = await renderCreativeTemplateFixture();

        expect(() =>
            assertCreativeGenerationConfig({
                ...config,
                capabilities: {},
            })
        ).toThrow("CreativeGenerationConfig.capabilities.chat must be enabled.");
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("asserts output shape", async () => {
        const { assertCreativeGenerationOutput, tempRoot } = await renderCreativeTemplateFixture();
        const output = assertCreativeGenerationOutput({
            kind: "creative-generation",
            agentId: "creative-agent",
            goalProfile: "staged-transformation",
            outputTarget: "line-art",
            brief: {
                prompt: "Poster idea",
                deliverable: "illustration",
            },
            references: [],
            constraints: {
                style: [],
                mood: [],
                theme: [],
                format: "illustration",
                constraints: [],
            },
            artifact: {
                title: "Line art illustration",
                summary: "Concept summary",
                format: "illustration",
                prompt: "Poster idea",
            },
            execution: {
                selectedToolCollections: [
                    "source-material-preparation",
                    "line-art-specification",
                ],
                executedToolIds: ["ingest.source-materials"],
            },
        });

        expect(output.execution.selectedToolCollections).toEqual([
            "source-material-preparation",
            "line-art-specification",
        ]);
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("fails predictably on invalid intermediate tool state", async () => {
        const { runAgent, tempRoot } = await renderCreativeTemplateFixture();

        await expect(
            runAgent(
                { prompt: "Poster idea" },
                {
                    selectedToolCollections: ["source-material-preparation"],
                    selectedToolIds: ["ingest.source-materials"],
                    executeTool: async () => ({ broken: true }),
                }
            )
        ).rejects.toThrow(
            "CreativeGenerationState after ingest.source-materials is invalid: CreativeGenerationConfig must be an object."
        );
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("requires orchestration-provided tool execution context", async () => {
        const { runAgent, tempRoot } = await renderCreativeTemplateFixture();

        await expect(runAgent({ prompt: "Poster idea" })).rejects.toThrow(
            "Creative generation run requires orchestration-selected tools and executeTool()."
        );
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("fails predictably on invalid final output shape", async () => {
        const { runAgent, tempRoot } = await renderCreativeTemplateFixture();

        await expect(
            runAgent(
                { prompt: "Poster idea" },
                {
                    selectedToolCollections: ["source-material-preparation"],
                    selectedToolIds: ["assemble.output-payload"],
                    executeTool: async (_toolId: string, state: Record<string, unknown>) => ({
                        ...state,
                        result: {},
                    }),
                }
            )
        ).rejects.toThrow(
            "CreativeGenerationState after assemble.output-payload is invalid: State has an invalid result.outputTarget."
        );
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("rejects orchestration-selected tools that were not declared by the template", async () => {
        const { runAgent, tempRoot } = await renderCreativeTemplateFixture();

        await expect(
            runAgent(
                { prompt: "Poster idea" },
                {
                    selectedToolCollections: ["source-material-preparation"],
                    selectedToolIds: ["derive.music-spec"],
                    executeTool: async (_toolId: string, state: Record<string, unknown>) => state,
                }
            )
        ).rejects.toThrow(
            'Creative generation run received undeclared tool "derive.music-spec".'
        );
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("renders the eval template without placeholder fallbacks", async () => {
        const { tempDir, tempRoot } = await renderCreativeTemplateFixture();
        const renderedEval = await fs.readFile(path.join(tempDir, "eval.ts"), "utf8");

        expect(renderedEval).toContain(
            `for (const evalId of JSON.parse('["modelgraded","safety"]') as string[])`,
        );
        expect(renderedEval).not.toContain("unresolvedTemplatePlaceholderPattern");
        expect(renderedEval).not.toContain("parseTemplateList");
        await fs.rm(tempRoot, { recursive: true, force: true });
    });

    it("renders actual required tool ids into tools.ts", async () => {
        const { tempDir, tempRoot } = await renderCreativeTemplateFixture();
        const renderedTools = await fs.readFile(path.join(tempDir, "tools.ts"), "utf8");

        expect(renderedTools).toContain("ingest.source-materials");
        expect(renderedTools).toContain("normalize.references");
        expect(renderedTools).toContain("derive.line-art-spec");
        expect(renderedTools).toContain("assemble.output-payload");
        expect(renderedTools).not.toContain("executionContext");
        await fs.rm(tempRoot, { recursive: true, force: true });
    });
});
