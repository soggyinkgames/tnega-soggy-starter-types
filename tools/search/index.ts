import { Tool } from "../types";

export const searchTool: Tool = {
  name: "search",
  async run(spec: any) {
    const q = spec?.query || "";
    return {
      query: q,
      hits: [
        { title: `Result for ${q}`, url: "https://example.com/1" },
        { title: `More about ${q}`, url: "https://example.com/2" }
      ]
    };
  }
};

export default searchTool;

