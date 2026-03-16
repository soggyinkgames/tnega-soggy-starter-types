import { resolveFrameworkTool } from "../src/tools/collections";
import { loadFramework } from "../tools/frameworks/index";

type OrchConfig = {
  default_framework?: string;
  [key: string]: any;
};

/**
 * Adapter boundary: validate framework tooling against the catalog, then
 * execute the local framework implementation. Future API swaps can be placed
 * behind this function without changing orchestration callers.
 */
export async function runOrchFramework(query: any, config: OrchConfig = {}) {
  const tooling = config.default_framework ?? "langgraph";

  // Validate that the framework tooling is registered in the catalog
  resolveFrameworkTool(tooling);

  const framework = await loadFramework(tooling);
  if (typeof framework?.init === "function") {
    await framework.init(config);
  }
  if (typeof framework?.run !== "function") {
    throw new Error(`Framework ${tooling || "<unknown>"} is missing run()`);
  }
  return framework.run(query, config);
}

export default runOrchFramework;
