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
  run(task: any, agents: Agent[]): Promise<OrchestrationResult>;
}

export interface Agent {
  id: string;
  name?: string;
  role?: string;
  cost?: number;
  propose?: (task: any) => Promise<{ score?: number } | null>;
  run: (input: any, context?: Record<string, any>) => Promise<any>;
  respond?: (prompt: string, context?: Record<string, any>) => Promise<string>;
}
