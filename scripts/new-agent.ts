#!/usr/bin/env tsx

/**
 * ============================================================================
 * NEW AGENT
 * Goal-first guided scaffolder
 * ----------------------------------------------------------------------------
 * Flow:
 *   1. Agent name
 *   2. Primary goal
 *   3. Agent type
 *   4. Goal variation
 *   5. Orchestration
 *   6. Framework
 *   7. Evals
 *   8. Memory
 *   9. Tools
 *  10. Summary
 *  11. Write files
 *
 * Design:
 * - guided by default
 * - flags prefill steps
 * - --yes allows non-interactive acceptance
 * - --dry-run previews without writing
 * - no hidden npm dependencies
 * - only uses built-in Node + project source-of-truth files
 * ============================================================================
 */

import fs from "fs-extra";
import path from "path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import chalk from "chalk";
import { DEFAULT_EVALS } from "lib/defaultEvals";

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

type OrchConfig = {
    id: string;
    description?: string;
    supported_framework: string[];
    default_framework: string;
    compatible_agent_types?: string[];
    recommended_for?: Record<string, boolean>;
    memory?: {
        default: string;
        supported: string[];
        notes?: Record<string, string>;
    };
    evals_default?: string[];
};

type Goal = {
    name: string;
    description?: string;
    outcomes?: string[];
    examples?: string[];
    recommendedTools?: string[];
};

type PrimaryGoal = {
    id: string;
    label: string;
    description?: string;
    recommended_agent_types: string[];
};

type AgentTemplateConfig = {
    evals?: string[];
};

type ExistingAgentConfig = {
    id?: string;
    agent_type?: string;
    default_orch?: string;
    tooling?: { framework?: string };
    goals?: string[];
    outcomes?: string[];
    tools_needed?: string[];
    evals?: string[];
    memory?: { provider?: string };
    self_build?: boolean;
};

type ParsedArgs = {
    name?: string;
    primaryGoal?: string;
    type?: string;
    goal?: string;
    orch?: string;
    framework?: string;
    memory?: string;
    evals?: string[];
    tools?: string[];
    yes: boolean;
    dryRun: boolean;
};

type ResolvedSelection = {
    agentName: string;
    primaryGoal: PrimaryGoal;
    agentType: string;
    goalVariation: Goal | null;
    orchestration: OrchConfig;
    framework: string;
    evals: string[];
    memoryProvider: string;
    tools: string[];
    existingAgentConfig: ExistingAgentConfig | null;
};

type SourceSummary = {
    primaryGoalSource: string;
    agentTypeSource: string;
    goalSource: string;
    orchSource: string;
    frameworkSource: string;
    evalsSource: string;
    memorySource: string;
    toolsSource: string;
};

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

const ALL_EVALS = ["basic", "modelgraded", "system", "safety", "regression"];

const TEMPLATES_ROOT = path.resolve("templates", "agent-types");
const PACKAGES_ROOT = path.resolve("packages");
const AGENTS_ROOT = path.resolve("agents");

/**
 * ============================================================================
 * PRIMARY GOALS REGISTRY
 * ----------------------------------------------------------------------------
 * Replace or move this later if you want it externalized.
 * This is the human-facing first step.
 * ============================================================================
 */

const PRIMARY_GOALS: PrimaryGoal[] = [
    {
        id: "answer-from-knowledge",
        label: "Answer from knowledge",
        description: "Retrieve, synthesize, and answer from known sources.",
        recommended_agent_types: ["knowledge-insight", "educational"],
    },
    {
        id: "generate-content",
        label: "Generate content",
        description: "Create, transform, or expand content from inputs.",
        recommended_agent_types: ["creative-generation", "strategy"],
    },
    {
        id: "analyze-and-recommend",
        label: "Analyze and recommend",
        description: "Review inputs and produce a reasoned recommendation.",
        recommended_agent_types: ["strategy", "data-analyst-debugger"],
    },
    {
        id: "coordinate-specialists",
        label: "Coordinate specialists",
        description: "Route work across multiple roles or capabilities.",
        recommended_agent_types: ["dev-infrastructure", "strategy"],
    },
    {
        id: "simulate-scenarios",
        label: "Simulate scenarios",
        description: "Explore possible outcomes, tradeoffs, or branches.",
        recommended_agent_types: ["simulation-scenario", "strategy"],
    },
    {
        id: "guide-a-workflow",
        label: "Guide a workflow",
        description: "Assist a user through steps, decisions, or tasks.",
        recommended_agent_types: ["personal-workflow-assistant", "educational"],
    },
];

/**
 * ============================================================================
 * CLI / ARG PARSING
 * ============================================================================
 */

function parseArgs(argv: string[]): ParsedArgs {
    const args: ParsedArgs = {
        yes: false,
        dryRun: false,
    };

    const positionals: string[] = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (!arg.startsWith("--")) {
            positionals.push(arg);
            continue;
        }

        const next = argv[i + 1];

        switch (arg) {
            case "--name":
                args.name = next;
                i++;
                break;
            case "--primary-goal":
                args.primaryGoal = next;
                i++;
                break;
            case "--type":
                args.type = next;
                i++;
                break;
            case "--goal":
                args.goal = next;
                i++;
                break;
            case "--orch":
                args.orch = next;
                i++;
                break;
            case "--framework":
                args.framework = next;
                i++;
                break;
            case "--memory":
                args.memory = next;
                i++;
                break;
            case "--evals":
                args.evals = (next ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                i++;
                break;
            case "--tools":
                args.tools = (next ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                i++;
                break;
            case "--yes":
                args.yes = true;
                break;
            case "--dry-run":
                args.dryRun = true;
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!args.name && positionals.length) {
        args.name = positionals[0];
    }

    return args;
}

/**
 * ============================================================================
 * READLINE HELPERS
 * ============================================================================
 */

const rl = readline.createInterface({ input, output });

async function ask(question: string): Promise<string> {
    const answer = await rl.question(question);
    return answer.trim();
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
    const suffix = defaultYes ? " [Y/n]: " : " [y/N]: ";
    const answer = (await ask(question + suffix)).toLowerCase();

    if (!answer) return defaultYes;
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;

    console.log(chalk.yellow("Please answer y or n."));
    return confirm(question, defaultYes);
}

async function inputText(
    label: string,
    defaultValue?: string,
    validate?: (value: string) => true | string
): Promise<string> {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    const answer = await ask(`${label}${suffix}: `);
    const value = answer || defaultValue || "";

    if (validate) {
        const result = validate(value);
        if (result !== true) {
            console.log(chalk.yellow(result));
            return inputText(label, defaultValue, validate);
        }
    }

    return value;
}

async function selectOne(
    label: string,
    choices: string[],
    recommended?: string
): Promise<string> {
    console.log(chalk.blue(`\n— ${label} —`));
    choices.forEach((choice, i) => {
        const marker = choice === recommended ? " (recommended)" : "";
        console.log(`  ${i + 1}. ${choice}${marker}`);
    });

    const raw = await ask("Choose number: ");
    const index = Number(raw);

    if (!Number.isInteger(index) || index < 1 || index > choices.length) {
        console.log(chalk.yellow("Invalid selection."));
        return selectOne(label, choices, recommended);
    }

    return choices[index - 1];
}

async function selectMany(
    label: string,
    choices: string[],
    recommended: string[] = []
): Promise<string[]> {
    console.log(chalk.blue(`\n— ${label} —`));
    choices.forEach((choice, i) => {
        const marker = recommended.includes(choice) ? " [recommended]" : "";
        console.log(`  ${i + 1}. ${choice}${marker}`);
    });
    console.log("Enter comma-separated numbers, e.g. 1,3,5");

    const raw = await ask("Choose: ");
    const indexes = raw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= choices.length);

    const resolved = Array.from(new Set(indexes)).map((i) => choices[i - 1]);

    if (!resolved.length) {
        console.log(chalk.yellow("No valid selections."));
        return selectMany(label, choices, recommended);
    }

    return resolved;
}

async function useOrAdaptOne(params: {
    sectionLabel: string;
    currentValue: string;
    recommendedValue: string;
    choices: string[];
    why?: string;
    nonInteractive: boolean;
}): Promise<string> {
    const { sectionLabel, currentValue, recommendedValue, choices, why, nonInteractive } = params;

    console.log(chalk.blue(`\n— ${sectionLabel} —`));
    console.log(`Recommended: ${recommendedValue}`);
    if (currentValue !== recommendedValue) {
        console.log(`Prefilled/current: ${currentValue}`);
    }
    if (why) {
        console.log(`Why: ${why}`);
    }

    if (nonInteractive) return currentValue;

    const keep = await confirm(`Use "${currentValue}"?`, true);
    if (keep) return currentValue;

    return selectOne(sectionLabel, choices, currentValue);
}

async function useOrAdaptMany(params: {
    sectionLabel: string;
    currentValues: string[];
    recommendedValues: string[];
    choices: string[];
    why?: string;
    nonInteractive: boolean;
}): Promise<string[]> {
    const { sectionLabel, currentValues, recommendedValues, choices, why, nonInteractive } = params;

    console.log(chalk.blue(`\n— ${sectionLabel} —`));
    console.log(`Recommended: ${recommendedValues.join(", ") || "(none)"}`);
    if (why) {
        console.log(`Why: ${why}`);
    }
    if (
        currentValues.join("|") !== recommendedValues.join("|") &&
        currentValues.length
    ) {
        console.log(`Prefilled/current: ${currentValues.join(", ")}`);
    }

    if (nonInteractive) return currentValues;

    const keep = await confirm(`Use these ${sectionLabel.toLowerCase()}?`, true);
    if (keep) return currentValues;

    return selectMany(sectionLabel, choices, currentValues);
}

/**
 * ============================================================================
 * FILE / MODULE HELPERS
 * ============================================================================
 */

function toFileUrl(p: string) {
    return pathToFileURL(p).href;
}

async function safeImport<T = any>(p: string): Promise<T | null> {
    try {
        return (await import(toFileUrl(p))) as T;
    } catch {
        return null;
    }
}

function unique<T>(values: T[]): T[] {
    return Array.from(new Set(values));
}

function normalizeAgentType(value: string): string {
    return value.replace(/^\d+-/, "").trim().toLowerCase();
}

function normalizeEvalName(value: string): string {
    const v = value.trim().toLowerCase();
    if (v === "model-graded") return "modelgraded";
    return v;
}

function validateKebabCase(value: string): true | string {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
        ? true
        : "Use kebab-case, e.g. my-agent";
}

/**
 * ============================================================================
 * LOADERS
 * ============================================================================
 */

async function loadOrchestrationConfigs(): Promise<OrchConfig[]> {
    if (!(await fs.pathExists(PACKAGES_ROOT))) {
        throw new Error(`Packages folder not found at: ${PACKAGES_ROOT}`);
    }

    const dirs = (await fs.readdir(PACKAGES_ROOT)).filter((d) => d.startsWith("orch-"));
    const configs: OrchConfig[] = [];

    for (const dir of dirs) {
        const cfgPath = path.join(PACKAGES_ROOT, dir, "config.ts");
        const mod = await safeImport<{ default?: OrchConfig }>(cfgPath);
        if (mod?.default) configs.push(mod.default);
    }

    return configs;
}

async function loadGoalsForOrchestration(orchId: string): Promise<Goal[]> {
    const mod = await safeImport<{ goals?: Goal[] }>(
        path.resolve(PACKAGES_ROOT, orchId, "goals.ts")
    );

    return mod?.goals ?? [];
}

async function loadOrchestrationToolsModule(orchId: string): Promise<any | null> {
    return safeImport(path.resolve(PACKAGES_ROOT, orchId, "tools.ts"));
}

async function loadExistingAgentConfig(agentName: string): Promise<ExistingAgentConfig | null> {
    const cfgPath = path.join(AGENTS_ROOT, agentName, "config.ts");
    if (!existsSync(cfgPath)) return null;

    const mod = await safeImport<{ default?: ExistingAgentConfig }>(cfgPath);
    return mod?.default ?? null;
}

async function loadTemplateEvals(agentTypeSlug: string): Promise<string[]> {
    if (!(await fs.pathExists(TEMPLATES_ROOT))) return [];

    const templateDirs = await fs.readdir(TEMPLATES_ROOT);

    for (const dir of templateDirs) {
        const normalized = normalizeAgentType(dir);
        if (normalized !== agentTypeSlug) continue;

        const cfgPath = path.join(TEMPLATES_ROOT, dir, "config.ts");
        const mod = await safeImport<{ default?: AgentTemplateConfig }>(cfgPath);
        const cfg = mod?.default;

        if (cfg?.evals?.length) {
            return cfg.evals.map(normalizeEvalName);
        }

        const fallback = DEFAULT_EVALS[dir] ?? DEFAULT_EVALS[normalized];
        if (fallback?.length) {
            return fallback.map(normalizeEvalName);
        }
    }

    return [];
}

/**
 * ============================================================================
 * RESOLUTION HELPERS
 * ============================================================================
 */

function getAllAgentTypesFromOrchs(orchs: OrchConfig[]): string[] {
    const set = new Set<string>();

    for (const orch of orchs) {
        for (const t of orch.compatible_agent_types ?? []) {
            set.add(t);
        }
    }

    return Array.from(set);
}

function getRecommendedAgentTypeForPrimaryGoal(
    primaryGoal: PrimaryGoal,
    availableAgentTypes: string[]
): string {
    const firstMatch = primaryGoal.recommended_agent_types.find((t) =>
        availableAgentTypes.includes(t)
    );

    if (!firstMatch) {
        throw new Error(
            `Primary goal "${primaryGoal.id}" has no recommended agent type available in orchestration configs.`
        );
    }

    return firstMatch;
}

function getCompatibleOrchestrations(
    orchs: OrchConfig[],
    agentType: string
): OrchConfig[] {
    return orchs.filter((o) => (o.compatible_agent_types ?? []).includes(agentType));
}

function getRecommendedOrchestration(
    compatibleOrchs: OrchConfig[],
    agentType: string
): OrchConfig {
    const recommended =
        compatibleOrchs.find((o) => o.recommended_for?.[agentType]) ?? compatibleOrchs[0];

    if (!recommended) {
        throw new Error(`No compatible orchestration found for agent type "${agentType}".`);
    }

    return recommended;
}

function getMemoryConfig(orch: OrchConfig) {
    return (
        orch.memory ?? {
            default: "supabase",
            supported: ["supabase", "redis", "file", "none"],
            notes: {
                supabase: "vector + SQL store (good long-term shared memory)",
                redis: "fast ephemeral memory / cache",
                file: "local development memory",
                none: "stateless",
            },
        }
    );
}

function resolveRecommendedEvals(params: {
    flagEvals?: string[];
    existingAgentEvals?: string[];
    templateEvals?: string[];
    orchEvals?: string[];
}): { evals: string[]; source: string } {
    const fromFlags =
        params.flagEvals?.map(normalizeEvalName).filter(Boolean) ?? [];
    const fromExisting =
        params.existingAgentEvals?.map(normalizeEvalName).filter(Boolean) ?? [];
    const fromTemplate =
        params.templateEvals?.map(normalizeEvalName).filter(Boolean) ?? [];
    const fromOrch =
        params.orchEvals?.map(normalizeEvalName).filter(Boolean) ?? [];

    let picked: string[];
    let source: string;

    if (fromFlags.length) {
        picked = fromFlags;
        source = "CLI flags";
    } else if (fromExisting.length) {
        picked = fromExisting;
        source = "existing agent config";
    } else if (fromTemplate.length) {
        picked = fromTemplate;
        source = "agent template config";
    } else if (fromOrch.length) {
        picked = fromOrch;
        source = "orchestration config";
    } else {
        picked = ALL_EVALS;
        source = "fallback default";
    }

    return {
        evals: unique(picked).filter((e) => ALL_EVALS.includes(e)),
        source,
    };
}

async function resolveRecommendedTools(params: {
    flagTools?: string[];
    selectedGoal: Goal | null;
    orchestrationId: string;
    framework: string;
}): Promise<{ tools: string[]; source: string }> {
    const flagTools = params.flagTools?.filter(Boolean) ?? [];
    if (flagTools.length) {
        return { tools: unique(flagTools), source: "CLI flags" };
    }

    const toolsMod = await loadOrchestrationToolsModule(params.orchestrationId);

    if (toolsMod?.getRecommendedTools && params.selectedGoal) {
        try {
            const fromModule = await toolsMod.getRecommendedTools(
                params.selectedGoal.name,
                params.framework
            );
            if (Array.isArray(fromModule) && fromModule.length) {
                return { tools: unique(fromModule), source: "orchestration tools resolver" };
            }
        } catch {
            // intentionally fall through
        }
    }

    if (params.selectedGoal?.recommendedTools?.length) {
        return {
            tools: unique(params.selectedGoal.recommendedTools),
            source: "goal definition",
        };
    }

    return { tools: [], source: "no tool recommendation found" };
}

/**
 * ============================================================================
 * SUMMARY / DISPLAY HELPERS
 * ============================================================================
 */

function printHeader() {
    console.log(chalk.cyan("\n══════════════════════════════════════════════════════"));
    console.log(chalk.cyan(" NEW AGENT"));
    console.log(chalk.cyan(" Goal-first guided scaffolder"));
    console.log(chalk.cyan("══════════════════════════════════════════════════════\n"));
}

function printPrimaryGoalOptions() {
    console.log(chalk.blue("\n— Primary Goals —"));
    PRIMARY_GOALS.forEach((goal, i) => {
        console.log(`  ${i + 1}. ${goal.label}`);
        if (goal.description) console.log(`     ${goal.description}`);
    });
}

function printGoalVariationDetails(goals: Goal[]) {
    console.log(chalk.blue("\n— Goal Variations —"));
    for (const g of goals) {
        console.log(`\n🧭 ${g.name}`);
        if (g.description) console.log(`   ${g.description}`);
        if (g.outcomes?.length) console.log(`   Outcomes: ${g.outcomes.join(", ")}`);
        if (g.examples?.length) {
            console.log("   Example uses:");
            g.examples.forEach((ex) => console.log(`     - ${ex}`));
        }
    }
    console.log("");
}

function printFinalSummary(resolved: ResolvedSelection, sources: SourceSummary, dryRun: boolean) {
    console.log(chalk.green("\n══════════════════════════════════════════════════════"));
    console.log(chalk.green(dryRun ? " DRY RUN SUMMARY" : " FINAL SUMMARY"));
    console.log(chalk.green("══════════════════════════════════════════════════════"));

    console.log(`\nAgent: ${resolved.agentName}`);
    console.log(`Primary goal: ${resolved.primaryGoal.label}  (${sources.primaryGoalSource})`);
    console.log(`Agent type: ${resolved.agentType}  (${sources.agentTypeSource})`);
    console.log(
        `Goal variation: ${resolved.goalVariation?.name ?? "(none)"}  (${sources.goalSource})`
    );
    console.log(`Orchestration: ${resolved.orchestration.id}  (${sources.orchSource})`);
    console.log(`Framework: ${resolved.framework}  (${sources.frameworkSource})`);
    console.log(`Evals: ${resolved.evals.join(", ") || "(none)"}  (${sources.evalsSource})`);
    console.log(`Memory: ${resolved.memoryProvider}  (${sources.memorySource})`);
    console.log(`Tools: ${resolved.tools.join(", ") || "(none)"}  (${sources.toolsSource})`);

    if (resolved.goalVariation?.outcomes?.length) {
        console.log(`Outcomes: ${resolved.goalVariation.outcomes.join(", ")}`);
    }

    console.log("\nNotes:");
    console.log("- tooling may be partial depending on current repo state");
    console.log("- memory provider may be selected before full backend wiring is complete");
    console.log("- generated files should be manually reviewed before treating as canonical");
    console.log("");
}

/**
 * ============================================================================
 * GENERATORS
 * ============================================================================
 */

function buildConfigText(params: {
    agentName: string;
    agentType: string;
    orchType: string;
    framework: string;
    selectedGoal: Goal | null;
    finalEvals: string[];
    memoryProvider: string;
    tools: string[];
    primaryGoalId: string;
}) {
    return `
export default {
    id: "${params.agentName}",
    primary_goal: "${params.primaryGoalId}",
    agent_type: "${params.agentType}",
    default_orch: "${params.orchType}",
    tooling: {
        framework: "${params.framework}",
        status: "partial"
    },
    goals: ${params.selectedGoal ? JSON.stringify([params.selectedGoal.name], null, 4) : "[]"},
    outcomes: ${params.selectedGoal ? JSON.stringify(params.selectedGoal.outcomes ?? [], null, 4) : "[]"},
    tools_needed: ${JSON.stringify(params.tools, null, 4)},
    evals: ${JSON.stringify(params.finalEvals, null, 4)},
    memory: {
        provider: "${params.memoryProvider}",
        status: "planned"
    },
    self_build: false
};
`.trimStart();
}

function buildEvalsText(finalEvals: string[]) {
    return finalEvals
        .map((e) => {
            const fn = `run_${e.replace(/[^a-z0-9_]/gi, "_")}`;
            return `export async function ${fn}() { return { result: "ok", eval: "${e}" }; }`;
        })
        .join("\n");
}

function buildToolsText(tools: string[]) {
    return `
export const requiredTools = ${JSON.stringify(tools, null, 4)};

export const toolingStatus = {
    status: "partial",
    note: "Verify each resolved tool exists and is wired before production use."
};
`.trimStart();
}

function buildIndexText() {
    return `
import config from "./config";
import { requiredTools, toolingStatus } from "./tools";

export async function runAgent(query: string) {
    return {
        output: \`Echo:\${query}\`,
        config,
        requiredTools,
        toolingStatus
    };
}

export default { runAgent };
`.trimStart();
}

function buildSchemaText() {
    return `
export interface AgentSchema {
    id: string;
    input: string;
    output: string;
}
`.trimStart();
}

function buildBuildNotesText(resolved: ResolvedSelection, sources: SourceSummary) {
    return `
# Build Notes

## Generated from
- Primary goal: ${resolved.primaryGoal.id} (${sources.primaryGoalSource})
- Agent type: ${resolved.agentType} (${sources.agentTypeSource})
- Goal variation: ${resolved.goalVariation?.name ?? "(none)"} (${sources.goalSource})
- Orchestration: ${resolved.orchestration.id} (${sources.orchSource})
- Framework: ${resolved.framework} (${sources.frameworkSource})
- Evals: ${resolved.evals.join(", ") || "(none)"} (${sources.evalsSource})
- Memory: ${resolved.memoryProvider} (${sources.memorySource})
- Tools: ${resolved.tools.join(", ") || "(none)"} (${sources.toolsSource})

## Manual verification checklist
- Confirm orchestration is implemented and intended for this agent type
- Confirm each tool exists and is discoverable in current tooling architecture
- Confirm memory provider is actually wired
- Replace placeholder runtime logic in index.ts
- Replace placeholder eval stubs in evals.ts with real eval implementation
- Add tests once scaffold shape is confirmed
`.trimStart();
}

async function writeAgentFiles(resolved: ResolvedSelection, sources: SourceSummary, dryRun: boolean) {
    const agentDir = path.join(AGENTS_ROOT, resolved.agentName);

    const files: Record<string, string> = {
        "config.ts": buildConfigText({
            agentName: resolved.agentName,
            agentType: resolved.agentType,
            orchType: resolved.orchestration.id,
            framework: resolved.framework,
            selectedGoal: resolved.goalVariation,
            finalEvals: resolved.evals,
            memoryProvider: resolved.memoryProvider,
            tools: resolved.tools,
            primaryGoalId: resolved.primaryGoal.id,
        }),
        "evals.ts": buildEvalsText(resolved.evals),
        "tools.ts": buildToolsText(resolved.tools),
        "index.ts": buildIndexText(),
        "schema.ts": buildSchemaText(),
        "BUILD_NOTES.md": buildBuildNotesText(resolved, sources),
    };

    if (dryRun) {
        console.log(chalk.yellow("Dry run only. Files that would be written:\n"));
        for (const [fileName, content] of Object.entries(files)) {
            console.log(chalk.cyan(`--- ${path.join(agentDir, fileName)} ---`));
            console.log(content);
            console.log("");
        }
        return;
    }

    await fs.ensureDir(agentDir);

    for (const [fileName, content] of Object.entries(files)) {
        await fs.writeFile(path.join(agentDir, fileName), content, "utf8");
    }
}

/**
 * ============================================================================
 * MAIN FLOW
 * ============================================================================
 */

async function run() {
    printHeader();

    const args = parseArgs(process.argv.slice(2));
    const nonInteractive = args.yes;

    /**
     * ------------------------------------------------------------------------
     * STEP 1: AGENT NAME
     * ------------------------------------------------------------------------
     */

    let agentName =
        args.name ??
        (await inputText("Agent folder name (kebab-case)", undefined, validateKebabCase));

    if (validateKebabCase(agentName) !== true) {
        throw new Error("Agent folder name must be kebab-case.");
    }

    /**
     * ------------------------------------------------------------------------
     * STEP 2: LOAD SOURCE-OF-TRUTH DATA
     * ------------------------------------------------------------------------
     */

    const orchConfigs = await loadOrchestrationConfigs();
    if (!orchConfigs.length) {
        throw new Error("No orchestration packages found in /packages.");
    }

    const availableAgentTypes = getAllAgentTypesFromOrchs(orchConfigs);
    if (!availableAgentTypes.length) {
        throw new Error("No compatible agent types declared in orchestration configs.");
    }

    const existingAgentConfig = await loadExistingAgentConfig(agentName);

    /**
     * ------------------------------------------------------------------------
     * STEP 3: PRIMARY GOAL
     * ------------------------------------------------------------------------
     */

    printPrimaryGoalOptions();

    let selectedPrimaryGoal: PrimaryGoal | undefined;

    if (args.primaryGoal) {
        selectedPrimaryGoal = PRIMARY_GOALS.find((g) => g.id === args.primaryGoal);
        if (!selectedPrimaryGoal) {
            throw new Error(`Unknown primary goal: ${args.primaryGoal}`);
        }
    } else if (existingAgentConfig && !nonInteractive) {
        const pick = await selectOne(
            "Primary Goal",
            PRIMARY_GOALS.map((g) => g.id),
            PRIMARY_GOALS[0]?.id
        );
        selectedPrimaryGoal = PRIMARY_GOALS.find((g) => g.id === pick);
    } else if (nonInteractive) {
        selectedPrimaryGoal = PRIMARY_GOALS[0];
    } else {
        const pick = await selectOne(
            "Primary Goal",
            PRIMARY_GOALS.map((g) => g.id),
            PRIMARY_GOALS[0]?.id
        );
        selectedPrimaryGoal = PRIMARY_GOALS.find((g) => g.id === pick);
    }

    if (!selectedPrimaryGoal) {
        throw new Error("Failed to resolve primary goal.");
    }

    const primaryGoalSource = args.primaryGoal ? "CLI flags" : "guided selection";

    /**
     * ------------------------------------------------------------------------
     * STEP 4: AGENT TYPE
     * ------------------------------------------------------------------------
     */

    const recommendedAgentType = getRecommendedAgentTypeForPrimaryGoal(
        selectedPrimaryGoal,
        availableAgentTypes
    );

    const candidateAgentTypes = unique([
        ...selectedPrimaryGoal.recommended_agent_types.filter((t) =>
            availableAgentTypes.includes(t)
        ),
        ...availableAgentTypes,
    ]);

    const prefilledAgentType =
        args.type ??
        existingAgentConfig?.agent_type ??
        recommendedAgentType;

    if (!candidateAgentTypes.includes(prefilledAgentType)) {
        throw new Error(
            `Agent type "${prefilledAgentType}" is not available from orchestration configs.`
        );
    }

    const agentType = await useOrAdaptOne({
        sectionLabel: "Agent Type",
        currentValue: prefilledAgentType,
        recommendedValue: recommendedAgentType,
        choices: candidateAgentTypes,
        why: `Recommended from primary goal "${selectedPrimaryGoal.id}".`,
        nonInteractive,
    });

    const agentTypeSource = args.type
        ? "CLI flags"
        : existingAgentConfig?.agent_type
            ? "existing agent config"
            : "primary goal recommendation";

    /**
     * ------------------------------------------------------------------------
     * STEP 5: ORCHESTRATION + GOAL VARIATIONS
     * ------------------------------------------------------------------------
     */

    const compatibleOrchs = getCompatibleOrchestrations(orchConfigs, agentType);
    if (!compatibleOrchs.length) {
        throw new Error(`No compatible orchestrations found for agent type "${agentType}".`);
    }

    const recommendedOrch = getRecommendedOrchestration(compatibleOrchs, agentType);

    const prefilledOrchId =
        args.orch ??
        existingAgentConfig?.default_orch ??
        recommendedOrch.id;

    const compatibleOrchIds = compatibleOrchs.map((o) => o.id);
    if (!compatibleOrchIds.includes(prefilledOrchId)) {
        throw new Error(
            `Orchestration "${prefilledOrchId}" is not compatible with agent type "${agentType}".`
        );
    }

    const chosenOrchId = await useOrAdaptOne({
        sectionLabel: "Orchestration",
        currentValue: prefilledOrchId,
        recommendedValue: recommendedOrch.id,
        choices: compatibleOrchIds,
        why:
            recommendedOrch.description ??
            `Recommended orchestration for agent type "${agentType}".`,
        nonInteractive,
    });

    const orchSource = args.orch
        ? "CLI flags"
        : existingAgentConfig?.default_orch
            ? "existing agent config"
            : "agent type recommendation";

    const orchestration = compatibleOrchs.find((o) => o.id === chosenOrchId)!;

    const goalVariations = await loadGoalsForOrchestration(orchestration.id);
    let selectedGoal: Goal | null = null;
    let goalSource = "no goal variation selected";

    if (goalVariations.length) {
        printGoalVariationDetails(goalVariations);

        const recommendedGoal =
            goalVariations[0]?.name ?? null;

        const prefilledGoal =
            args.goal ??
            existingAgentConfig?.goals?.[0] ??
            recommendedGoal;

        if (prefilledGoal && !goalVariations.some((g) => g.name === prefilledGoal)) {
            throw new Error(
                `Goal variation "${prefilledGoal}" not found in ${orchestration.id}/goals.ts`
            );
        }

        const chosenGoalName = await useOrAdaptOne({
            sectionLabel: "Goal Variation",
            currentValue: prefilledGoal ?? goalVariations[0].name,
            recommendedValue: recommendedGoal ?? goalVariations[0].name,
            choices: goalVariations.map((g) => g.name),
            why: `Loaded from ${orchestration.id}/goals.ts`,
            nonInteractive,
        });

        selectedGoal = goalVariations.find((g) => g.name === chosenGoalName)!;
        goalSource = args.goal
            ? "CLI flags"
            : existingAgentConfig?.goals?.[0]
                ? "existing agent config"
                : "orchestration goals";
    }

    /**
     * ------------------------------------------------------------------------
     * STEP 6: FRAMEWORK
     * ------------------------------------------------------------------------
     */

    const recommendedFramework = orchestration.default_framework;
    const prefilledFramework =
        args.framework ??
        existingAgentConfig?.tooling?.framework ??
        recommendedFramework;

    if (!orchestration.supported_framework.includes(prefilledFramework)) {
        throw new Error(
            `Framework "${prefilledFramework}" is not supported by orchestration "${orchestration.id}".`
        );
    }

    const framework = await useOrAdaptOne({
        sectionLabel: "Framework",
        currentValue: prefilledFramework,
        recommendedValue: recommendedFramework,
        choices: orchestration.supported_framework,
        why: `Supported by orchestration "${orchestration.id}".`,
        nonInteractive,
    });

    const frameworkSource = args.framework
        ? "CLI flags"
        : existingAgentConfig?.tooling?.framework
            ? "existing agent config"
            : "orchestration default";

    /**
     * ------------------------------------------------------------------------
     * STEP 7: EVALS
     * ------------------------------------------------------------------------
     */

    const templateEvals = await loadTemplateEvals(normalizeAgentType(agentType));

    const evalResolution = resolveRecommendedEvals({
        flagEvals: args.evals,
        existingAgentEvals: existingAgentConfig?.evals,
        templateEvals,
        orchEvals: orchestration.evals_default,
    });

    const finalEvals = await useOrAdaptMany({
        sectionLabel: "Evals",
        currentValues: evalResolution.evals,
        recommendedValues: evalResolution.evals,
        choices: ALL_EVALS,
        why: `Resolved from ${evalResolution.source}.`,
        nonInteractive,
    });

    const evalsSource = evalResolution.source;

    /**
     * ------------------------------------------------------------------------
     * STEP 8: MEMORY
     * ------------------------------------------------------------------------
     */

    const memCfg = getMemoryConfig(orchestration);
    const recommendedMemory = memCfg.default;
    const prefilledMemory =
        args.memory ??
        existingAgentConfig?.memory?.provider ??
        recommendedMemory;

    if (!memCfg.supported.includes(prefilledMemory)) {
        throw new Error(
            `Memory provider "${prefilledMemory}" is not supported by orchestration "${orchestration.id}".`
        );
    }

    const memoryProvider = await useOrAdaptOne({
        sectionLabel: "Memory",
        currentValue: prefilledMemory,
        recommendedValue: recommendedMemory,
        choices: memCfg.supported,
        why: memCfg.notes?.[recommendedMemory] ?? "Memory recommendation from orchestration.",
        nonInteractive,
    });

    const memorySource = args.memory
        ? "CLI flags"
        : existingAgentConfig?.memory?.provider
            ? "existing agent config"
            : "orchestration default";

    /**
     * ------------------------------------------------------------------------
     * STEP 9: TOOLS
     * ------------------------------------------------------------------------
     */

    const toolResolution = await resolveRecommendedTools({
        flagTools: args.tools,
        selectedGoal,
        orchestrationId: orchestration.id,
        framework,
    });

    const allVisibleToolChoices = unique([
        ...toolResolution.tools,
        ...(selectedGoal?.recommendedTools ?? []),
    ]);

    const finalTools =
        allVisibleToolChoices.length > 0
            ? await useOrAdaptMany({
                sectionLabel: "Tools",
                currentValues: toolResolution.tools,
                recommendedValues: toolResolution.tools,
                choices: allVisibleToolChoices,
                why: `Resolved from ${toolResolution.source}.`,
                nonInteractive,
            })
            : [];

    const toolsSource = toolResolution.source;

    /**
     * ------------------------------------------------------------------------
     * STEP 10: SUMMARY
     * ------------------------------------------------------------------------
     */

    const resolved: ResolvedSelection = {
        agentName,
        primaryGoal: selectedPrimaryGoal,
        agentType,
        goalVariation: selectedGoal,
        orchestration,
        framework,
        evals: finalEvals,
        memoryProvider,
        tools: finalTools,
        existingAgentConfig,
    };

    const sources: SourceSummary = {
        primaryGoalSource,
        agentTypeSource,
        goalSource,
        orchSource,
        frameworkSource,
        evalsSource,
        memorySource,
        toolsSource,
    };

    printFinalSummary(resolved, sources, args.dryRun);

    /**
     * ------------------------------------------------------------------------
     * STEP 11: WRITE
     * ------------------------------------------------------------------------
     */

    if (!args.yes) {
        const ok = await confirm(
            args.dryRun ? "Print dry-run output?" : "Write these files?",
            true
        );
        if (!ok) {
            console.log(chalk.yellow("Cancelled."));
            return;
        }
    }

    await writeAgentFiles(resolved, sources, args.dryRun);

    if (args.dryRun) {
        console.log(chalk.green("Dry run complete."));
    } else {
        console.log(chalk.green(`✅ Created agent "${agentName}"`));
        console.log(chalk.green("📦 Files: config.ts, evals.ts, tools.ts, index.ts, schema.ts, BUILD_NOTES.md"));
    }
}

/**
 * ============================================================================
 * ENTRYPOINT
 * ============================================================================
 */

run()
    .catch((error) => {
        console.error(chalk.red("\n❌ new-agent failed"));
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await rl.close();
    });