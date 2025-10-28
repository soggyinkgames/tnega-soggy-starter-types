import React, { Suspense, useMemo } from "react"
import { motion } from "framer-motion"
import { Settings, Sparkles } from "lucide-react"
import { useBoss } from "./useBoss"
import type { BossWidgetKey } from "./types"
import "./styles.css"

// Demo data to feed the default widget
const demoCards = [
  { id: "1", front: "What is prototyping for?", back: "To answer design questions." },
  { id: "2", front: "Define ideation phase.", back: "Setting creative direction." },
  { id: "3", front: "Core loop of SR?", back: "Prompt → Recall → Feedback → Schedule" },
]

export default function Boss() {
  const { activeWidget, setActiveWidget, loading, handleRunAgent } = useBoss(
    "spaced-repetition-cards" satisfies BossWidgetKey
  )

  const DynamicWidget = useMemo(() => {
    // Dynamic mount of active widget; default export required
    // Vite/Webpack hint: allow variable path
    // @ts-ignore - bundlers may need magic comments to allow dynamic path
    const loader = () => import(/* @vite-ignore */ `../widgets/${activeWidget}`)
    return React.lazy(loader)
  }, [activeWidget])

  // Props routing by widget key; future widgets can be added here
  const widgetProps = useMemo(() => {
    if (activeWidget === "spaced-repetition-cards") {
      return {
        title: "your notes",
        cards: demoCards,
        onReviewComplete: (r: { correct: number; total: number }) => {
          console.log("Review complete:", r)
        },
      }
    }
    return {}
  }, [activeWidget]) as any

  return (
    <div className="h-screen w-full flex flex-col boss-bg text-white relative overflow-hidden">
      <header className="p-4 flex justify-between items-center text-sm text-neutral-300/90">
        <h1 className="font-semibold text-lg tracking-wide">Soggy Starters</h1>
        <button
          className="rounded-full bg-neutral-800/70 hover:bg-neutral-800 p-2 border border-neutral-700/70"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xs rounded-2xl shadow-2xl glass-card inner-glow p-4"
        >
          <Suspense
            fallback={
              <div className="w-full h-64 grid place-items-center text-neutral-400">Loading…</div>
            }
          >
            <DynamicWidget {...widgetProps} />
          </Suspense>
        </motion.div>
      </main>

      <footer className="p-4 flex justify-center">
        <button
          onClick={handleRunAgent}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-indigo-600 disabled:bg-indigo-600/60 text-white py-3 px-6 rounded-full font-medium shadow-lg active:scale-[0.98]"
        >
          <Sparkles size={16} /> {loading ? "Working…" : "Run Agent"}
        </button>
      </footer>
    </div>
  )
}

