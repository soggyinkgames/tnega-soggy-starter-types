import { describe, expect, it } from "vitest";

import {
  getGoalVariations,
  resolveSequentialAgentToolRuntime,
  selectToolCollectionsForSequentialAgent,
} from "./tools.js";

describe("orch-sequential tool selection", () => {
  it("maps a line-art declaration to ordered line-art collections", () => {
    const collections = selectToolCollectionsForSequentialAgent({
      agentType: "creative-generation",
      defaultOrchestration: "sequential",
      goalProfile: "line-art",
      inputKinds: ["prompt-text", "image-photo", "reference-set"],
      outputTargets: ["line-art"],
    });

    expect(collections).toEqual([
      "source-material-preparation",
      "line-art-specification",
    ]);
  });

  it("maps a music declaration to ordered music collections", () => {
    const collections = selectToolCollectionsForSequentialAgent({
      agentType: "creative-generation",
      defaultOrchestration: "sequential",
      goalProfile: "music",
      inputKinds: ["prompt-text", "audio", "reference-set"],
      outputTargets: ["music"],
    });

    expect(collections).toEqual([
      "source-material-preparation",
      "music-specification",
    ]);
  });

  it("fails when a creative agent omits declared output targets", () => {
    expect(() =>
      selectToolCollectionsForSequentialAgent({
        agentType: "creative-generation",
        defaultOrchestration: "sequential",
        goalProfile: "line-art",
        inputKinds: ["prompt-text", "image-photo"],
        toolCollections: ["source-material-preparation"],
      }),
    ).toThrow(
      "Creative-generation sequential selection requires outputTargets to be a string array.",
    );
  });

  it("preserves declared collections for unrelated agent types", () => {
    const collections = selectToolCollectionsForSequentialAgent({
      agentType: "strategy",
      toolCollections: ["research-core"],
    });

    expect(collections).toEqual(["research-core"]);
  });

  it("derives creative goal variations from template specializations", () => {
    const goalVariations = getGoalVariations({
      agentType: "creative-generation",
      templateSpecializations: [
        {
          id: "line-art",
          label: "Line art from prompts, photos, and references",
          description: "Generate line art from mixed creative inputs.",
          inputKinds: ["prompt-text", "image-photo", "reference-set"],
          outputTargets: ["line-art"],
        },
        {
          id: "music",
          label: "Music concepts from prompts, audio, and references",
          description: "Generate music concepts from prompts and audio.",
          inputKinds: ["prompt-text", "audio", "reference-set"],
          outputTargets: ["music"],
        },
      ],
    });

    expect(goalVariations).toEqual([
      {
        name: "line-art",
        description: "Generate line art from mixed creative inputs.",
        outcomes: ["line-art"],
        examples: ["Line art from prompts, photos, and references"],
        suitedAgents: ["creative-generation"],
        recommendedTools: [
          "ingest.source-materials",
          "normalize.references",
          "derive.line-art-spec",
          "assemble.output-payload",
        ],
      },
      {
        name: "music",
        description: "Generate music concepts from prompts and audio.",
        outcomes: ["music"],
        examples: ["Music concepts from prompts, audio, and references"],
        suitedAgents: ["creative-generation"],
        recommendedTools: [
          "ingest.source-materials",
          "normalize.references",
          "derive.music-spec",
          "assemble.output-payload",
        ],
      },
    ]);
  });

  it("reconciles selected tools with declared required tools", () => {
    const runtime = resolveSequentialAgentToolRuntime({
      id: "creative-agent",
      config: {
        agentType: "creative-generation",
        defaultOrchestration: "sequential",
        goalProfile: "line-art",
        inputKinds: ["prompt-text", "image-photo", "reference-set"],
        outputTargets: ["line-art"],
      },
      requiredTools: [
        "ingest.source-materials",
        "normalize.references",
        "derive.line-art-spec",
        "assemble.output-payload",
      ],
    });

    expect(runtime.selectedToolIds).toEqual([
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "assemble.output-payload",
    ]);
    expect(runtime.declaredRequiredTools).toEqual([
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "assemble.output-payload",
    ]);
  });

  it("fails when sequential selection resolves a tool outside declared required tools", () => {
    expect(() =>
      resolveSequentialAgentToolRuntime({
        id: "creative-agent",
        config: {
          agentType: "creative-generation",
          defaultOrchestration: "sequential",
          goalProfile: "line-art",
          inputKinds: ["prompt-text", "image-photo", "reference-set"],
          outputTargets: ["line-art"],
        },
        requiredTools: ["ingest.source-materials"],
      }),
    ).toThrow(
      'Sequential tooling selected undeclared tool "normalize.references" for agent "creative-agent".',
    );
  });
});
