export interface Agent {
  id: string;
  name: string;
  role?: string; // e.g., 'manager' | 'worker'
  cost?: number;
  // Optional negotiation hook returning a higher-is-better score
  propose?: (task: any) => Promise<{ score: number; reason?: string }> | { score: number; reason?: string };
  // Primary execution method
  run: (input: any, context?: any) => Promise<any>;
  // Optional dialogue method for collaborative patterns
  respond?: (message: string, context?: any) => Promise<string>;
}

export interface OrchestrationPattern {
  id: string;
  name: string;
  description: string;
  run(task: any, agents: Agent[]): Promise<any>;
}

