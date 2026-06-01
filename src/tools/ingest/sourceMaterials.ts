function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }

  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function normalizeAssets(kind: "image-photo" | "audio", value: unknown) {
  const entries = Array.isArray(value) ? value : value === undefined ? [] : [value];

  return entries
    .map((entry, index) => {
      if (typeof entry === "string" && entry.trim()) {
        return { kind, source: entry.trim(), label: `${kind}-${index + 1}` };
      }

      if (!isRecord(entry)) return null;

      const source = firstString(entry.source, entry.uri, entry.url, entry.path);
      if (!source) return null;

      return {
        kind,
        source,
        label: firstString(entry.label, entry.name, entry.title, `${kind}-${index + 1}`)!,
        description: firstString(entry.description, entry.caption, entry.summary),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function requireState(spec: unknown, toolId: string) {
  if (!isRecord(spec)) {
    throw new Error(`${toolId} requires a workflow state object.`);
  }

  const config = isRecord(spec.config) ? spec.config : {};
  const input = isRecord(spec.input) ? spec.input : {};
  const working = isRecord(spec.working) ? spec.working : {};
  const validation = isRecord(spec.validation) ? spec.validation : {};
  const constraints = isRecord(working.constraints) ? working.constraints : {};

  return {
    ...spec,
    config: {
      ...config,
      inputKinds: normalizeList(config.inputKinds),
    },
    input: {
      ...input,
      prompt: firstString(input.prompt),
      audience: firstString(input.audience),
      references: Array.isArray(input.references) ? input.references : [],
      images: normalizeAssets("image-photo", input.images),
      audio: normalizeAssets("audio", input.audio),
      style: normalizeList(input.style),
      mood: normalizeList(input.mood),
      theme: normalizeList(input.theme),
      format: firstString(input.format),
      constraints: normalizeList(input.constraints),
    },
    working: {
      ...working,
      constraints: {
        style: normalizeList(constraints.style),
        mood: normalizeList(constraints.mood),
        theme: normalizeList(constraints.theme),
        format: firstString(constraints.format) ?? "",
        constraints: normalizeList(constraints.constraints),
      },
    },
    validation: {
      ...validation,
      completedSteps: normalizeList(validation.completedSteps),
    },
  };
}

function declaresInputKind(state: ReturnType<typeof requireState>, kind: string): boolean {
  return state.config.inputKinds.includes(kind);
}

function completedSteps(state: ReturnType<typeof requireState>, toolId: string): string[] {
  return state.validation.completedSteps.includes(toolId)
    ? state.validation.completedSteps
    : [...state.validation.completedSteps, toolId];
}

export async function runTool(spec: unknown) {
  const toolId = "ingest.source-materials";
  const state = requireState(spec, toolId);

  const hasPrompt = typeof state.input.prompt === "string" && state.input.prompt.length > 0;
  const hasImages = state.input.images.length > 0;
  const hasAudio = state.input.audio.length > 0;
  const hasReferences = state.input.references.length > 0;

  if (hasPrompt && !declaresInputKind(state, "prompt-text")) {
    throw new Error(`${toolId} received prompt text that is not declared in inputKinds.`);
  }

  if (hasImages && !declaresInputKind(state, "image-photo")) {
    throw new Error(`${toolId} received image/photo input that is not declared in inputKinds.`);
  }

  if (hasAudio && !declaresInputKind(state, "audio")) {
    throw new Error(`${toolId} received audio input that is not declared in inputKinds.`);
  }

  if (hasReferences && !declaresInputKind(state, "reference-set")) {
    throw new Error(`${toolId} received references that are not declared in inputKinds.`);
  }

  if (!hasPrompt && !hasImages && !hasAudio) {
    throw new Error(
      `${toolId} requires at least one supported primary source input (prompt-text, image-photo, or audio).`,
    );
  }

  return {
    ...state,
    working: {
      ...state.working,
      prompt: state.input.prompt ?? state.working.prompt,
      audience: state.input.audience ?? state.working.audience,
      images: state.input.images,
      audio: state.input.audio,
      constraints: {
        style: state.input.style,
        mood: state.input.mood,
        theme: state.input.theme,
        format: state.input.format ?? state.working.constraints.format,
        constraints: state.input.constraints,
      },
    },
    validation: {
      ...state.validation,
      completedSteps: completedSteps(state, toolId),
    },
  };
}

export default { run: runTool };
