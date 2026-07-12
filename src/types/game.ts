export type GameId =
  | 'chimp-test'
  | 'number-memory'
  | 'sequential-memory'
  | 'visual-memory'
  | 'shape-memory'
  | 'n-back'

export type GameStatus =
  | 'intro'
  | 'ready'
  | 'showing'
  | 'input'
  | 'success'
  | 'failed'
  | 'result'

export type GameConfig = {
  id: GameId
  name: string
  shortName: string
  route: string
  description: string
  abilityTags: string[]
  defaultStartLevel: number
  minStartLevel: number
  maxStartLevel: number
  startLabel: string
  bestScoreLabel: string
}

export type BestScore = {
  gameId: GameId
  bestLevel: number
  bestScore: number
  bestAccuracy?: number
  updatedAt: number
}

export type BestScoreMap = Partial<Record<GameId, BestScore>>

export type GameResult = {
  gameId: GameId
  title: string
  bestLevel: number
  score: number
  accuracy?: number
  detail?: string
  answer?: string
  userAnswer?: string
  isNewBest: boolean
}
