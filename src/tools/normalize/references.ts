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
  const toolId = "normalize.references";
  if (!isRecord(spec)) {
    throw new Error(`${toolId} requires a workflow state object.`);
  }

  const state = spec as any;
  const rawReferences = Array.isArray(state.input?.references) ? state.input.references : [];
  type NormalizedReference = {
    kind: string;
    label: string;
    summary: string;
    source?: string;
  };

  const references = rawReferences
    .map((entry, index) => {
      if (typeof entry === "string" && entry.trim()) {
        return {
          kind: "reference",
          label: `reference-${index + 1}`,
          summary: entry.trim(),
        } satisfies NormalizedReference;
      }

      if (isRecord(entry)) {
        const summary = firstString(entry.summary, entry.text, entry.prompt, entry.label);
        if (!summary) return null;
        return {
          kind: firstString(entry.kind, "reference")!,
          label: firstString(entry.label, `reference-${index + 1}`)!,
          summary,
          source: firstString(entry.source, entry.url),
        } satisfies NormalizedReference;
      }

      return null;
    })
    .filter((entry): entry is NormalizedReference => entry !== null);

  return {
    ...state,
    working: {
      ...state.working,
      references,
    },
    validation: {
      ...state.validation,
      completedSteps: completedSteps(state, toolId),
    },
  };
}

export default { run: runTool };
