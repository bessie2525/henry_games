import { useCallback, useEffect, useState } from 'react'
import type { BestScore, BestScoreMap, GameId } from '@/types/game'
import { isBetterScore, readBestScores, writeBestScores } from '@/utils/storage'

export function useBestScores() {
  const [bestScores, setBestScores] = useState<BestScoreMap>({})

  useEffect(() => {
    setBestScores(readBestScores())
  }, [])

  const saveBestScore = useCallback((candidate: BestScore) => {
    const currentScores = readBestScores()
    const current = currentScores[candidate.gameId]
    const isNewBest = isBetterScore(current, candidate)

    if (isNewBest) {
      const nextScores = {
        ...currentScores,
        [candidate.gameId]: candidate,
      }
      writeBestScores(nextScores)
      setBestScores(nextScores)
    } else {
      setBestScores(currentScores)
    }

    return isNewBest
  }, [])

  const savePracticeAccuracy = useCallback((gameId: GameId, level: number, questionCount: number, accuracy: number) => {
    const currentScores = readBestScores()
    const current = currentScores[gameId]
    const currentScoresByQuestionCount = current?.practiceBestAccuracyByQuestionCount ?? {}
    const currentPracticeScores = currentScoresByQuestionCount[questionCount] ?? {}
    const currentAccuracy = currentPracticeScores[level] ?? 0
    const isNewBest = accuracy > currentAccuracy

    if (isNewBest) {
      const nextScore: BestScore = {
        gameId,
        bestLevel: current?.bestLevel ?? 0,
        bestScore: current?.bestScore ?? 0,
        bestAccuracy: current?.bestAccuracy,
        practiceBestAccuracyByLevel: current?.practiceBestAccuracyByLevel,
        practiceBestAccuracyByQuestionCount: {
          ...currentScoresByQuestionCount,
          [questionCount]: {
            ...currentPracticeScores,
            [level]: accuracy,
          },
        },
        updatedAt: Date.now(),
      }
      const nextScores = {
        ...currentScores,
        [gameId]: nextScore,
      }
      writeBestScores(nextScores)
      setBestScores(nextScores)
    } else {
      setBestScores(currentScores)
    }

    return isNewBest
  }, [])

  return {
    bestScores,
    saveBestScore,
    savePracticeAccuracy,
  }
}
