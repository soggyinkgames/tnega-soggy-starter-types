export const GENERATED_AGENT_CAPABILITIES = {
  enabled: ["chat"],
  availableOnRequest: [],
  disallowed: [],
} as const;

export type GeneratedAgentCapabilities = typeof GENERATED_AGENT_CAPABILITIES;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function assertAgentConfigCapabilities(config: Record<string, unknown>) {
  const capabilities = config.capabilities as Record<string, unknown> | undefined;

  if (
    !capabilities ||
    typeof capabilities !== "object" ||
    Array.isArray(capabilities) ||
    !isStringArray(capabilities.enabled) ||
    !isStringArray(capabilities.availableOnRequest) ||
    !isStringArray(capabilities.disallowed) ||
    !capabilities.enabled.includes("chat")
  ) {
    throw new Error(
      "Agent config capabilities must define enabled, availableOnRequest, and disallowed string arrays with chat enabled.",
    );
  }
}
