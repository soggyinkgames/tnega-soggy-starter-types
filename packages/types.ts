export interface HistoryEntry {
  agentId: string;
  input?: any;
  output?: any;
  error?: string;
  timestamp: number;
}

export interface OrchestrationResult {
  id: string;
  strategy?: string;
  result?: any;
  history?: HistoryEntry[];
  [key: string]: any;
}

export interface OrchestrationPattern {
  id: string;
  name: string;
  description: string;
  run(task: any, agents: Agent[], runtimeContext?: RuntimeContext): Promise<OrchestrationResult>;
}

export type RuntimeCapabilityRequestInput = {
  capability: string;
  reason?: string;
  agentId?: string;
  [key: string]: any;
};

export type RuntimeCapabilityRequestResult = {
  status: "unimplemented";
  request: RuntimeCapabilityRequestInput;
};

export type RuntimeContext = {
  executeTool: (
    toolId: string,
    input: Record<string, unknown>,
    context?: Record<string, unknown>,
  ) => Promise<any>;
  requestCapability: (
    request: RuntimeCapabilityRequestInput,
  ) => Promise<RuntimeCapabilityRequestResult>;
};

export interface Agent {
  id: string;
  config?: Record<string, any>;
  requiredTools?: string[];
  name?: string;
  role?: string;
  cost?: number;
  propose?: (task: any) => Promise<{ score?: number } | null>;
  run: (input: any, context?: Record<string, any>) => Promise<any>;
  respond?: (prompt: string, context?: Record<string, any>) => Promise<string>;
}
