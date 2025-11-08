export async function runTool(spec: any) {
  const text = String(spec?.text || "");
  return { summary: text.slice(0, 64) };
}

