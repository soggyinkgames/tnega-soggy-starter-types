#!/usr/bin/env tsx
import "dotenv/config";
import chalk from "chalk";

import { runAgentCommand, runAgentEvals } from "./run-agent-runtime.js";

const log = {
  title: (t: string) => console.log(chalk.bold.cyan(`\n🧠 ${t}`)),
  info: (msg: string) => console.log(chalk.gray(`   ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
};

async function main() {
  const argv = process.argv.slice(2);
  const agentName = argv[0];
  const noEvals = argv.includes("--no-evals");
  const query = argv.slice(1).filter((arg) => arg !== "--no-evals").join(" ");

  if (!agentName) {
    log.error("Usage: npm run agent <agent-name> \"<query>\"");
    process.exit(1);
  }

  if (!query) {
    log.warn("No query provided. Example:");
    console.log(chalk.gray("   npm run agent my-agent \"Summarize the document\""));
    process.exit(1);
  }

  try {
    const result = await runAgentCommand({ agentName, query });

    log.title(`Running Agent: ${agentName}`);
    log.info(`Prompt: ${query}`);
    log.info(`Using evals: ${(result.config.evals || []).join(", ") || "none"}`);
    if (result.orchestrationId) {
      log.info(`Orchestration: ${result.orchestrationId}`);
    }

    log.success("Agent run completed.");
    if (result.displayOutput) {
      console.log(chalk.whiteBright(`\n📝 Output:\n${result.displayOutput}`));
    }

    if (noEvals) {
      log.warn("Skipping evals (--no-evals).");
    } else if (result.evalPath) {
      log.title("Running Evals");
      try {
        const evalResults = await runAgentEvals({
          evalPath: result.evalPath,
          input: query,
          output: result.displayOutput || "",
          agentName,
        });

        for (const evalResult of evalResults) {
          const icon = evalResult.passed
            ? chalk.green("✅")
            : evalResult.score > 0.5
              ? chalk.yellow("⚠️")
              : chalk.red("❌");
          console.log(`${icon} ${chalk.cyan(evalResult.id || "eval")}: ${evalResult.notes || ""}`);
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
  } catch (err) {
    log.error("Agent run failed:");
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Unhandled error in run-agent:"));
  console.error(err);
  process.exit(1);
});
