import React from "react"
import { motion } from "framer-motion"

type FlipCardProps = {
  front: React.ReactNode
  back: React.ReactNode
  isFlipped: boolean
  onToggle?: () => void
}

export function FlipCard({ front, back, isFlipped, onToggle }: FlipCardProps) {
  return (
    <div className="srp-perspective w-full">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle?.()
          }
        }}
        className="relative srp-preserve-3d w-full h-56 sm:h-64 rounded-xl overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 srp-backface-hidden srp-face-front flex items-center justify-center bg-gray-800 text-gray-100 p-4 text-center text-lg sm:text-xl">
          {front}
        </div>
        <div className="absolute inset-0 srp-backface-hidden srp-face-back flex items-center justify-center bg-gray-900 text-gray-100 p-4 text-center text-lg sm:text-xl">
          {back}
        </div>
      </motion.div>
    </div>
  )
}

