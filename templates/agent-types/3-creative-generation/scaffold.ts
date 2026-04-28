import type { CreativeInputKind, CreativeOutputTarget } from "./schema";

export type CreativeGenerationSpecialization = {
  id: string;
  label: string;
  description: string;
  inputKinds: readonly CreativeInputKind[];
  outputTargets: readonly CreativeOutputTarget[];
};

export const defaultEvals = Object.freeze(["modelgraded", "safety"]);

export const creativeSpecializations = Object.freeze([
  {
    id: "line-art",
    label: "Line art from prompts, photos, and references",
    description: "Instantiate a creative-generation agent that produces line-art outputs from prompt text, photos, and reference material.",
    inputKinds: ["prompt-text", "image-photo", "reference-set"],
    outputTargets: ["line-art"],
  },
  {
    id: "music",
    label: "Music concepts from prompts, audio, and references",
    description: "Instantiate a creative-generation agent that produces music outputs from prompt text, audio inputs, and reference material.",
    inputKinds: ["prompt-text", "audio", "reference-set"],
    outputTargets: ["music"],
  },
] satisfies readonly CreativeGenerationSpecialization[]);

export const defaultCreativeSpecializationId = creativeSpecializations[0].id;

export function listCreativeSpecializationIds(): string[] {
  return creativeSpecializations.map((specialization) => specialization.id);
}

export function getCreativeSpecialization(
  id: string,
): CreativeGenerationSpecialization | null {
  return creativeSpecializations.find((specialization) => specialization.id === id) ?? null;
}

export function inferCreativeSpecializationIdFromConfig(config: {
  inputKinds?: string[];
  outputTargets?: string[];
}): string | null {
  const specialization = creativeSpecializations.find((candidate) =>
    candidate.outputTargets.some((outputTarget) => config.outputTargets?.includes(outputTarget)) &&
    candidate.inputKinds.every((inputKind) => config.inputKinds?.includes(inputKind)),
  );

  return specialization?.id ?? null;
}
