#!/usr/bin/env tsx
import fs from "fs-extra";
import path from "path";
import { pathToFileURL } from "url";
import { DEFAULT_EVALS } from "lib/defaultEvals";
import chalk from "chalk";

type OrchConfig = {
    id: string;
    description?: string;
    supported_tooling: string[];
    default_tooling: string;
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

const TEMPLATES_ROOT = path.resolve("templates", "agent-types");

async function getInquirer() {
    try {
        const mod = await import("inquirer");
        return (mod as any).default ?? mod;
    } catch {
        console.error("❌ Missing dependency 'inquirer'. Run: npm i inquirer");
        process.exit(1);
    }
}

function toFileUrl(p: string) {
    return pathToFileURL(p).href;
}

async function safeImport<T = any>(p: string): Promise<T | null> {
    try {
        return (await import(toFileUrl(p))) as any;
    } catch {
        return null;
    }
}

async function loadOrchestrationConfigs(): Promise<OrchConfig[]> {
    const packagesDir = path.resolve("packages");
    if (!(await fs.pathExists(packagesDir))) {
        throw new Error(`Packages folder not found at: ${packagesDir}`);
    }

    const dirs = (await fs.readdir(packagesDir)).filter((d) => d.startsWith("orch-"));
    const configs: OrchConfig[] = [];
    for (const d of dirs) {
        const cfgPath = path.join(packagesDir, d, "config.ts");
        const mod = await safeImport(cfgPath);
        if (mod?.default) configs.push(mod.default as OrchConfig);
    }
    return configs;
}

async function choose<T>(inquirer: any, message: string, choices: string[], def?: string) {
    const { pick } = (await inquirer.prompt([
        { type: "list", name: "pick", message, choices, default: def },
    ])) as any;
    return pick as T;
}

async function confirm(inquirer: any, message: string, def = true) {
    const { ok } = (await inquirer.prompt([
        { type: "confirm", name: "ok", message, default: def },
    ])) as any;
    return ok as boolean;
}

async function run() {
    const inquirer = await getInquirer();

    // 1️⃣ Name
    const argv = process.argv.slice(2);
    let agentNameArg: string | undefined = argv.find((a) => !a.startsWith("--"));
    if (!agentNameArg) {
        const resp = (await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "Agent folder name (kebab-case):",
                validate: (v: string) =>
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)
                        ? true
                        : "Use kebab-case, e.g. my-agent",
            },
        ])) as any;
        agentNameArg = resp.name;
    }
    const agentName = agentNameArg!;

    // 2️⃣ Load orchestrations
    const orchConfigs = await loadOrchestrationConfigs();
    if (!orchConfigs.length) {
        console.error("❌ No orchestration packages found in /packages");
        process.exit(1);
    }

    const agentTypeSet = new Set<string>();
    for (const cfg of orchConfigs) {
        (cfg.compatible_agent_types || []).forEach((t) => agentTypeSet.add(t));
    }
    const agentTypes = Array.from(agentTypeSet);
    if (!agentTypes.length) {
        console.error("❌ No compatible agent types declared in orchestration configs.");
        process.exit(1);
    }

    const agentType = await choose<string>(inquirer, "Select agent type:", agentTypes);
    const normalizedAgentType = agentType.replace(/^\d+-/, "").toLowerCase();

    // 3️⃣ Recommended orchestration
    const compatibles = orchConfigs.filter((c) => c.compatible_agent_types?.includes(agentType));
    const recommended =
        compatibles.find((c) => c.recommended_for?.[agentType]) ?? compatibles[0];

    console.log(chalk.blue("\n— Orchestration Recommendation —"));
    console.log(`Recommended: ${recommended.id}`);
    console.log(
        `Why: ${recommended.description ?? `Best fit for "${agentType}" as declared by the package.`}`
    );

    const useRecoOrch = await confirm(
        inquirer,
        `Use recommended orchestration "${recommended.id}"?`,
        true
    );

    let orchCfg = recommended;
    if (!useRecoOrch) {
        const pickId = await choose<string>(
            inquirer,
            "Choose orchestration:",
            compatibles.map((c) => c.id),
            recommended.id
        );
        orchCfg = compatibles.find((c) => c.id === pickId)!;
        if (orchCfg.description) console.log(`\n${orchCfg.id}: ${orchCfg.description}\n`);
    }
    const orchType = orchCfg.id;

    // 4️⃣ Framework
    console.log(chalk.blue("\n— Framework Recommendation —"));
    let framework = orchCfg.default_tooling;
    const useRecoFramework = await confirm(
        inquirer,
        `Use recommended framework (${framework})?`,
        true
    );
    if (!useRecoFramework) {
        framework = await choose<string>(
            inquirer,
            "Choose framework:",
            orchCfg.supported_tooling,
            orchCfg.default_tooling
        );
    }

    // 5️⃣ Goals
    let goalData: Goal[] = [];
    const goalsMod = await safeImport(path.resolve("packages", orchType, "goals.ts"));
    if (goalsMod && (goalsMod as any).goals) goalData = (goalsMod as any).goals;
    
    let selectedGoal: Goal | null = null;
    if (goalData.length) {
        console.log(chalk.blue("\n— Orchestration Goals —"));
        console.log("\nAvailable goals for this orchestration:\n");
        for (const g of goalData) {
            console.log(`🧭  ${g.name}: ${g.description ?? ""}`);
            if (g.outcomes?.length) console.log(`   → Outcomes: ${g.outcomes.join(", ")}`);
            if (g.examples?.length) {
                console.log("   → Example uses:");
                g.examples.forEach((ex) => console.log(`      - ${ex}`));
            }
            console.log("");
        }
        const goalName = await choose<string>(
            inquirer,
            "Select a goal for this agent:",
            goalData.map((g) => g.name)
        );
        selectedGoal = goalData.find((g) => g.name === goalName)!;
    }

    // 6️⃣ Evals — pull from AGENT CONFIG if exists, else default list
    const agentDir = path.resolve("agents", agentName);
    await fs.ensureDir(agentDir);
    const existingConfigPath = path.join(agentDir, "config.ts");
    let existingConfig: any = null;
    if (fs.existsSync(existingConfigPath)) {
        const oldCfgMod = await safeImport(existingConfigPath);
        existingConfig = oldCfgMod?.default ?? null;
    }
    const evalDescriptions: Record<string, string> = {
        basic: "evaluates exact data comparison eg string `99==99` ",
        modelgraded: "evaluates responses match expected output context",
        "model-graded": "evaluates responses match expected output context",
        system: "evaluates accurate tool calls and internal retreival processes",
        safety: "evaluates ethical metrics and blocks usage of sensitive identity data",
        regression: "evaluates regression in accuracy of output",
    };

    async function loadTemplateEvals(agentTypeSlug: string): Promise<string[]> {
        if (!(await fs.pathExists(TEMPLATES_ROOT))) return [];
        const templateDirs = await fs.readdir(TEMPLATES_ROOT);
        for (const dir of templateDirs) {
            const normalized = dir.replace(/^\d+-/, "").toLowerCase();
            if (normalized === agentTypeSlug) {
                const cfgPath = path.join(TEMPLATES_ROOT, dir, "config.ts");
                const mod = await safeImport(cfgPath);
                const tplCfg = (mod as any)?.default ?? mod;
                if (tplCfg?.evals?.length) return tplCfg.evals as string[];
                const fallback = DEFAULT_EVALS[dir] ?? DEFAULT_EVALS[normalized];
                return fallback ?? [];
            }
        }
        return [];
    }

    const defaultEvalArray = ["basic", "modelgraded", "system", "safety", "regression"];
    const templateEvals = await loadTemplateEvals(normalizedAgentType);
    const recommendedEvals: string[] =
        existingConfig?.evals && existingConfig.evals.length
            ? existingConfig.evals
            : templateEvals.length
                ? templateEvals
                : defaultEvalArray;
    const availableEvals = Array.from(new Set([...defaultEvalArray, ...recommendedEvals]));

    console.log(chalk.blue("\n— Evals Recommendation —"));
    console.log(`Recommended eval suite: ${recommendedEvals.join(", ")}`);
    recommendedEvals.forEach((e) => {
        console.log(`   ${e}: ${evalDescriptions[e] ?? ""}`);
    });

    const useRecoEvals = await confirm(
        inquirer,
        "Use all recommended evals?",
        true
    );

    let finalEvals: string[] = recommendedEvals;
    if (!useRecoEvals) {
        const { evalSelection } = (await inquirer.prompt([
            {
                type: "checkbox",
                name: "evalSelection",
                message: "Select eval types to include:",
                choices: availableEvals.map((e) => ({
                    name: `${e} — ${evalDescriptions[e] ?? ""}`,
                    value: e,
                    checked: true,
                })),
            },
        ]));// as any;
        finalEvals = evalSelection;
    }

    // 7️⃣ Memory
    const memCfg = orchCfg.memory ?? {
        default: "supabase",
        supported: ["supabase", "redis", "file", "none"],
        notes: {
            supabase: "vector + SQL store (cloud, good for multi-agent/projects)",
            redis: "ephemeral fast cache (low-latency, not durable by default)",
            file: "local file-based store (dev-only)",
            none: "no memory (stateless)",
        },
    };

    console.log(chalk.blue("\n— Memory Recommendation —"));
    console.log(`Recommended: ${memCfg.default}`);
    const useRecoMemory = await confirm(
        inquirer,
        `Use recommended memory provider "${memCfg.default}"?`,
        true
    );

    let memoryProvider = memCfg.default;
    if (!useRecoMemory) {
        memoryProvider = await choose<string>(
            inquirer,
            "Choose memory provider:",
            memCfg.supported,
            memCfg.default
        );
    }

    // 8️⃣ Tools
    let tools: string[] = [];
    const orchToolsMod = await safeImport(path.resolve("packages", orchType, "tools.ts"));
    if (orchToolsMod?.getRecommendedTools && selectedGoal) {
        try {
            tools = (await (orchToolsMod as any).getRecommendedTools(
                selectedGoal.name,
                framework
            )) as string[];
        } catch { }
    }
    if (!tools.length && selectedGoal?.recommendedTools?.length)
        tools = selectedGoal.recommendedTools;
    tools = Array.from(new Set(tools));

    // 9️⃣ Write config.ts
    const configText = `
        export default {
        id: "${agentName}",
        agent_type: "${agentType}",
        default_orch: "${orchType}",
        tooling: { framework: "${framework}" },
        goals: ${selectedGoal ? JSON.stringify([selectedGoal.name]) : "[]"},
        outcomes: ${selectedGoal ? JSON.stringify(selectedGoal.outcomes || []) : "[]"},
        tools_needed: ${JSON.stringify(tools)},
        evals: ${JSON.stringify(finalEvals)},
        memory: { provider: "${memoryProvider}" },
        self_build: false
    };
`.trimStart();
    await fs.writeFile(path.join(agentDir, "config.ts"), configText, "utf8");

    // 🔧 Supporting files
    await fs.writeFile(
        path.join(agentDir, "evals.ts"),
        finalEvals
            .map(
                (e) =>
                    `export async function run_${e.replace(/[^a-z0-9_]/gi, "_")}() { return { result: "ok" }; }`
            )
            .join("\n"),
        "utf8"
    );

    await fs.writeFile(
        path.join(agentDir, "tools.ts"),
        `export const requiredTools = ${JSON.stringify(tools, null, 2)};`,
        "utf8"
    );

    await fs.writeFile(
        path.join(agentDir, "index.ts"),
        `
import config from "./config";
import { requiredTools } from "./tools";

export async function runAgent(query: string) {
  return { output: \`Echo:\${query}\`, config, requiredTools };
}

export default { runAgent };
`.trimStart(),
        "utf8"
    );

    await fs.writeFile(
        path.join(agentDir, "schema.ts"),
        `export interface AgentSchema { id: string; input: string; output: string; }`,
        "utf8"
    );

    console.log(`\n✅ Created agent "${agentName}"`);
    console.log(`🧩 Orchestration: ${orchType}`);
    console.log(`🧠 Framework: ${framework}`);
    if (selectedGoal) {
        console.log(`🎯 Goal: ${selectedGoal.name}`);
        if (selectedGoal.outcomes?.length)
            console.log(`   Outcomes: ${selectedGoal.outcomes.join(", ")}`);
    }
    console.log(`🧪 Evals: ${finalEvals.join(", ")}`);
    console.log(`🗃️ Memory: ${memoryProvider}`);
    console.log(`🔧 Tools: ${tools.length ? tools.join(", ") : "(none)"}`);
    console.log("📦 Files: config.ts, evals.ts, tools.ts, index.ts, schema.ts\n");
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
