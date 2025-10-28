import React from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={clsx(
      "rounded-2xl bg-neutral-900/70 border border-neutral-800 shadow-2xl backdrop-blur-md p-4",
      className
    )}
  >
    {children}
  </motion.div>
)

