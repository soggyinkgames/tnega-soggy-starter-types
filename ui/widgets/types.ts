import type { ComponentType } from "react"

export type WidgetKey =
  | "spaced-repetition-cards"
  | "notes"
  | "analytics"

export interface WidgetPropsBase {
  onAction?: (type: string, payload?: any) => void
  theme?: "dark" | "light"
  agent?: any
}

export interface WidgetContract<P = any> {
  key: WidgetKey
  title: string
  loader: () => Promise<{ default: ComponentType<P> }>
  getProps?: (ctx: any) => P
}

