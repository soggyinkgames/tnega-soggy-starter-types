#!/usr/bin/env tsx
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";

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
