import config from "./config";
import {
    assertCreativeGenerationConfig,
    assertCreativeGenerationState,
    assertCreativeGenerationOutput,
    createCreativeGenerationState,
    normalizeCreativeGenerationInput,
    type CreativeGenerationOutput,
} from "./schema";
import { requiredTools } from "./tools";

type ToolExecutionContext = {
    selectedToolCollections: string[];
    selectedToolIds: string[];
    executeTool: (toolId: string, state: any) => Promise<any>;
};

function requireToolExecutionContext(
    context: Record<string, any> | undefined
): ToolExecutionContext {
    if (
        !Array.isArray(context?.selectedToolCollections) ||
        !Array.isArray(context?.selectedToolIds) ||
        typeof context?.executeTool !== "function"
    ) {
        throw new Error("Creative generation run requires orchestration-selected tools and executeTool().");
    }

    return {
        selectedToolCollections: context.selectedToolCollections,
        selectedToolIds: context.selectedToolIds,
        executeTool: context.executeTool,
    };
}

export async function runAgent(
    raw: unknown,
    context?: Record<string, any>
): Promise<CreativeGenerationOutput> {
    const validatedConfig = assertCreativeGenerationConfig(config);
    const input = normalizeCreativeGenerationInput(raw);
    const toolContext = requireToolExecutionContext(context);

    let state = createCreativeGenerationState(input, validatedConfig);
    const executedToolIds: string[] = [];
    const declaredToolIds = new Set(requiredTools);

    for (const toolId of toolContext.selectedToolIds) {
        if (!declaredToolIds.has(toolId)) {
            throw new Error(`Creative generation run received undeclared tool "${toolId}".`);
        }
        const nextState = await toolContext.executeTool(toolId, state);
        state = assertCreativeGenerationState(nextState, toolId);
        executedToolIds.push(toolId);
    }

    if (!state.result) {
        throw new Error("Creative generation run completed without producing a final result payload.");
    }

    return assertCreativeGenerationOutput({
        kind: "creative-generation",
        agentId: validatedConfig.id,
        goalProfile: validatedConfig.goalProfile,
        outputTarget: state.result.outputTarget,
        brief: state.result.brief,
        references: state.result.references,
        constraints: state.result.constraints,
        artifact: state.result.artifact,
        execution: {
            selectedToolCollections: toolContext.selectedToolCollections,
            executedToolIds,
        },
    });
}

export default { runAgent };
