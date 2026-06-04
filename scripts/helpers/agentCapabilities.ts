export const GENERATED_AGENT_CAPABILITIES = {
  chat: true,
} as const;

export type GeneratedAgentCapabilities = typeof GENERATED_AGENT_CAPABILITIES;

export function assertAgentConfigHasChatCapability(config: Record<string, unknown>) {
  const capabilities = config.capabilities;

  if (
    capabilities === null ||
    typeof capabilities !== "object" ||
    Array.isArray(capabilities) ||
    (capabilities as Record<string, unknown>).chat !== true
  ) {
    throw new Error("Agent config requires enabled chat capability at capabilities.chat.");
  }
}
