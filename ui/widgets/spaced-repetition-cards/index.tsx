import React from "react"
import { Check, X, RotateCcw } from "lucide-react"
import { FlipCard } from "./Card"
import { useSpacedRepetition } from "./useSpacedRepetition"
import type { CardItem, SpacedRepetitionCardsProps } from "./types"
import "./styles.css"

function EmptyState() {
  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-300">
        <p>No cards to review.</p>
      </div>
    </div>
  )
}

export default function SpacedRepetitionCards({ title = "Spaced Repetition", cards, onReviewComplete, }: SpacedRepetitionCardsProps) {
  if (!cards || cards.length === 0) return <EmptyState />

  const { currentCard, isFlipped, flip, markCorrect, markIncorrect, currentIndex, total, correct, incorrect, finished, progressText, } = useSpacedRepetition({ cards, onComplete: onReviewComplete })

  if (finished) {
    return (
      <div className="w-full max-w-sm mx-auto p-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-100">
          <div className="mb-3 text-sm uppercase tracking-wide text-gray-400">{title}</div>
          <h3 className="text-lg font-semibold">Review Complete</h3>
          <p className="mt-2 text-gray-300">Correct: <span className="text-emerald-400 font-medium">{correct}</span> · Incorrect: <span className="text-rose-400 font-medium">{incorrect}</span> · Total: <span className="font-medium">{correct + incorrect}</span></p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <RotateCcw size={14} />
            <span>Refresh the page or re-enter to retry.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm uppercase tracking-wide text-gray-400">{title}</div>
        <div className="text-sm text-gray-400">{progressText}</div>
      </div>

      {currentCard && (
        <FlipCard
          front={<CardFaceFront item={currentCard} index={currentIndex} total={total} />}
          back={<CardFaceBack item={currentCard} />}
          isFlipped={isFlipped}
          onToggle={flip}
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={markIncorrect}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-700/50 bg-rose-900/20 px-4 py-3 text-rose-200 hover:bg-rose-900/30 active:scale-[0.98]"
          aria-label="Mark incorrect"
        >
          <X size={18} />
          <span className="font-medium">Incorrect</span>
        </button>
        <button
          type="button"
          onClick={markCorrect}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-4 py-3 text-emerald-200 hover:bg-emerald-900/30 active:scale-[0.98]"
          aria-label="Mark correct"
        >
          <Check size={18} />
          <span className="font-medium">Correct</span>
        </button>
      </div>
    </div>
  )
}

function CardFaceFront({ item }: { item: CardItem; index: number; total: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-[85%]">
        <div className="text-xs mb-1 text-gray-400 text-center">Tap to flip</div>
        <div className="text-xl font-semibold leading-snug text-center">{item.front}</div>
      </div>
    </div>
  )
}

function CardFaceBack({ item }: { item: CardItem }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-[85%]">
        <div className="text-xs mb-1 text-gray-400 text-center">Answer</div>
        <div className="text-xl font-semibold leading-snug text-center">{item.back}</div>
      </div>
    </div>
  )
}

export type { CardItem }
export { useSpacedRepetition }

