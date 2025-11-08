import fs from "fs-extra";
import { resolve, join } from "path";
import { OrchestrationRegistry } from "../../packages/registry";
import { HybridAdaptiveOrch } from "../../packages";

export function listAgentDirs() {
  const root = resolve("agents");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((n) => !n.startsWith(".") && !n.includes("examples"));
}

export async function loadAgents() {
  const dirs = listAgentDirs();
  const loaded: any[] = [];
  for (const d of dirs) {
    const modPath = resolve("agents", d, "index.ts");
    const jsPath = resolve("agents", d, "index.js");
    if (fs.existsSync(modPath) || fs.existsSync(jsPath)) {
      const mod = await import(join("../../agents", d, "index"));
      loaded.push((mod as any).agent || (mod as any).default || mod);
    }
  }
  return loaded;
}

export function getOrchestrator(pattern: string) {
  const Cls: any = (OrchestrationRegistry as any)[pattern];
  return Cls || HybridAdaptiveOrch;
}

export function defaultMemoryForOrch(orchId: string) {
  if (orchId === "orch-shared-memory") return "mem-inmemory";
  if (["orch-concurrent", "orch-centralised", "orch-sequential"].includes(orchId)) return "mem-redis";
  if (["orch-negotiate", "orch-hybrid-adaptive"].includes(orchId)) return "mem-supabase";
  return "mem-inmemory";
}

export function defaultEvalForStrategy(strategy?: string) {
  const s = (strategy || "").toLowerCase();
  if (["sequential", "centralised", "centralised-default"].includes(s)) return "basic";
  if (s === "concurrent") return "system";
  if (["negotiate", "hybrid-adaptive", "group-collaborative"].includes(s)) return "model-graded";
  return "basic";
}
