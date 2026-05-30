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

export async function runTool(spec: unknown) {
  const toolId = "derive.line-art-spec";
  if (!isRecord(spec)) {
    throw new Error(`${toolId} requires a workflow state object.`);
  }

  const state = spec as any;
  const outputTarget = Array.isArray(state.config?.outputTargets) ? state.config.outputTargets[0] : undefined;

  if (outputTarget !== "line-art") {
    throw new Error(`${toolId} requires outputTargets to include "line-art".`);
  }

  const images = Array.isArray(state.working?.images) ? state.working.images : [];
  const references = Array.isArray(state.working?.references) ? state.working.references : [];
  const constraints = isRecord(state.working?.constraints) ? state.working.constraints : {};
  const prompt =
    state.working?.prompt ??
    firstString(
      images[0]?.description,
      images[0]?.label,
      "Line art concept",
    )!;
  const format = firstString(constraints.format, "illustration")!;
  const sourceNote = images.length
    ? `Derived from ${images.length} image/photo source(s).`
    : "Derived from prompt text guidance.";

  return {
    ...state,
    working: {
      ...state.working,
      artifact: {
        title: `Line-art ${format}`,
        summary: `Line art output for ${prompt}. ${sourceNote}`,
        format,
        prompt,
        notes: [
          `Goal profile: ${state.config.goalProfile}`,
          `References: ${references.length}`,
          sourceNote,
        ],
      },
    },
    validation: {
      ...state.validation,
      completedSteps: completedSteps(state, toolId),
    },
  };
}

export default { run: runTool };
