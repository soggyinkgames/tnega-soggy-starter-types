export type TemplateVariableInput = {
  agentName: string;
  primaryGoalId: string;
  primaryGoalLabel: string;
  agentType: string;
  orchestrationId: string;
  defaultOrchestration: string;
  framework: string;
  goalProfile: string;
  goalDescription: string;
  goals: string[];
  outcomes: string[];
  tools: string[];
  evals: string[];
  memoryProvider: string;
  inputKinds: string[];
  outputTargets: string[];
};

export function buildTemplateVariables(
  params: TemplateVariableInput,
): Record<string, string> {
  return {
    "__AGENT_NAME__": params.agentName,
    "__PRIMARY_GOAL_ID__": params.primaryGoalId,
    "__PRIMARY_GOAL_LABEL__": params.primaryGoalLabel,
    "__AGENT_TYPE__": params.agentType,
    "__ORCHESTRATION_ID__": params.orchestrationId,
    "__DEFAULT_ORCHESTRATION__": params.defaultOrchestration,
    "__FRAMEWORK__": params.framework,
    "__GOAL_PROFILE__": params.goalProfile,
    "__GOAL_NAME__": params.goalProfile,
    "__GOAL_DESCRIPTION__": params.goalDescription,
    "__GOALS_JSON__": JSON.stringify(params.goals),
    "__OUTCOMES_JSON__": JSON.stringify(params.outcomes),
    "__OUTCOMES_LIST__": params.outcomes.join(", ") || "(none)",
    "__TOOLS_JSON__": JSON.stringify(params.tools),
    "__TOOLS_LIST__": params.tools.join(", ") || "(none)",
    "__EVALS_JSON__": JSON.stringify(params.evals),
    "__EVALS_LIST__": params.evals.join(", ") || "(none)",
    "__MEMORY_PROVIDER__": params.memoryProvider,
    "__INPUT_KINDS_JSON__": JSON.stringify(params.inputKinds),
    "__OUTPUT_TARGETS_JSON__": JSON.stringify(params.outputTargets),
    "__INPUT_KINDS_LIST__": params.inputKinds.join(", ") || "(none)",
    "__OUTPUT_TARGETS_LIST__": params.outputTargets.join(", ") || "(none)",
  };
}

export function renderTemplateContent(
  content: string,
  templateVariables: Record<string, string>,
) {
  let rendered = content;

  for (const [templateVariable, value] of Object.entries(templateVariables)) {
    rendered = rendered.split(templateVariable).join(value);
  }

  return rendered;
}
