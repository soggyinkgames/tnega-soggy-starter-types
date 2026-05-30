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
    category: "retrieve",
    modulePath: "tools/search",
    tags: ["retrieve", "demo"],
  },
  {
    id: "query-knowledge-base",
    title: "Query Knowledge Base",
    description: "Retrieves structured answers from a knowledge base.",
    category: "retrieve",
    modulePath: "tools/queryKnowledgeBase",
    tags: ["retrieve", "kb"],
  },
  {
    id: "analyze-data",
    title: "Analyze Data",
    description: "Runs lightweight data analysis over provided input.",
    category: "analyze",
    modulePath: "tools/analyzeData",
    tags: ["analyze"],
  },
  {
    id: "summarize",
    title: "Summarize",
    description: "Produces concise summaries from longer inputs.",
    category: "summarize",
    modulePath: "tools/summarize",
    tags: ["summarize"],
  },
  {
    id: "generate-content",
    title: "Generate Content",
    description: "Creates draft content from prompts or outlines.",
    category: "generate",
    modulePath: "tools/generateContent",
    tags: ["generate"],
  },
  {
    id: "ingest.source-materials",
    title: "Ingest Source Materials",
    description: "Validates declared source modalities and collects normalized source materials into working state.",
    category: "ingest",
    modulePath: "src/tools/ingest/sourceMaterials",
    tags: ["ingest", "source-materials"],
  },
  {
    id: "normalize.references",
    title: "Normalize References",
    description: "Normalizes reference inputs into structured reference entries for downstream tools.",
    category: "normalize",
    modulePath: "src/tools/normalize/references",
    tags: ["normalize", "references"],
  },
  {
    id: "derive.line-art-spec",
    title: "Derive Line Art Spec",
    description: "Derives a line-art-targeted artifact from the current working context.",
    category: "derive",
    modulePath: "src/tools/derive/lineArtSpec",
    tags: ["derive", "line-art"],
  },
  {
    id: "derive.music-spec",
    title: "Derive Music Spec",
    description: "Derives a music-targeted artifact from the current working context.",
    category: "derive",
    modulePath: "src/tools/derive/musicSpec",
    tags: ["derive", "music"],
  },
  {
    id: "assemble.output-payload",
    title: "Assemble Output Payload",
    description: "Assembles a reusable output payload from the prepared artifact and normalized workflow state.",
    category: "assemble",
    modulePath: "src/tools/assemble/outputPayload",
    tags: ["assemble", "output-payload"],
  },
  {
    id: "codegen",
    title: "Code Generation",
    description: "Generates code snippets from specifications.",
    category: "generate",
    modulePath: "tools/codegen",
    tags: ["generate", "code"],
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
