import { useCallback, useEffect, useState } from 'react'
import { fetchLeaderboardScores, submitChallengeScore, submitFixedAccuracy } from '@/api/leaderboard'
import type { BestScore, BestScoreMap, GameId } from '@/types/game'
import { isBetterScore, readBestScores, writeBestScores } from '@/utils/storage'
import { useAuth } from './useAuth'

export function useBestScores() {
  const { token, user } = useAuth()
  const [bestScores, setBestScores] = useState<BestScoreMap>({})

  const refreshBestScores = useCallback(async () => {
    const cloudScores = await fetchLeaderboardScores()
    writeBestScores(cloudScores)
    setBestScores(cloudScores)
  }, [])

  useEffect(() => {
    let isMounted = true

    fetchLeaderboardScores()
      .then((cloudScores) => {
        if (!isMounted) {
          return
        }

        writeBestScores(cloudScores)
        setBestScores(cloudScores)
      })
      .catch(() => {
        if (isMounted) {
          setBestScores(readBestScores())
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const saveBestScore = useCallback((candidate: BestScore) => {
    const currentScores = readBestScores()
    const current = currentScores[candidate.gameId]
    const scoreWithUser = {
      ...candidate,
      username: user?.username ?? candidate.username,
    }
    const isNewBest = isBetterScore(current, scoreWithUser)

    if (isNewBest) {
      const nextScores = {
        ...currentScores,
        [candidate.gameId]: scoreWithUser,
      }
      writeBestScores(nextScores)
      setBestScores(nextScores)
    } else {
      setBestScores(currentScores)
    }

    if (token) {
      submitChallengeScore(scoreWithUser, token)
        .then(refreshBestScores)
        .catch(() => {
          setBestScores(readBestScores())
        })
    }

    return isNewBest
  }, [refreshBestScores, token, user?.username])

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
        username: user?.username ?? current?.username,
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

    if (token) {
      submitFixedAccuracy(gameId, level, questionCount, accuracy, token)
        .then(refreshBestScores)
        .catch(() => {
          setBestScores(readBestScores())
        })
    }

    return isNewBest
  }, [refreshBestScores, token, user?.username])

  return {
    bestScores,
    saveBestScore,
    savePracticeAccuracy,
  }
}
