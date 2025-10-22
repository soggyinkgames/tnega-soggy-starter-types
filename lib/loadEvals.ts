// lib/loadEvals.ts
// Dynamically loads eval modules by id, returning their adapters.
import path from "path";
import { pathToFileURL } from "url";
import type { EvalModule } from "packages/eval-types";

export async function loadEvals(ids: string[]): Promise<EvalModule[]> {
  const loaded: EvalModule[] = [];
  for (const id of ids) {
    const spec = `packages/eval-${id}`;
    let mod: any;
    try {
      // Prefer bare import (works when tsx/tsconfig-paths resolve from project root)
      mod = await import(spec);
    } catch {
      try {
        // Fallback: resolve absolute file path from CWD
        const abs = path.resolve(process.cwd(), "packages", `eval-${id}`, "index.ts");
        mod = await import(pathToFileURL(abs).href);
      } catch (err) {
        console.warn(`[evals] Failed to load eval '${id}':`, (err as Error).message);
        continue;
      }
    }
    const adapter: EvalModule | undefined = mod?.default ?? (mod as EvalModule);
    if (adapter && typeof adapter.evaluate === "function") {
      loaded.push(adapter);
    } else {
      console.warn(`[evals] Module for '${id}' does not export an EvalModule`);
    }
  }
  return loaded;
}

