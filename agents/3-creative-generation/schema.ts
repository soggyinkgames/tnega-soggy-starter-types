export type CreativeInputKind =
    | "prompt-text"
    | "reference-set"
    | "image-photo"
    | "audio";

export type CreativeOutputTarget =
    | "line-art"
    | "music";

export type CreativeSourceAsset = {
    kind: "image-photo" | "audio";
    source: string;
    label: string;
    description?: string;
};

export type CreativeReference = {
    kind: string;
    label: string;
    summary: string;
    source?: string;
};

export type CreativeConstraints = {
    style: string[];
    mood: string[];
    theme: string[];
    format: string;
    constraints: string[];
};

export type CreativeArtifact = {
    title: string;
    summary: string;
    format: string;
    prompt: string;
};

export type CreativeGenerationConfig = {
    id: string;
    agentType: "creative-generation";
    defaultOrchestration: string;
    goalProfile: string;
    inputKinds: CreativeInputKind[];
    outputTargets: CreativeOutputTarget[];
    evals?: string[];
    capabilities: {
        enabled: string[];
        availableOnRequest: string[];
        disallowed: string[];
    };
    memory?: {
        provider?: string;
    };
    framework?: string;
};

export type CreativeGenerationInput = {
    prompt?: string;
    audience?: string;
    references: Array<string | Record<string, unknown>>;
    images: CreativeSourceAsset[];
    audio: CreativeSourceAsset[];
    style: string[];
    mood: string[];
    theme: string[];
    format?: string;
    constraints: string[];
};

export type CreativeGenerationOutput = {
    kind: "creative-generation";
    agentId: string;
    goalProfile: string;
    outputTarget: CreativeOutputTarget;
    brief: {
        prompt: string;
        audience?: string;
        deliverable: string;
    };
    references: CreativeReference[];
    constraints: CreativeConstraints;
    artifact: CreativeArtifact;
    execution: {
        selectedToolCollections: string[];
        executedToolIds: string[];
    };
};

export type CreativeGenerationResult = {
    outputTarget: CreativeOutputTarget;
    brief: {
        prompt: string;
        audience?: string;
        deliverable: string;
    };
    references: CreativeReference[];
    constraints: CreativeConstraints;
    artifact: CreativeArtifact;
};

export type CreativeGenerationState = {
    config: CreativeGenerationConfig;
    input: CreativeGenerationInput;
    working: {
        prompt?: string;
        audience?: string;
        references: CreativeReference[];
        images: CreativeSourceAsset[];
        audio: CreativeSourceAsset[];
        constraints: CreativeConstraints;
        artifact?: CreativeArtifact & { notes?: string[] };
    };
    validation: {
        declaredInputKinds: CreativeInputKind[];
        declaredOutputTargets: CreativeOutputTarget[];
        completedSteps: string[];
        warnings: string[];
    };
    result?: CreativeGenerationResult;
};

const ALLOWED_INPUT_KINDS = new Set<CreativeInputKind>([
    "prompt-text",
    "reference-set",
    "image-photo",
    "audio",
]);

const ALLOWED_OUTPUT_TARGETS = new Set<CreativeOutputTarget>([
    "line-art",
    "music",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
}

function normalizeList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .filter((entry): entry is string => typeof entry === "string")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
}

function normalizeSourceAsset(
    kind: CreativeSourceAsset["kind"],
    value: unknown,
    index: number
): CreativeSourceAsset | null {
    if (typeof value === "string" && value.trim()) {
        return {
            kind,
            source: value.trim(),
            label: `${kind}-${index + 1}`,
        };
    }

    if (!isRecord(value)) {
        return null;
    }

    const source = firstString(value.source, value.uri, value.url, value.path);
    if (!source) {
        return null;
    }

    return {
        kind,
        source,
        label: firstString(value.label, value.name, value.title, `${kind}-${index + 1}`)!,
        description: firstString(value.description, value.caption, value.summary),
    };
}

function normalizeSourceAssets(
    kind: CreativeSourceAsset["kind"],
    value: unknown
): CreativeSourceAsset[] {
    const entries = Array.isArray(value) ? value : value === undefined ? [] : [value];

    return entries
        .map((entry, index) => normalizeSourceAsset(kind, entry, index))
        .filter((entry): entry is CreativeSourceAsset => entry !== null);
}

function assertAllowedStringArray<T extends string>(
    value: unknown,
    fieldName: string,
    allowed: Set<T>
): T[] {
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        throw new Error(`${fieldName} must be a string array.`);
    }

    if (value.length === 0) {
        throw new Error(`${fieldName} must not be empty.`);
    }

    for (const entry of value) {
        if (!allowed.has(entry as T)) {
            throw new Error(`${fieldName} contains unsupported value "${entry}".`);
        }
    }

    return value as T[];
}

export function normalizeCreativeGenerationInput(raw: unknown): CreativeGenerationInput {
    if (typeof raw === "string" && raw.trim()) {
        return {
            prompt: raw.trim(),
            references: [],
            images: [],
            audio: [],
            style: [],
            mood: [],
            theme: [],
            constraints: [],
        };
    }

    const source = isRecord(raw) ? raw : {};
    const brief = isRecord(source.brief) ? source.brief : {};

    return {
        prompt: firstString(
            source.prompt,
            typeof source.brief === "string" ? source.brief : undefined,
            brief.prompt
        ),
        audience: firstString(source.audience, brief.audience),
        references: Array.isArray(source.references)
            ? source.references
            : Array.isArray(brief.references)
                ? brief.references
                : [],
        images: normalizeSourceAssets(
            "image-photo",
            source.images ?? source.photos ?? source.image ?? brief.images ?? brief.photos
        ),
        audio: normalizeSourceAssets(
            "audio",
            source.audio ?? source.audioClips ?? source.tracks ?? brief.audio
        ),
        style: normalizeList(source.style ?? brief.style),
        mood: normalizeList(source.mood ?? brief.mood),
        theme: normalizeList(source.theme ?? brief.theme),
        format: firstString(source.format, brief.format, source.deliverable, brief.deliverable),
        constraints: normalizeList(source.constraints ?? brief.constraints),
    };
}

export function assertCreativeGenerationConfig(raw: unknown): CreativeGenerationConfig {
    if (!isRecord(raw)) {
        throw new Error("CreativeGenerationConfig must be an object.");
    }

    if (raw.agentType !== "creative-generation") {
        throw new Error("CreativeGenerationConfig.agentType must be creative-generation.");
    }

    if (typeof raw.id !== "string" || !raw.id) {
        throw new Error("CreativeGenerationConfig.id is required.");
    }

    if (typeof raw.defaultOrchestration !== "string" || !raw.defaultOrchestration) {
        throw new Error("CreativeGenerationConfig.defaultOrchestration is required.");
    }

    if (typeof raw.goalProfile !== "string" || !raw.goalProfile) {
        throw new Error("CreativeGenerationConfig.goalProfile is required.");
    }

    if (
        !isRecord(raw.capabilities) ||
        !Array.isArray(raw.capabilities.enabled) ||
        !raw.capabilities.enabled.every((capability) => typeof capability === "string") ||
        !Array.isArray(raw.capabilities.availableOnRequest) ||
        !raw.capabilities.availableOnRequest.every((capability) => typeof capability === "string") ||
        !Array.isArray(raw.capabilities.disallowed) ||
        !raw.capabilities.disallowed.every((capability) => typeof capability === "string") ||
        !raw.capabilities.enabled.includes("chat")
    ) {
        throw new Error("CreativeGenerationConfig.capabilities must define enabled, availableOnRequest, and disallowed string arrays with chat enabled.");
    }

    const inputKinds = assertAllowedStringArray(
        raw.inputKinds,
        "CreativeGenerationConfig.inputKinds",
        ALLOWED_INPUT_KINDS
    );
    const outputTargets = assertAllowedStringArray(
        raw.outputTargets,
        "CreativeGenerationConfig.outputTargets",
        ALLOWED_OUTPUT_TARGETS
    );

    return {
        id: raw.id,
        agentType: "creative-generation",
        defaultOrchestration: raw.defaultOrchestration,
        goalProfile: raw.goalProfile,
        inputKinds,
        outputTargets,
        evals: Array.isArray(raw.evals)
            ? raw.evals.filter((evalId): evalId is string => typeof evalId === "string")
            : undefined,
        capabilities: {
            enabled: [...raw.capabilities.enabled],
            availableOnRequest: [...raw.capabilities.availableOnRequest],
            disallowed: [...raw.capabilities.disallowed],
        },
        memory: isRecord(raw.memory)
            ? {
                provider: firstString(raw.memory.provider),
            }
            : undefined,
        framework: firstString(raw.framework),
    };
}

export function createCreativeGenerationState(
    input: CreativeGenerationInput,
    config: CreativeGenerationConfig
): CreativeGenerationState {
    const defaultFormat = config.outputTargets[0] === "music" ? "track" : "illustration";

    return {
        config,
        input,
        working: {
            prompt: input.prompt,
            audience: input.audience,
            references: [],
            images: input.images,
            audio: input.audio,
            constraints: {
                style: input.style,
                mood: input.mood,
                theme: input.theme,
                format: input.format ?? defaultFormat,
                constraints: input.constraints,
            },
        },
        validation: {
            declaredInputKinds: [...config.inputKinds],
            declaredOutputTargets: [...config.outputTargets],
            completedSteps: [],
            warnings: [],
        },
    };
}

export function assertCreativeGenerationState(
    raw: unknown,
    stepId = "workflow step"
): CreativeGenerationState {
    try {
        if (!isRecord(raw)) {
            throw new Error("State must be an object.");
        }

        const config = assertCreativeGenerationConfig(raw.config);
        const input = normalizeCreativeGenerationInput(raw.input);
        const working = isRecord(raw.working) ? raw.working : null;
        const validation = isRecord(raw.validation) ? raw.validation : null;

        if (!working) {
            throw new Error("State is missing working state.");
        }

        if (!validation) {
            throw new Error("State is missing validation state.");
        }

        const resultSource = isRecord(raw.result) ? raw.result : null;

        const state: CreativeGenerationState = {
            config,
            input,
            working: {
                prompt: firstString(working.prompt),
                audience: firstString(working.audience),
                references: Array.isArray(working.references)
                    ? working.references
                        .filter(isRecord)
                        .map((reference, index) => ({
                            kind: firstString(reference.kind, "reference")!,
                            label: firstString(reference.label, `reference-${index + 1}`)!,
                            summary: firstString(reference.summary, reference.label, "reference")!,
                            source: firstString(reference.source),
                        }))
                    : [],
                images: normalizeSourceAssets("image-photo", working.images),
                audio: normalizeSourceAssets("audio", working.audio),
                constraints: {
                    style: normalizeList(working.constraints && isRecord(working.constraints) ? working.constraints.style : undefined),
                    mood: normalizeList(working.constraints && isRecord(working.constraints) ? working.constraints.mood : undefined),
                    theme: normalizeList(working.constraints && isRecord(working.constraints) ? working.constraints.theme : undefined),
                    format: firstString(
                        working.constraints && isRecord(working.constraints) ? working.constraints.format : undefined,
                        "concept"
                    )!,
                    constraints: normalizeList(
                        working.constraints && isRecord(working.constraints) ? working.constraints.constraints : undefined
                    ),
                },
                artifact: isRecord(working.artifact)
                    ? {
                        title: firstString(working.artifact.title, "Creative Output")!,
                        summary: firstString(working.artifact.summary, "Creative output")!,
                        format: firstString(working.artifact.format, "concept")!,
                        prompt: firstString(working.artifact.prompt, "")!,
                        notes: normalizeList(working.artifact.notes),
                    }
                    : undefined,
            },
            validation: {
                declaredInputKinds: assertAllowedStringArray(
                    validation.declaredInputKinds,
                    `CreativeGenerationState.validation.declaredInputKinds after ${stepId}`,
                    ALLOWED_INPUT_KINDS
                ),
                declaredOutputTargets: assertAllowedStringArray(
                    validation.declaredOutputTargets,
                    `CreativeGenerationState.validation.declaredOutputTargets after ${stepId}`,
                    ALLOWED_OUTPUT_TARGETS
                ),
                completedSteps: normalizeList(validation.completedSteps),
                warnings: normalizeList(validation.warnings),
            },
            result: resultSource
                ? {
                    outputTarget: (() => {
                        const outputTarget = firstString(resultSource.outputTarget);
                        if (!outputTarget || !ALLOWED_OUTPUT_TARGETS.has(outputTarget as CreativeOutputTarget)) {
                            throw new Error("State has an invalid result.outputTarget.");
                        }
                        return outputTarget as CreativeOutputTarget;
                    })(),
                    brief: (() => {
                        const brief = isRecord(resultSource.brief) ? resultSource.brief : null;
                        if (!brief) {
                            throw new Error("State is missing result.brief.");
                        }
                        const prompt = firstString(brief.prompt);
                        const deliverable = firstString(brief.deliverable);
                        if (!prompt || !deliverable) {
                            throw new Error("State has an invalid result.brief.");
                        }
                        return {
                            prompt,
                            audience: firstString(brief.audience),
                            deliverable,
                        };
                    })(),
                    references: Array.isArray(resultSource.references)
                        ? resultSource.references
                            .filter(isRecord)
                            .map((reference, index) => ({
                                kind: firstString(reference.kind, "reference")!,
                                label: firstString(reference.label, `reference-${index + 1}`)!,
                                summary: firstString(reference.summary, reference.label, "reference")!,
                                source: firstString(reference.source),
                            }))
                        : [],
                    constraints: (() => {
                        const constraints = isRecord(resultSource.constraints) ? resultSource.constraints : null;
                        if (!constraints) {
                            throw new Error("State is missing result.constraints.");
                        }
                        const format = firstString(constraints.format);
                        if (!format) {
                            throw new Error("State has an invalid result.constraints.");
                        }
                        return {
                            style: normalizeList(constraints.style),
                            mood: normalizeList(constraints.mood),
                            theme: normalizeList(constraints.theme),
                            format,
                            constraints: normalizeList(constraints.constraints),
                        };
                    })(),
                    artifact: (() => {
                        const artifact = isRecord(resultSource.artifact) ? resultSource.artifact : null;
                        if (!artifact) {
                            throw new Error("State is missing result.artifact.");
                        }
                        const title = firstString(artifact.title);
                        const summary = firstString(artifact.summary);
                        const format = firstString(artifact.format);
                        const prompt = firstString(artifact.prompt);
                        if (!title || !summary || !format || !prompt) {
                            throw new Error("State has an invalid result.artifact.");
                        }
                        return {
                            title,
                            summary,
                            format,
                            prompt,
                        };
                    })(),
                }
                : undefined,
        };

        if (state.validation.declaredOutputTargets[0] !== state.config.outputTargets[0]) {
            throw new Error("State has mismatched output target state.");
        }

        return state;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`CreativeGenerationState after ${stepId} is invalid: ${message}`);
    }
}

export function assertCreativeGenerationOutput(raw: unknown): CreativeGenerationOutput {
    if (!isRecord(raw)) {
        throw new Error("CreativeGenerationOutput must be an object.");
    }

    if (raw.kind !== "creative-generation") {
        throw new Error("CreativeGenerationOutput.kind must be creative-generation.");
    }

    const artifact = isRecord(raw.artifact) ? raw.artifact : null;
    const execution = isRecord(raw.execution) ? raw.execution : null;
    const brief = isRecord(raw.brief) ? raw.brief : null;
    const constraints = isRecord(raw.constraints) ? raw.constraints : null;

    if (typeof raw.agentId !== "string" || !raw.agentId) {
        throw new Error("CreativeGenerationOutput.agentId is invalid.");
    }

    if (typeof raw.goalProfile !== "string" || !raw.goalProfile) {
        throw new Error("CreativeGenerationOutput.goalProfile is invalid.");
    }

    if (
        typeof raw.outputTarget !== "string" ||
        !ALLOWED_OUTPUT_TARGETS.has(raw.outputTarget as CreativeOutputTarget)
    ) {
        throw new Error("CreativeGenerationOutput.outputTarget is invalid.");
    }

    if (!artifact || typeof artifact.title !== "string" || typeof artifact.summary !== "string") {
        throw new Error("CreativeGenerationOutput.artifact is invalid.");
    }

    if (
        !execution ||
        !Array.isArray(execution.selectedToolCollections) ||
        execution.selectedToolCollections.length === 0 ||
        execution.selectedToolCollections.some((collectionId) => typeof collectionId !== "string") ||
        !Array.isArray(execution.executedToolIds)
    ) {
        throw new Error("CreativeGenerationOutput.execution is invalid.");
    }

    if (
        !brief ||
        typeof brief.prompt !== "string" ||
        typeof brief.deliverable !== "string"
    ) {
        throw new Error("CreativeGenerationOutput.brief is invalid.");
    }

    if (
        !constraints ||
        typeof constraints.format !== "string" ||
        !Array.isArray(constraints.style) ||
        !Array.isArray(constraints.mood) ||
        !Array.isArray(constraints.theme) ||
        !Array.isArray(constraints.constraints)
    ) {
        throw new Error("CreativeGenerationOutput.constraints is invalid.");
    }

    if (!Array.isArray(raw.references)) {
        throw new Error("CreativeGenerationOutput.references is invalid.");
    }

    return raw as CreativeGenerationOutput;
}
