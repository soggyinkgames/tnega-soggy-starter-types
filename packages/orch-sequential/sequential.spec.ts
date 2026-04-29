import { describe, it, expect, vi } from "vitest";

import { SequentialOrch, runOrchFramework } from "./index.js";
import type { Agent } from "../types.js";

describe("SequentialOrch", () => {
  it("runs agents in order, passing output of each as input to the next", async () => {
    const task = { value: 1 };

    const agentA: Agent = {
      id: "agent-a",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("sequential");
        expect(ctx?.step).toBe(0);
        expect(ctx?.runOrchFramework).toBe(runOrchFramework);
        return input.value + 1;
      }),
    } as any;

    const agentB: Agent = {
      id: "agent-b",
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.mode).toBe("sequential");
        expect(ctx?.step).toBe(1);
        return input * 3;
      }),
    } as any;

    const result = await SequentialOrch.run(task, [agentA, agentB]);

    expect(result.id).toBe("orch-sequential");
    expect(result.strategy).toBe("sequential");
    expect(typeof result.duration).toBe("number");
    expect(result.result).toBe(6);
    expect(result.steps).toEqual([
      { agentId: "agent-a", output: 2 },
      { agentId: "agent-b", output: 6 },
    ]);
    expect(result.history?.length).toBe(2);
    expect(result.history?.every((entry) => typeof entry.timestamp === "number")).toBe(true);
  });

  it("captures errors per agent while continuing the sequence", async () => {
    const failingAgent: Agent = {
      id: "fail",
      run: vi.fn(async () => {
        throw new Error("boom");
      }),
    } as any;

    const okAgent: Agent = {
      id: "ok",
      run: vi.fn(async (input: any) => input + 5),
    } as any;

    const result = await SequentialOrch.run(10, [failingAgent, okAgent]);

    expect(result.result).toBe(15);
    expect(result.history?.find((entry) => entry.agentId === "fail")?.error).toContain("boom");
    expect(result.history?.find((entry) => entry.agentId === "ok")?.output).toBe(15);
  });

  it("throws when no agents are provided", async () => {
    await expect(SequentialOrch.run("task", [])).rejects.toThrow(
      "SequentialOrch requires at least one agent",
    );
  });

  it("passes ordered creative collections and tool ids through the runtime context", async () => {
    const creativeConfig = {
      id: "creative-agent",
      agentType: "creative-generation",
      defaultOrchestration: "sequential",
      goalProfile: "line-art",
      inputKinds: ["prompt-text", "image-photo", "reference-set"],
      outputTargets: ["line-art"],
    };

    const creativeAgent: Agent = {
      id: "creative-agent",
      config: creativeConfig,
      requiredTools: [
        "ingest.source-materials",
        "normalize.references",
        "derive.line-art-spec",
        "assemble.output-payload",
      ],
      run: vi.fn(async (input: any, ctx?: any) => {
        expect(ctx?.selectedToolCollections).toEqual([
          "source-material-preparation",
          "line-art-specification",
        ]);
        expect(ctx?.selectedToolIds).toEqual([
          "ingest.source-materials",
          "normalize.references",
          "derive.line-art-spec",
          "assemble.output-payload",
        ]);
        expect(ctx?.declaredRequiredTools).toEqual([
          "ingest.source-materials",
          "normalize.references",
          "derive.line-art-spec",
          "assemble.output-payload",
        ]);

        let state: any = {
          config: creativeConfig,
          input: {
            prompt: input.prompt,
            audience: input.audience,
            references: input.references ?? [],
            images: input.images ?? [],
            audio: input.audio ?? [],
            style: input.style ?? [],
            mood: input.mood ?? [],
            theme: input.theme ?? [],
            format: input.format,
            constraints: input.constraints ?? [],
          },
          working: {
            references: [],
            images: [],
            audio: [],
            constraints: {
              style: [],
              mood: [],
              theme: [],
              format: input.format ?? "illustration",
              constraints: [],
            },
          },
          validation: {
            declaredInputKinds: [...creativeConfig.inputKinds],
            declaredOutputTargets: [...creativeConfig.outputTargets],
            completedSteps: [],
            warnings: [],
          },
        };

        for (const toolId of ctx.selectedToolIds) {
          state = await ctx.executeTool(toolId, state);
        }

        return {
          kind: "creative-generation",
          agentId: creativeConfig.id,
          goalProfile: creativeConfig.goalProfile,
          outputTarget: state.result.outputTarget,
          brief: state.result.brief,
          references: state.result.references,
          constraints: state.result.constraints,
          artifact: state.result.artifact,
          execution: {
            selectedToolCollections: ctx.selectedToolCollections,
            executedToolIds: ctx.selectedToolIds,
          },
        };
      }),
    } as any;

    const result = await SequentialOrch.run(
      {
        prompt: "Hero poster",
        images: [{ source: "hero.png", label: "hero" }],
        references: [{ label: "ink", summary: "bold ink strokes" }],
        style: ["inked"],
        format: "poster",
      },
      [creativeAgent],
    );

    expect(result.result.kind).toBe("creative-generation");
    expect(result.result.outputTarget).toBe("line-art");
    expect(result.result.execution.selectedToolCollections).toEqual([
      "source-material-preparation",
      "line-art-specification",
    ]);
    expect(result.result.execution.executedToolIds).toEqual([
      "ingest.source-materials",
      "normalize.references",
      "derive.line-art-spec",
      "assemble.output-payload",
    ]);
    expect(result.result.artifact.summary).toContain("Line art output");
  });

  it("records an error when sequential tooling resolves a tool outside the agent declaration", async () => {
    const creativeAgent: Agent = {
      id: "creative-agent",
      config: {
        id: "creative-agent",
        agentType: "creative-generation",
        defaultOrchestration: "sequential",
        goalProfile: "line-art",
        inputKinds: ["prompt-text", "image-photo", "reference-set"],
        outputTargets: ["line-art"],
      },
      requiredTools: ["ingest.source-materials"],
      run: vi.fn(async () => {
        throw new Error("should not run");
      }),
    } as any;

    const result = await SequentialOrch.run({ prompt: "Poster" }, [creativeAgent]);

    expect(result.history?.[0]?.error).toContain(
      'Sequential tooling selected undeclared tool "normalize.references" for agent "creative-agent".',
    );
    expect(creativeAgent.run).not.toHaveBeenCalled();
  });
});
