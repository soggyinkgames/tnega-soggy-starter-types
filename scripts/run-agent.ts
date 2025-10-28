#!/usr/bin/env tsx
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { pathToFileURL } from "url";

// ---------------------------------------------------------------------------
// Helper: load module safely
// ---------------------------------------------------------------------------

async function safeImport(modulePath: string) {
    try {
        const fullPath = path.isAbsolute(modulePath)
            ? pathToFileURL(modulePath).href
            : pathToFileURL(path.resolve(modulePath)).href;
        return await import(fullPath);
    } catch (err) {
        console.error(chalk.red(`NO NOTES! ❌ Failed to import: ${modulePath}`));
        console.error(err);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Pretty logging helpers
// ---------------------------------------------------------------------------
const log = {
    title: (t: string) => console.log(chalk.bold.cyan(`\n🧠 ${t}`)),
    info: (msg: string) => console.log(chalk.gray(`   ${msg}`)),
    success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
    warn: (msg: string) => console.log(chalk.yellow(`⚠️  ${msg}`)),
    error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
};

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
async function main() {
    const argv = process.argv.slice(2);
    const agentName = argv[0];
    const query = argv.slice(1).join(" ");

    if (!agentName) {
        log.error("Usage: npm run agent <agent-name> \"<query>\"");
        process.exit(1);
    }

    if (!query) {
        log.warn("No query provided. Example:");
        console.log(chalk.gray("   npm run agent my-agent \"Summarize the document\""));
        process.exit(1);
    }

    const baseDir = path.resolve("agents", agentName);
    const agentPath = path.join(baseDir, "index.ts");
    const configPath = path.join(baseDir, "config.ts");
    const evalPath = path.join(baseDir, "eval.ts");

    if (!fs.existsSync(agentPath)) {
        log.error(`Agent not found at ${agentPath}`);
        process.exit(1);
    }

    // Import agent, config, and eval files
    const agentMod = await safeImport(agentPath);
    const configMod = fs.existsSync(configPath) ? await safeImport(configPath) : {};
    const evalMod = fs.existsSync(evalPath) ? await safeImport(evalPath) : {};

    const runAgent = agentMod.runAgent || agentMod.default;
    const runEvals = evalMod.runEvals;

    log.title(`Running Agent: ${agentName}`);
    log.info(`Prompt: ${query}`);
    log.info(`Using evals: ${(configMod.default?.evals || []).join(", ") || "none"}`);

    // Execute the agent
    let output: any;
    try {
        output = await runAgent(query);
    } catch (err) {
        log.error("Agent run failed:");
        console.error(err);
        process.exit(1);
    }

    log.success("Agent run completed.");
    if (output?.output) console.log(chalk.whiteBright(`\n📝 Output:\n${output.output}`));

    // Run evals if available
    if (runEvals) {
        log.title("Running Evals");
        try {
            const evalResults = await runEvals({
                input: query,
                output: output?.output || "",
                meta: { agent: agentName, time: new Date().toISOString() },
            });

            for (const result of evalResults) {
                const icon = result.passed
                    ? chalk.green("✅")
                    : result.score > 0.5
                        ? chalk.yellow("⚠️")
                        : chalk.red("❌");
                console.log(`${icon} ${chalk.cyan(result.id || "eval")}: ${result.notes || ""}`);
            }

            log.success("Evals completed.");
        } catch (err) {
            log.error("Eval execution failed:");
            console.error(err);
        }
    } else {
        log.warn("No eval.ts file found — skipping evals.");
    }

    console.log("");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch((err) => {
    console.error(chalk.red("Unhandled error in run-agent:"));
    console.error(err);
    process.exit(1);
});
