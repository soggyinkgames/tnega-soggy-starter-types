function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function completedSteps(state: any, toolId: string): string[] {
  const previous = Array.isArray(state.validation?.completedSteps)
    ? state.validation.completedSteps.filter((entry: unknown): entry is string => typeof entry === "string")
    : [];

  return previous.includes(toolId) ? previous : [...previous, toolId];
}

function artifactPayload(input: {
  prompt: string;
  audience?: string;
  artifact: {
    title: string;
    summary: string;
    format: string;
    prompt: string;
  };
}) {
  return {
    brief: {
      prompt: input.prompt,
      audience: input.audience,
      deliverable: input.artifact.format,
    },
    artifact: {
      title: input.artifact.title,
      summary: input.artifact.summary,
      format: input.artifact.format,
      prompt: input.artifact.prompt,
    },
  };
}

export async function runTool(spec: unknown) {
  const toolId = "assemble.output-payload";
  if (!isRecord(spec)) {
    throw new Error(`${toolId} requires a workflow state object.`);
  }

  const state = spec as any;
  const artifact = state.working?.artifact;

  if (!artifact) {
    throw new Error(`${toolId} requires a prepared target artifact in state.working.artifact.`);
  }

  const prompt = firstString(state.working?.prompt, artifact.prompt);
  if (!prompt) {
    throw new Error(`${toolId} requires a resolved prompt before payload assembly.`);
  }

  const outputTarget = Array.isArray(state.config?.outputTargets) ? state.config.outputTargets[0] : undefined;
  if (!outputTarget) {
    throw new Error(`${toolId} requires outputTargets to be non-empty.`);
  }

  return {
    ...state,
    result: {
      outputTarget,
      ...artifactPayload({
        prompt,
        audience: state.working?.audience,
        artifact,
      }),
      references: Array.isArray(state.working?.references) ? state.working.references : [],
      constraints: isRecord(state.working?.constraints) ? state.working.constraints : {},
    },
    validation: {
      ...state.validation,
      completedSteps: completedSteps(state, toolId),
    },
  };
}

export default { run: runTool };
