export type NBackResponse = 'match' | 'non-match' | null

export type NBackTrial = {
  index: number
  position: number
  isMatch: boolean
  response: NBackResponse
  isScored: boolean
  isCorrect?: boolean
  reactionTime?: number
}

export type NBackLevelConfig = {
  nLevel: number
  roundCount: number
  stimulusDuration: number
  intervalDuration: number
  matchRate: number
}

export type NBackResult = {
  level: number
  nLevel: number
  score: number
  accuracy: number
  hitRate: number
  falseAlarmRate: number
  missCount: number
  noResponseCount: number
  nonMatchNoResponseCount: number
  correctCount: number
  validRoundCount: number
}
