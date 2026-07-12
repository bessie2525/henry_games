import type { BestScore, BestScoreMap, GameId } from '@/types/game'

export const STORAGE_KEY = 'cognitive-games-best-scores'

export function readBestScores(): BestScoreMap {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    return rawValue ? (JSON.parse(rawValue) as BestScoreMap) : {}
  } catch {
    return {}
  }
}

export function writeBestScores(scores: BestScoreMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

export function isBetterScore(current: BestScore | undefined, candidate: BestScore) {
  if (!current) {
    return true
  }

  return candidate.bestLevel > current.bestLevel
}

export function formatBestScore(gameId: GameId, score?: BestScore) {
  if (!score) {
    return '暂无记录'
  }

  if (score.bestLevel <= 0 && score.bestScore <= 0) {
    return '暂无闯关记录'
  }

  if (gameId === 'number-memory') {
    return `${score.bestScore} 位`
  }

  if (gameId === 'sequential-memory') {
    return `${score.bestScore} 步`
  }

  if (gameId === 'shape-memory') {
    return `第 ${score.bestLevel} 关`
  }

  if (gameId === 'n-back') {
    return `第 ${score.bestLevel} 关`
  }

  return `第 ${score.bestLevel} 关`
}
