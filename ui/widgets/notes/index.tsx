import React from "react"
import { motion } from "framer-motion"

type NotesProps = { initialText?: string }

export default function NotesWidget({ initialText = "" }: NotesProps) {
  const [text, setText] = React.useState(initialText)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-md p-4 shadow-2xl">
        <div className="text-sm text-neutral-400 mb-2">Notes</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a quick note…"
          className="w-full h-40 resize-none bg-neutral-900/40 border border-neutral-800 rounded-lg p-3 outline-none focus:border-brand-600 text-neutral-100"
        />
      </div>
    </motion.div>
  )
}

