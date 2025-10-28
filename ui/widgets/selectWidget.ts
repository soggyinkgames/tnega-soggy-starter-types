import type { WidgetKey } from "./types"

// Minimal policy: prefer explicit preference; otherwise fall back by capability
export function selectWidget(ctx: any): WidgetKey {
  if (ctx?.preferredWidget) return ctx.preferredWidget as WidgetKey

  const caps: string[] = ctx?.capabilities || []
  if (caps.includes("study")) return "spaced-repetition-cards"
  if (caps.includes("notes")) return "notes"
  if (caps.includes("metrics")) return "analytics"
  return "notes"
}

