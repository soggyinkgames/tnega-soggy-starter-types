import type { WidgetKey } from "../widgets/types"

export type BossWidgetKey = WidgetKey

export type BossState = {
  activeWidget: BossWidgetKey
  loading: boolean
}

export type UseBossReturn = BossState & {
  setActiveWidget: (key: BossWidgetKey) => void
  handleRunAgent: () => Promise<void>
}
