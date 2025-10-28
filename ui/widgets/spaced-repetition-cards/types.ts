export type CardItem = {
  id?: string
  front: string
  back: string
  interval?: number
  lastReviewed?: string
}

export type ReviewResult = {
  correct: number
  total: number
}

export type SpacedRepetitionCardsProps = {
  title?: string
  cards: CardItem[]
  onReviewComplete?: (result: ReviewResult) => void
}

