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
import { getSelectedToolExecutionContext } from "../../src/tools/executionContext";

export async function runAgent(
    raw: unknown,
    context?: Record<string, any>
): Promise<CreativeGenerationOutput> {
    const validatedConfig = assertCreativeGenerationConfig(config);
    const input = normalizeCreativeGenerationInput(raw);
    const toolContext = getSelectedToolExecutionContext(context, "Creative generation run");

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
