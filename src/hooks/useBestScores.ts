import { useCallback, useEffect, useState } from 'react'
import type { BestScore, BestScoreMap } from '@/types/game'
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

  return {
    bestScores,
    saveBestScore,
  }
}
