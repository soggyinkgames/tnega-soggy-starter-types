export async function runTool(spec: any) {
  const topic = spec?.topic || "topic";
  return { content: `Generated content about ${topic}` };
}

