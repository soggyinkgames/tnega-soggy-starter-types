#!/usr/bin/env tsx
import { resolve, join } from "path";
import fs from "fs-extra";
import prompts from "prompts";
import { writeArtifact } from "./helpers/io";
import { updateIndex } from "./helpers/artifacts";
import { defaultEvalForStrategy, defaultMemoryForOrch } from "./helpers/discover";

const ORCH_IDS = [
  "orch-centralised",
  "orch-hierarchical",
  "orch-shared-memory",
  "orch-negotiate",
  "orch-concurrent",
  "orch-sequential",
  "orch-group-collaborative",
  "orch-hybrid-adaptive",
] as const;

async function loadTemplateDescriptions() {
  const root = resolve("templates", "orchestration");
  const map: Record<string, string> = {};
  for (const id of ORCH_IDS) {
    const readme = resolve(root, id, "README.md");
    if (await fs.pathExists(readme)) {
      const raw = await fs.readFile(readme, "utf8");
      // Take first 3 non-empty lines after title as summary
      const lines = raw.split(/\r?\n/).filter(Boolean).filter((l) => !l.startsWith("#")).slice(0, 5);
      map[id] = lines.join(" ").trim();
    } else {
      map[id] = "";
    }
  }
  return map;
}

function inferStrategyFromOrch(orchId: string): string {
  if (orchId === "orch-centralised") return "centralised";
  if (orchId === "orch-hierarchical") return "hierarchical";
  if (orchId === "orch-shared-memory") return "shared-memory";
  if (orchId === "orch-negotiate") return "negotiate";
  if (orchId === "orch-concurrent") return "concurrent";
  if (orchId === "orch-sequential") return "sequential";
  if (orchId === "orch-group-collaborative") return "group-collaborative";
  if (orchId === "orch-hybrid-adaptive") return "hybrid-adaptive";
  return "centralised";
}

async function discoverAgentDirs(): Promise<string[]> {
  const root = resolve("agents");
  if (!(await fs.pathExists(root))) return [];
  const entries = await fs.readdir(root);
  return entries.filter((n) => !n.startsWith(".") && n !== "examples");
}

function isKebabCase(name: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

async function main() {
  const args = process.argv.slice(2);
  let name = args.includes("--name") ? args[args.indexOf("--name") + 1] : undefined;
  let orchId = args.includes("--pattern") ? args[args.indexOf("--pattern") + 1] : undefined;
  const agentsArg = args.includes("--agents") ? args[args.indexOf("--agents") + 1] : "";

  if (!name) {
    const resp = await prompts({
      type: "text",
      name: "name",
      message: "Enter orchestration name (kebab-case):",
      validate: (v: string) => (isKebabCase(v) ? true : "Use kebab-case, e.g. demo-orch"),
    });
    name = resp.name;
  }
  if (!name) {
    console.log("Usage: tsx scripts/new-orchestration.ts --name <name> [--pattern <orch-id>] [--agents a1,a2]");
    process.exit(1);
  }

  if (!orchId) {
    const descs = await loadTemplateDescriptions();
    const resp = await prompts({
      type: "select",
      name: "orch",
      message: "Choose an orchestration type:",
      choices: ORCH_IDS.map((id) => {
        const label = id.replace("orch-", "").replace(/-/g, " ");
        const summary = descs[id] ? ` — ${descs[id]}` : "";
        return { title: `${label}${summary}`, value: id };
      }),
    });
    orchId = resp.orch;
  }
  if (!orchId) {
    console.error("No orchestration type selected.");
    process.exit(1);
  }

  let selectedAgents: string[] = [];
  if (agentsArg) {
    selectedAgents = agentsArg.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const agents = await discoverAgentDirs();
    if (agents.length) {
      const resp = await prompts({
        type: "multiselect",
        name: "agents",
        message: "Select agents to include (Space to toggle, Enter to confirm):",
        choices: agents.map((a) => ({ title: a, value: a })),
      });
      selectedAgents = resp.agents || [];
    }
  }

  const inferredStrategy = inferStrategyFromOrch(orchId);
  const defaultEval = defaultEvalForStrategy(inferredStrategy);
  const defaultMemory = defaultMemoryForOrch(orchId);

  const { useDefaults } = await prompts({
    type: "toggle",
    name: "useDefaults",
    message: `Use defaults? eval=${defaultEval}, memory=${defaultMemory}`,
    initial: true,
    active: "Yes",
    inactive: "No",
  });

  let evalId = defaultEval;
  let memoryBackend = defaultMemory;
  if (!useDefaults) {
    const { evalChoice } = await prompts({
      type: "select",
      name: "evalChoice",
      message: "Select eval suite:",
      choices: [
        { title: "basic", value: "basic" },
        { title: "system", value: "system" },
        { title: "model-graded", value: "model-graded" },
      ],
      initial: ["basic", "system", "model-graded"].indexOf(defaultEval),
    });
    const { memChoice } = await prompts({
      type: "select",
      name: "memChoice",
      message: "Select memory backend:",
      choices: [
        { title: "mem-inmemory", value: "mem-inmemory" },
        { title: "mem-redis", value: "mem-redis" },
        { title: "mem-supabase", value: "mem-supabase" },
      ],
      initial: ["mem-inmemory", "mem-redis", "mem-supabase"].indexOf(defaultMemory),
    });
    evalId = evalChoice || defaultEval;
    memoryBackend = memChoice || defaultMemory;
  }

  const dir = resolve("orchestrations", name);
  await fs.ensureDir(dir);
  const config = {
    orchId: orchId,
    agents: selectedAgents,
    evalId,
    memory: { backend: memoryBackend, types: [] as string[] },
  };
  await fs.writeJson(resolve(dir, "config.json"), config, { spaces: 2 });

  const readme = `# Orchestration: ${name}

Type: ${orchId}

Agents: ${selectedAgents.length ? selectedAgents.join(", ") : "(none)"}

Defaults:
- Strategy: ${inferredStrategy}
- Eval: ${evalId}
- Memory: ${memoryBackend}

Run:

\`\`\`
npm run run-orchestration -- --name ${name}
\`\`\`
`;
  await fs.writeFile(join(dir, "README.md"), readme, "utf8");

  const file = await writeArtifact("new-orchestration", name, { ok: true, config });
  await updateIndex(file);
  console.log("Created orchestration:", dir);
}

main();
