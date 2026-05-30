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
  const toolId = "derive.music-spec";
  if (!isRecord(spec)) {
    throw new Error(`${toolId} requires a workflow state object.`);
  }

  const state = spec as any;
  const outputTarget = Array.isArray(state.config?.outputTargets) ? state.config.outputTargets[0] : undefined;

  if (outputTarget !== "music") {
    throw new Error(`${toolId} requires outputTargets to include "music".`);
  }

  const audio = Array.isArray(state.working?.audio) ? state.working.audio : [];
  const references = Array.isArray(state.working?.references) ? state.working.references : [];
  const constraints = isRecord(state.working?.constraints) ? state.working.constraints : {};
  const prompt =
    state.working?.prompt ??
    firstString(
      audio[0]?.description,
      audio[0]?.label,
      "Music concept",
    )!;
  const format = firstString(constraints.format, "track")!;
  const sourceNote = audio.length
    ? `Guided by ${audio.length} audio source(s).`
    : "Guided by prompt text direction.";

  return {
    ...state,
    working: {
      ...state.working,
      artifact: {
        title: `Music ${format}`,
        summary: `Music output for ${prompt}. ${sourceNote}`,
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
