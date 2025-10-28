import React from "react"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"

export default function AnalyticsWidget() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-md p-4 shadow-2xl">
        <div className="flex items-center gap-2 text-sm text-neutral-300 mb-2">
          <Activity size={16} /> Analytics
        </div>
        <div className="text-neutral-400 text-sm">Coming soon — performance insights and trends.</div>
      </div>
    </motion.div>
  )
}

