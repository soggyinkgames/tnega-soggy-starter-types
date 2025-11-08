import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs-extra";
import path from "path";
import { exec } from "node:child_process";

const AGENT_NAME = "__test-agent";
const AGENT_DIR = path.resolve("agents", AGENT_NAME);

beforeAll(async () => {
  await fs.ensureDir(AGENT_DIR);
  // Minimal agent exposing runAgent(query: string)
  const indexTs = `export async function runAgent(query: string){ return { output: \`Echo:${'${'}query${'}'}\` }; }`;
  await fs.writeFile(path.join(AGENT_DIR, "index.ts"), indexTs, "utf8");
  const configTs = `export default { id: "${AGENT_NAME}", evals: [] };`;
  await fs.writeFile(path.join(AGENT_DIR, "config.ts"), configTs, "utf8");
});

afterAll(async () => {
  await fs.remove(AGENT_DIR);
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

describe("scripts/run-agent", () => {
  it("runs a local agent and prints output", async () => {
    const { stdout, code } = await runWithTsx([AGENT_NAME, "hello world"]);
    if (code !== 0) {
      throw new Error(`run-agent exited with code ${code}. Stdout:\n${stdout}`);
    }
    expect(stdout).toMatch(/Running Agent:/);
    expect(stdout).toMatch(/Agent run completed/);
    expect(stdout).toMatch(/Output:[\s\S]*Echo:hello world/);
  }, 60000);

  it("exits with usage when args are missing", async () => {
    const { stdout, code } = await runWithTsx([]);
    expect(code).not.toBe(0);
    expect(stdout).toMatch(/Usage: npm run agent/);
  }, 30000);
});
