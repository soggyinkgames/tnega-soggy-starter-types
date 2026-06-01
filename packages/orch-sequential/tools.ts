import { resolveToolIdsForCollections } from "../../src/tools/collections";

const CREATIVE_TARGET_RULES = Object.freeze({
  "line-art": {
    collections: ["source-material-preparation", "line-art-specification"],
    supportedInputs: ["prompt-text", "image-photo"],
  },
  "music": {
    collections: ["source-material-preparation", "music-specification"],
    supportedInputs: ["prompt-text", "audio"],
  },
} satisfies Record<
  string,
  {
    collections: readonly string[];
    supportedInputs: readonly string[];
  }
>);

export type SequentialAgentToolSelectionInput = {
  agentType?: string;
  goalProfile?: string;
  inputKinds?: string[];
  outputTargets?: string[];
  toolCollections?: string[];
  tool_collections?: string[];
  defaultOrchestration?: string;
  default_orch?: string;
};

export type SequentialAgentToolRuntimeInput = {
  id?: string;
  config?: SequentialAgentToolSelectionInput;
  requiredTools?: string[];
};

export type SequentialAgentToolRuntime = {
  selectedToolCollections: string[];
  selectedToolIds: string[];
  declaredRequiredTools: string[];
};

export type SequentialGoalVariation = {
  name: string;
  description?: string;
  outcomes?: string[];
  examples?: string[];
  recommendedTools?: string[];
  suitedAgents?: string[];
};

export type SequentialCreativeSpecialization = {
  id: string;
  label: string;
  description?: string;
  inputKinds: readonly string[];
  outputTargets: readonly string[];
};

function normalizeOrchestration(value?: string): string {
  if (!value) return "sequential";
  return value.replace(/^orch-/, "");
}

function assertStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`Creative-generation sequential selection requires ${fieldName} to be a string array.`);
  }

  if (value.length === 0) {
    throw new Error(`Creative-generation sequential selection requires ${fieldName} to be non-empty.`);
  }

  return value as string[];
}

function resolveOutputTarget(outputTargets: string[]): string {
  for (const outputTarget of outputTargets) {
    if (outputTarget in CREATIVE_TARGET_RULES) {
      return outputTarget;
    }
  }

  throw new Error(
    `Creative-generation sequential selection does not support outputTargets "${outputTargets.join(", ")}".`,
  );
}

export function selectToolCollectionsForSequentialAgent(
  config: SequentialAgentToolSelectionInput = {},
): string[] {
  const declaredCollections = config.toolCollections ?? config.tool_collections ?? [];

  if (config.agentType !== "creative-generation") {
    return declaredCollections;
  }

  if (normalizeOrchestration(config.defaultOrchestration ?? config.default_orch) !== "sequential") {
    throw new Error("Creative-generation sequential selection requires defaultOrchestration to be sequential.");
  }

  const inputKinds = assertStringArray(config.inputKinds, "inputKinds");
  const outputTargets = assertStringArray(config.outputTargets, "outputTargets");
  const outputTarget = resolveOutputTarget(outputTargets);
  const rule = CREATIVE_TARGET_RULES[outputTarget as keyof typeof CREATIVE_TARGET_RULES];

  if (!inputKinds.some((inputKind) => rule.supportedInputs.includes(inputKind))) {
    throw new Error(
      `Creative-generation sequential selection requires inputKinds compatible with outputTarget "${outputTarget}".`,
    );
  }

  return [...rule.collections];
}

function assertDeclaredRequiredTools(requiredTools: unknown, agentId?: string): string[] {
  if (requiredTools === undefined) {
    return [];
  }

  if (!Array.isArray(requiredTools) || requiredTools.some((toolId) => typeof toolId !== "string")) {
    throw new Error(
      `Sequential tooling requires agent "${agentId ?? "<unknown>"}" requiredTools to be a string array.`,
    );
  }

  return requiredTools;
}

export function resolveSequentialAgentToolRuntime(
  agent: SequentialAgentToolRuntimeInput,
): SequentialAgentToolRuntime {
  const config = agent.config ?? {};
  const selectedToolCollections = selectToolCollectionsForSequentialAgent(config);
  const selectedToolIds = resolveToolIdsForCollections(selectedToolCollections);
  const declaredRequiredTools = assertDeclaredRequiredTools(agent.requiredTools, agent.id);

  if (declaredRequiredTools.length > 0) {
    for (const toolId of selectedToolIds) {
      if (!declaredRequiredTools.includes(toolId)) {
        throw new Error(
          `Sequential tooling selected undeclared tool "${toolId}" for agent "${agent.id ?? "<unknown>"}".`,
        );
      }
    }
  }

  return {
    selectedToolCollections,
    selectedToolIds,
    declaredRequiredTools,
  };
}

export function getGoalVariations(params: {
  agentType: string;
  templateSpecializations?: SequentialCreativeSpecialization[];
}): SequentialGoalVariation[] | null {
  if (params.agentType !== "creative-generation") {
    return null;
  }

  const specializations = params.templateSpecializations ?? [];
  if (!specializations.length) {
    return [];
  }

  return specializations.map((specialization) => {
    const collections = specialization.outputTargets.includes("music")
      ? ["source-material-preparation", "music-specification"]
      : ["source-material-preparation", "line-art-specification"];

    return {
      name: specialization.id,
      description: specialization.description,
      outcomes: [...specialization.outputTargets],
      examples: [specialization.label],
      suitedAgents: ["creative-generation"],
      recommendedTools: resolveToolIdsForCollections(collections),
    };
  });
}

export async function getRecommendedTools(
  goalProfile: string,
  _runtime?: string,
  config?: SequentialAgentToolSelectionInput,
): Promise<string[]> {
  if (!config || config.agentType !== "creative-generation") {
    return [];
  }

  const collections = selectToolCollectionsForSequentialAgent({
    ...config,
    goalProfile: config.goalProfile ?? goalProfile,
  });

  return resolveToolIdsForCollections(collections);
}
