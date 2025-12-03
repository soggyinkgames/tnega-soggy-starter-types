export async function loadFramework(name: string) {
  const map: Record<string, () => Promise<any>> = {
    langchain: () => import("./langchain/index.ts"),
    langgraph: () => import("./langgraph/index.ts"),
    crewai: () => import("./crewai/index.ts"),
  };
  const loader = map[name];
  const mod = await loader?.();
  if (!mod) throw new Error(`Framework ${name} not found`);
  return (mod as any).default ?? mod;
}

