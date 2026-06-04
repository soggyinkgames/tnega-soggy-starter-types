import { describe, expect, it } from "vitest";

import { assertAgentConfigCapabilities } from "../scripts/helpers/agentCapabilities.js";
import knowledgeInsightConfig from "./1-knowledge-insight/config.js";
import strategyConfig from "./2-strategy/config.js";
import creativeGenerationConfig from "./3-creative-generation/config.js";
import workflowAssistantConfig from "./4-personal-workflow-assistant/config.js";
import dataAnalystDebuggerConfig from "./5-data-analyst-debugger/config.js";
import simulationScenarioConfig from "./6-simulation-scenario/config.js";
import educationalConfig from "./7-educational/config.js";
import devInfrastructureConfig from "./8-dev-infrastructure/config.js";

const agentConfigs = [
    ["1-knowledge-insight", knowledgeInsightConfig],
    ["2-strategy", strategyConfig],
    ["3-creative-generation", creativeGenerationConfig],
    ["4-personal-workflow-assistant", workflowAssistantConfig],
    ["5-data-analyst-debugger", dataAnalystDebuggerConfig],
    ["6-simulation-scenario", simulationScenarioConfig],
    ["7-educational", educationalConfig],
    ["8-dev-infrastructure", devInfrastructureConfig],
] as const;

describe("agent config capabilities", () => {
    it.each(agentConfigs)("%s declares runtime-expandable capabilities", (_agentName, config) => {
        expect(config.capabilities).toEqual({
            enabled: ["chat"],
            availableOnRequest: [],
            disallowed: [],
        });
    });

    it("rejects malformed capability config", () => {
        expect(() =>
            assertAgentConfigCapabilities({
                id: "bad-agent",
                capabilities: {
                    enabled: [],
                    availableOnRequest: "tools",
                    disallowed: [],
                },
            })
        ).toThrow("Agent config capabilities must define enabled, availableOnRequest, and disallowed string arrays with chat enabled.");
    });
});
