export interface Tool {
  name: string;
  run(spec: any, ctx: any): Promise<any>;
}

