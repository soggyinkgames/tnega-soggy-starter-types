import { useCallback, useState } from "react"
import type { BossWidgetKey, UseBossReturn } from "./types"

export function useBoss(initialWidget: BossWidgetKey = "spaced-repetition-cards"): UseBossReturn {
  const [activeWidget, setActiveWidget] = useState<BossWidgetKey>(initialWidget)
  const [loading, setLoading] = useState(false)

  const handleRunAgent = useCallback(async () => {
    setLoading(true)
    try {
      // Mock async operation (e.g., generating cards or running an agent)
      await new Promise((res) => setTimeout(res, 900))
    } finally {
      setLoading(false)
    }
  }, [])

  return { activeWidget, setActiveWidget, loading, handleRunAgent }
}

