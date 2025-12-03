export default {
  id: "langchain",
  async init(config: any) {
    console.log("LangChain initialized with", config.id ?? config.orchId ?? "unknown");
  },
  async run(query: string, config: any) {
    return { output: `LangChain result for ${query}` };
  },
};

