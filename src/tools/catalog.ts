import {
  CONTROLLED_TOOL_CATEGORIES,
  DuplicateToolIdError,
  ToolCatalog,
  isControlledCategory,
} from "./types";

const canonicalCatalog: ToolCatalog = [
  {
    id: "search",
    title: "Search",
    description: "General web-style search returning mock hits.",
    category: "retrieval",
    modulePath: "tools/search",
    tags: ["retrieval", "demo"],
  },
  {
    id: "query-knowledge-base",
    title: "Query Knowledge Base",
    description: "Retrieves structured answers from a knowledge base.",
    category: "retrieval",
    modulePath: "tools/queryKnowledgeBase",
    tags: ["retrieval", "kb"],
  },
  {
    id: "analyze-data",
    title: "Analyze Data",
    description: "Runs lightweight data analysis over provided input.",
    category: "analysis",
    modulePath: "tools/analyzeData",
    tags: ["analysis"],
  },
  {
    id: "summarize",
    title: "Summarize",
    description: "Produces concise summaries from longer inputs.",
    category: "summarization",
    modulePath: "tools/summarize",
    tags: ["summarization"],
  },
  {
    id: "generate-content",
    title: "Generate Content",
    description: "Creates draft content from prompts or outlines.",
    category: "generation",
    modulePath: "tools/generateContent",
    tags: ["generation"],
  },
  {
    id: "codegen",
    title: "Code Generation",
    description: "Generates code snippets from specifications.",
    category: "generation",
    modulePath: "tools/codegen",
    tags: ["generation", "code"],
  },
  {
    id: "framework-langchain",
    title: "LangChain Framework",
    description: "Adapter for LangChain-based workflows.",
    category: "framework",
    modulePath: "tools/frameworks/langchain",
    tags: ["framework", "langchain"],
  },
  {
    id: "framework-langgraph",
    title: "LangGraph Framework",
    description: "Adapter for LangGraph graph-based orchestration.",
    category: "framework",
    modulePath: "tools/frameworks/langgraph",
    tags: ["framework", "langgraph"],
  },
  {
    id: "framework-crewai",
    title: "CrewAI Framework",
    description: "Adapter for CrewAI agent orchestration.",
    category: "framework",
    modulePath: "tools/frameworks/crewai",
    tags: ["framework", "crewai"],
  },
] satisfies ToolCatalog;

function validateCatalog(catalog: ToolCatalog): ToolCatalog {
  const seen = new Set<string>();
  for (const tool of catalog) {
    if (!isControlledCategory(tool.category)) {
      const allowed = CONTROLLED_TOOL_CATEGORIES.join(", ");
      throw new Error(
        `Invalid category "${tool.category}" for tool ${tool.id}; allowed: ${allowed}`,
      );
    }
    if (seen.has(tool.id)) {
      throw new DuplicateToolIdError(tool.id);
    }
    seen.add(tool.id);
  }
  return catalog;
}

export const canonicalToolCatalog = Object.freeze([...validateCatalog(canonicalCatalog)]);
