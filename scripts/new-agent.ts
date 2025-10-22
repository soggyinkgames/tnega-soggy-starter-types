#!/usr/bin/env tsx
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { DEFAULT_EVALS } from "@lib/defaultEvals";

// Narrow the keys and values using `as const`
const typeMap = {
    1: "knowledge-insight",
    2: "strategy",
    3: "creative-generation",
    4: "personal-workflow-assistant",
    5: "data-analyst-debugger",
    6: "simulation-scenario",
    7: "educational",
    8: "dev-infrastructure",
} as const;

// Create a type alias for valid keys
type AgentTypeNum = keyof typeof typeMap; // 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

async function main() {
    const name = process.argv[2];
    if (!name) {
        console.error("Usage: npm run new-agent <agent-name>");
        process.exit(1);
    }

    const baseDir = path.resolve("agents", name);
    if (fs.existsSync(baseDir)) {
        console.error(`❌ Agent ${name} already exists.`);
        process.exit(1);
    }

    const { typeNum } = await prompts({
        type: "select",
        name: "typeNum",
        message: "Choose an agent type:",
        choices: Object.entries(typeMap).map(([k, v]) => ({
            title: `${k}. ${v.replace(/-/g, " ")}`,
            value: Number(k) as AgentTypeNum,
        })),
    });

    const typeName = typeMap[typeNum as AgentTypeNum];
    if (!typeName) {
        console.error("Invalid type selected.");
        process.exit(1);
    }

    const templateDir = path.resolve("templates/agent-types", `${typeNum}-${typeName}`);
    if (!fs.existsSync(templateDir)) {
        console.error(`Template for ${typeName} missing at ${templateDir}`);
        process.exit(1);
    }

    await fs.copy(templateDir, baseDir);

    const files = fs.readdirSync(baseDir);
    for (const file of files) {
        const p = path.join(baseDir, file);
        const content = fs.readFileSync(p, "utf8");
        const replaced = content
            .replace(/{{AGENT_NAME}}/g, name)
            .replace(/{{AGENT_TITLE}}/g, toTitle(name))
            .replace(/{{AGENT_TYPE}}/g, typeName);
        fs.writeFileSync(p, replaced);
    }

    // Apply default evals if missing in generated config.ts
    const agentTypeId = `${typeNum}-${typeName}`;
    const configPath = path.join(baseDir, "config.ts");
    if (fs.existsSync(configPath)) {
        const cfg = fs.readFileSync(configPath, "utf8");
        const hasEvals = /\bevals\s*:\s*\[/.test(cfg);
        if (!hasEvals) {
            const defaults = DEFAULT_EVALS[agentTypeId] || [];
            let updated = cfg;
            if (/\bdeploy\s*:\s*/.test(updated) && /\bllm\s*:\s*/.test(updated)) {
                // insert after llm line for readability
                updated = updated.replace(/(\bllm\s*:\s*[^\n]*\n)/, `$1    evals: [${defaults.map((e) => `\"${e}\"`).join(", ")}],\n`);
            } else {
                // fallback: append before closing brace
                updated = updated.replace(/};\s*$/, `    evals: [${defaults.map((e) => `\"${e}\"`).join(", ")}],\n};`);
            }
            fs.writeFileSync(configPath, updated);
            console.log(`[new-agent] Applied default evals for ${agentTypeId}: [${defaults.join(", ")}]`);
        } else {
            console.log(`[new-agent] Using evals defined in template for ${agentTypeId}.`);
        }
    } else {
        const defaults = DEFAULT_EVALS[agentTypeId] || [];
        console.log(`[new-agent] No config.ts found. Default evals for ${agentTypeId} would be: [${defaults.join(", ")}]`);
    }

    console.log(`✅ Created new agent '${name}' of type ${typeNum} (${typeName})`);
}

function toTitle(str: string) {
    return str
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

