import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import { resolveTool } from "./resolve_tools";
import type { ToolDefinition } from "./types";

export type ToolRunFn = (spec: any, ctx?: Record<string, any>) => Promise<any>;

export type LoadedTool = {
  definition: ToolDefinition;
  run: ToolRunFn;
  init?: (config?: any) => Promise<any> | any;
};

function resolveModuleFile(modulePath: string): string {
  const base = path.resolve(modulePath);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.js"),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Module not found for tool at ${modulePath}`);
  }

  return pathToFileURL(found).href;
}

function pickRunHandler(mod: any, toolId: string): { run: ToolRunFn; init?: any } {
  const candidates = [
    mod?.default,
    mod?.runTool,
    mod?.run,
    mod?.tool,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "function") {
      return { run: candidate as ToolRunFn, init: mod?.init ?? candidate?.init };
    }
    if (typeof candidate.run === "function") {
      return { run: candidate.run.bind(candidate), init: candidate.init };
    }
  }

  // Fallback: find any export with a run function
  for (const value of Object.values(mod)) {
    if (typeof value === "function") {
      return { run: value as ToolRunFn, init: (value as any).init };
    }
    if (value && typeof (value as any).run === "function") {
      return { run: (value as any).run.bind(value), init: (value as any).init };
    }
  }

  throw new Error(`Tool ${toolId} implementation is missing a runnable handler`);
}

export async function loadToolHandler(toolId: string): Promise<LoadedTool> {
  const definition = resolveTool(toolId);
  const moduleHref = resolveModuleFile(definition.modulePath);
  const mod = await import(moduleHref);
  const { run, init } = pickRunHandler(mod, toolId);
  return { definition, run, init };
}

export async function executeTool(toolId: string, spec: any, ctx?: Record<string, any>) {
  const { run } = await loadToolHandler(toolId);
  return run(spec, ctx);
}
