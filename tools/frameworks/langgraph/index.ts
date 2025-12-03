export default {
  id: "langgraph",
  async init(config: any) {
    console.log("LangGraph initialized with", config.id ?? config.orchId ?? "unknown");
  },
  async run(query: string, config: any) {
    return { output: `LangGraph graph result for ${query}` };
  },
};

