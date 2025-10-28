import type { WidgetContract, WidgetKey } from "./types"
import type { ComponentType } from "react"

// Vite will generate lazy import functions for each widget index
const modules = import.meta.glob("./*/index.tsx") as Record<
  string,
  () => Promise<{ default: ComponentType<any> }>
>

const contracts: Record<WidgetKey, WidgetContract<any>> = {
  "spaced-repetition-cards": {
    key: "spaced-repetition-cards",
    title: "Spaced Repetition",
    loader: () => modules["./spaced-repetition-cards/index.tsx"]!(),
    getProps: (ctx: any) =>
      ctx?.spacedRepetitionProps ?? {
        title: "Your Notes",
        cards: (
          ctx?.cards ?? [
            { id: "1", front: "What is prototyping for?", back: "To answer design questions." },
            { id: "2", front: "Define ideation phase.", back: "Setting creative direction." },
          ]
        ),
        onReviewComplete: ctx?.onReviewComplete,
      },
  },
  notes: {
    key: "notes",
    title: "Notes",
    loader: () => modules["./notes/index.tsx"]!(),
    getProps: (ctx: any) => ({ initialText: ctx?.notesText ?? "Tap to write a note…" }),
  },
  analytics: {
    key: "analytics",
    title: "Analytics",
    loader: () => modules["./analytics/index.tsx"]!(),
  },
}

export function getWidget(key: WidgetKey): WidgetContract<any> {
  const w = contracts[key]
  if (!w) throw new Error(`Unknown widget: ${key}`)
  return w
}

export function listWidgets(): WidgetContract<any>[] {
  return Object.values(contracts)
}
