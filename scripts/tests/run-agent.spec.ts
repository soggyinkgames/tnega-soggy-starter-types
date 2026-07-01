import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";

import { runAgentChatSession, runAgentCommand, runAgentEvals } from "../run-agent-runtime.js";

const AGENT_NAME = "__test-agent";
const ORCH_AGENT_NAME = "__test-sequential-agent";
const CAPABILITIES_TEXT = `capabilities: { enabled: ["chat"], availableOnRequest: [], disallowed: [] }`;
const CAPABILITIES = {
  enabled: ["chat"],
  availableOnRequest: [],
  disallowed: [],
};

let agentsRoot: string;

beforeAll(async () => {
  agentsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "run-agent-"));

  const agentDir = path.join(agentsRoot, AGENT_NAME);
  await fs.ensureDir(agentDir);
  const indexTs = `export async function runAgent(query: string){ return { output: \`Echo:${'${'}query${'}'}\` }; }`;
  await fs.writeFile(path.join(agentDir, "index.ts"), indexTs, "utf8");
  const configTs = `export default { id: "${AGENT_NAME}", evals: [], ${CAPABILITIES_TEXT} };`;
  await fs.writeFile(path.join(agentDir, "config.ts"), configTs, "utf8");
  const evalTs = `throw new Error("eval module should not load during runAgentCommand");`;
  await fs.writeFile(path.join(agentDir, "eval.ts"), evalTs, "utf8");

  const orchAgentDir = path.join(agentsRoot, ORCH_AGENT_NAME);
  await fs.ensureDir(orchAgentDir);
  const orchIndexTs = `
export async function runAgent(query: any, context?: any){
  const text = typeof query === "string" ? query : query.message ?? query.query;
  return {
    output: \`Sequential:\${text}\`,
    mode: "sequential",
    historySeen: Array.isArray(query?.history) ? query.history : [],
    contextHistory: Array.isArray(context?.conversationHistory) ? context.conversationHistory : [],
  };
}
`;
  await fs.writeFile(path.join(orchAgentDir, "index.ts"), orchIndexTs, "utf8");
  const orchConfigTs = `
export default {
  id: "${ORCH_AGENT_NAME}",
  evals: ["basic"],
  defaultOrchestration: "sequential",
  capabilities: { enabled: ["chat"], availableOnRequest: [], disallowed: [] },
};
`;
  await fs.writeFile(path.join(orchAgentDir, "config.ts"), orchConfigTs, "utf8");
  const orchToolsTs = `
export const requiredTools = ["search", "summarize"];
`;
  await fs.writeFile(path.join(orchAgentDir, "tools.ts"), orchToolsTs, "utf8");
});

afterAll(async () => {
  await fs.remove(agentsRoot);
});

async function runWithTsx(args: string[]): Promise<{ stdout: string; code: number }> {
  const script = path.resolve("scripts", "run-agent.ts");
  const tsxPath = path.resolve("node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  const useNodeLoader = !(await fs.pathExists(tsxPath));
  const quoted = (s: string) => (process.platform === "win32" ? `"${s}"` : `'${s.replace(/'/g, "'\\''")}'`);
  const cmd = useNodeLoader
    ? `${quoted(process.execPath)} --loader tsx ${quoted(script)} ${args.map(quoted).join(" ")}`
    : `${quoted(tsxPath)} ${quoted(script)} ${args.map(quoted).join(" ")}`;
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const code = (error as any)?.code ?? 0;
      resolve({ stdout: stdout + (stderr ? `\n[stderr]\n${stderr}` : ""), code });
    });
  });
}

async function* chatMessages(messages: string[]) {
  for (const message of messages) {
    yield message;
  }
}

describe("runAgentCommand", () => {
  it("loads config and runs a local agent directly", async () => {
    const result = await runAgentCommand({
      agentName: AGENT_NAME,
      query: "hello world",
      agentsRoot,
    });

    expect(result.config).toEqual({ id: AGENT_NAME, evals: [], capabilities: CAPABILITIES });
    expect(result.orchestrationId).toBeNull();
    expect(result.output).toEqual({ output: "Echo:hello world" });
    expect(result.displayOutput).toBe("Echo:hello world");
    expect(result.evalPath).toEqual(path.join(agentsRoot, AGENT_NAME, "eval.ts"));
  });

  it("routes orchestration-backed agents through the registry", async () => {
    const run = vi.fn(async () => ({
      id: "orch-sequential",
      result: { output: "Sequential:hello world" },
    }));

    const result = await runAgentCommand({
      agentName: ORCH_AGENT_NAME,
      query: "hello world",
      agentsRoot,
      orchestrationRegistry: {
        "orch-sequential": { run },
      },
    });

    expect(result.orchestrationId).toBe("orch-sequential");
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        executeTool: expect.any(Function),
        requestCapability: expect.any(Function),
      }),
    );
    expect(result.displayOutput).toBe("Sequential:hello world");
  });

  it("lets orchestration execute local tools through runtimeContext", async () => {
    const run = vi.fn(async (_task, _agents, runtimeContext) => ({
      id: "orch-sequential",
      result: await runtimeContext.executeTool("search", { query: "hello world" }),
    }));

    const result = await runAgentCommand({
      agentName: ORCH_AGENT_NAME,
      query: "hello world",
      agentsRoot,
      orchestrationRegistry: {
        "orch-sequential": { run },
      },
    });

    expect(result.orchestrationId).toBe("orch-sequential");
    expect(result.output).toEqual(
      expect.objectContaining({
        hits: expect.any(Array),
      }),
    );
  });

  it("passes requiredTools from tools.ts into orchestration", async () => {
    const run = vi.fn(async () => ({
      id: "orch-sequential",
      result: "ok",
    }));

    await runAgentCommand({
      agentName: ORCH_AGENT_NAME,
      query: "hello world",
      agentsRoot,
      orchestrationRegistry: {
        "orch-sequential": { run },
      },
    });

    expect(run).toHaveBeenCalledWith(
      "hello world",
      [
        expect.objectContaining({
          id: ORCH_AGENT_NAME,
          requiredTools: ["search", "summarize"],
          config: expect.objectContaining({
            defaultOrchestration: "sequential",
          }),
          run: expect.any(Function),
        }),
      ],
      expect.objectContaining({
        executeTool: expect.any(Function),
        requestCapability: expect.any(Function),
      }),
    );
  });

  it("fails clearly when an orchestration runner is not registered", async () => {
    await expect(
      runAgentCommand({
        agentName: ORCH_AGENT_NAME,
        query: "hello world",
        agentsRoot,
        orchestrationRegistry: {},
      }),
    ).rejects.toThrow('No orchestration runner is registered for "orch-sequential".');
  });

  it("fails when config has malformed capabilities", async () => {
    const agentDir = path.join(agentsRoot, "__missing-chat-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(
      path.join(agentDir, "index.ts"),
      `export async function runAgent(){ return { output: "ok" }; }`,
      "utf8",
    );
    await fs.writeFile(
      path.join(agentDir, "config.ts"),
      `export default { id: "__missing-chat-agent", evals: [], capabilities: { enabled: [], availableOnRequest: "tools", disallowed: [] } };`,
      "utf8",
    );

    await expect(
      runAgentCommand({
        agentName: "__missing-chat-agent",
        query: "hello world",
        agentsRoot,
      }),
    ).rejects.toThrow("Agent config capabilities must define enabled, availableOnRequest, and disallowed string arrays with chat enabled.");
  });

  it("fails when orchestration records an agent error", async () => {
    const run = vi.fn(async () => ({
      id: "orch-sequential",
      result: "stale result",
      history: [
        {
          agentId: ORCH_AGENT_NAME,
          error: "Error: tool failed",
          timestamp: Date.now(),
        },
      ],
    }));

    await expect(
      runAgentCommand({
        agentName: ORCH_AGENT_NAME,
        query: "hello world",
        agentsRoot,
        orchestrationRegistry: {
          "orch-sequential": { run },
        },
      }),
    ).rejects.toThrow(
      `Agent "${ORCH_AGENT_NAME}" failed during orch-sequential: Error: tool failed`,
    );
  });

  it("runs chat messages through orchestration with conversation history", async () => {
    const responses: string[] = [];
    const run = vi.fn(async (task, agents) => ({
      id: "orch-sequential",
      result: await agents[0].run(task, { mode: "sequential" }),
    }));

    const result = await runAgentChatSession({
      agentName: ORCH_AGENT_NAME,
      agentsRoot,
      messages: chatMessages(["hello", "again", "/exit"]),
      orchestrationRegistry: {
        "orch-sequential": { run },
      },
      onResponse: async (response) => {
        responses.push(response);
      },
    });

    expect(result.config).toEqual(
      expect.objectContaining({
        id: ORCH_AGENT_NAME,
        capabilities: CAPABILITIES,
      }),
    );
    expect(result.orchestrationId).toBe("orch-sequential");
    expect(run).toHaveBeenCalledTimes(2);
    expect(responses).toEqual(["Sequential:hello", "Sequential:again"]);

    expect(run.mock.calls[0]?.[0]).toEqual({
      mode: "chat",
      message: "hello",
      history: [],
      state: {
        conversation: [],
      },
    });
    expect(run.mock.calls[0]?.[1]).toEqual([
      expect.objectContaining({
        id: ORCH_AGENT_NAME,
        config: expect.objectContaining({ id: ORCH_AGENT_NAME }),
        requiredTools: ["search", "summarize"],
        run: expect.any(Function),
      }),
    ]);
    expect(run.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        executeTool: expect.any(Function),
        requestCapability: expect.any(Function),
      }),
    );
    expect(run.mock.calls[1]?.[0]).toEqual({
      mode: "chat",
      message: "again",
      history: [
        { role: "user", content: "hello" },
        {
          role: "agent",
          content: "Sequential:hello",
          output: {
            output: "Sequential:hello",
            mode: "sequential",
            historySeen: [],
            contextHistory: [],
          },
        },
      ],
      state: {
        conversation: [
          { role: "user", content: "hello" },
          {
            role: "agent",
            content: "Sequential:hello",
            output: {
              output: "Sequential:hello",
              mode: "sequential",
              historySeen: [],
              contextHistory: [],
            },
          },
        ],
      },
    });
    expect(result.history[3]?.output).toEqual(
      expect.objectContaining({
        output: "Sequential:again",
        historySeen: result.history.slice(0, 2),
        contextHistory: result.history.slice(0, 2),
      }),
    );
  });

  it("rejects chat mode when chat is not enabled", async () => {
    const agentDir = path.join(agentsRoot, "__no-chat-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(
      path.join(agentDir, "index.ts"),
      `export async function runAgent(){ return { output: "ok" }; }`,
      "utf8",
    );
    await fs.writeFile(
      path.join(agentDir, "config.ts"),
      `export default { id: "__no-chat-agent", evals: [], defaultOrchestration: "sequential", capabilities: { enabled: ["tools"], availableOnRequest: [], disallowed: [] } };`,
      "utf8",
    );

    await expect(
      runAgentChatSession({
        agentName: "__no-chat-agent",
        agentsRoot,
        messages: chatMessages(["hello"]),
        orchestrationRegistry: {
          "orch-sequential": { run: vi.fn() },
        },
      }),
    ).rejects.toThrow("Agent config capabilities must define enabled, availableOnRequest, and disallowed string arrays with chat enabled.");
  });

  it("runs evals through a mockable eval loader", async () => {
    const runEvals = vi.fn(async (payload: any) => [
      { id: "mock-eval", passed: true, notes: payload.output },
    ]);

    const results = await runAgentEvals({
      evalPath: path.join(agentsRoot, AGENT_NAME, "eval.ts"),
      input: "hello world",
      output: "Echo:hello world",
      agentName: AGENT_NAME,
      loadEvalModule: async () => ({ runEvals }),
    });

    expect(runEvals).toHaveBeenCalledWith(
      expect.objectContaining({
        input: "hello world",
        output: "Echo:hello world",
        meta: expect.objectContaining({ agent: AGENT_NAME }),
      }),
    );
    expect(results).toEqual([
      { id: "mock-eval", passed: true, notes: "Echo:hello world" },
    ]);
  });
});

describe("scripts/run-agent CLI", () => {
  it("exits with usage when args are missing", async () => {
    const { stdout, code } = await runWithTsx([]);
    expect(code).not.toBe(0);
    expect(stdout).toMatch(/Usage: npm run agent/);
  }, 30000);
});
