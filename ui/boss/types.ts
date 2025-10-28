export type BossWidgetKey = "spaced-repetition-cards" | string

export type BossState = {
  activeWidget: BossWidgetKey
  loading: boolean
}

export type UseBossReturn = BossState & {
  setActiveWidget: (key: BossWidgetKey) => void
  handleRunAgent: () => Promise<void>
}

