import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CardItem, ReviewResult } from "./types"

type UseSpacedRepetitionOptions = {
  cards: CardItem[]
  onComplete?: (result: ReviewResult) => void
}

export function useSpacedRepetition({ cards, onComplete }: UseSpacedRepetitionOptions) {
  const [queue, setQueue] = useState<CardItem[]>(() => [...cards])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const finishedRef = useRef(false)

  const total = queue.length

  const currentCard = useMemo(() => {
    if (currentIndex >= queue.length) return undefined
    return queue[currentIndex]
  }, [queue, currentIndex])

  const flip = useCallback(() => setIsFlipped((f) => !f), [])

  const mark = useCallback(
    (isCorrect: boolean) => {
      if (!currentCard) return

      // naive schedule placeholder: push incorrect card to end once
      const nowIso = new Date().toISOString()
      const updated: CardItem = {
        ...currentCard,
        lastReviewed: nowIso,
        interval: Math.max(1, (currentCard.interval ?? 1) * (isCorrect ? 2 : 1)),
      }

      setQueue((prev) => {
        const next = [...prev]
        next[currentIndex] = updated
        if (!isCorrect) {
          next.push(updated)
        }
        return next
      })

      setIsFlipped(false)
      setCurrentIndex((i) => i + 1)
      if (isCorrect) setCorrect((c) => c + 1)
      else setIncorrect((c) => c + 1)
    },
    [currentCard, currentIndex]
  )

  const markCorrect = useCallback(() => mark(true), [mark])
  const markIncorrect = useCallback(() => mark(false), [mark])

  const finished = useMemo(() => currentIndex >= queue.length, [currentIndex, queue.length])

  useEffect(() => {
    if (finished && !finishedRef.current) {
      finishedRef.current = true
      onComplete?.({ correct, total: correct + incorrect })
    }
  }, [finished, onComplete, correct, incorrect])

  const progressText = `${Math.min(currentIndex + 1, Math.max(1, total))} / ${total}`

  return {
    // state
    currentCard,
    currentIndex,
    total,
    isFlipped,
    correct,
    incorrect,
    finished,
    progressText,
    // actions
    flip,
    markCorrect,
    markIncorrect,
  }
}

