import type { BestScore, BestScoreMap, GameId } from '@/types/game'
import { isBetterScore } from '@/utils/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

type ChallengeLeaderboardRow = {
  userId?: number | null
  username: string
  gameType: GameId
  maxLevel: number
  updatedAt: string
}

type FixedLeaderboardRow = {
  userId?: number | null
  username: string
  gameType: GameId
  difficulty: number
  questionCount: number
  bestAccuracy: number
  correctCount: number
  totalCount: number
  updatedAt: string
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Leaderboard API failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function challengeRowToBestScore(row: ChallengeLeaderboardRow): BestScore {
  return {
    gameId: row.gameType,
    username: row.username,
    bestLevel: row.maxLevel,
    bestScore: row.maxLevel,
    updatedAt: new Date(row.updatedAt).getTime() || Date.now(),
  }
}

function mergeChallengeScores(scores: BestScoreMap, rows: ChallengeLeaderboardRow[]) {
  const nextScores = { ...scores }

  for (const row of rows) {
    const candidate = challengeRowToBestScore(row)
    const current = nextScores[row.gameType]

    if (isBetterScore(current, candidate)) {
      nextScores[row.gameType] = {
        ...current,
        ...candidate,
        practiceBestAccuracyByQuestionCount: current?.practiceBestAccuracyByQuestionCount,
      }
    }
  }

  return nextScores
}

function mergeFixedScores(scores: BestScoreMap, rows: FixedLeaderboardRow[]) {
  const nextScores = { ...scores }

  for (const row of rows) {
    const current = nextScores[row.gameType]
    const currentByQuestionCount = current?.practiceBestAccuracyByQuestionCount ?? {}
    const currentByLevel = currentByQuestionCount[row.questionCount] ?? {}
    const currentAccuracy = currentByLevel[row.difficulty] ?? 0

    if (row.bestAccuracy <= currentAccuracy) {
      continue
    }

    nextScores[row.gameType] = {
      gameId: row.gameType,
      username: row.username,
      bestLevel: current?.bestLevel ?? 0,
      bestScore: current?.bestScore ?? 0,
      bestAccuracy: current?.bestAccuracy,
      practiceBestAccuracyByLevel: current?.practiceBestAccuracyByLevel,
      practiceBestAccuracyByQuestionCount: {
        ...currentByQuestionCount,
        [row.questionCount]: {
          ...currentByLevel,
          [row.difficulty]: row.bestAccuracy,
        },
      },
      updatedAt: new Date(row.updatedAt).getTime() || Date.now(),
    }
  }

  return nextScores
}

export async function fetchLeaderboardScores() {
  const [challengeRows, fixedRows] = await Promise.all([
    requestJson<ChallengeLeaderboardRow[]>('/leaderboard/challenge'),
    requestJson<FixedLeaderboardRow[]>('/leaderboard/fixed'),
  ])

  return mergeFixedScores(mergeChallengeScores({}, challengeRows), fixedRows)
}

export function submitChallengeScore(candidate: BestScore, token?: string) {
  return requestJson<{ ok: true }>('/leaderboard/challenge', {
    method: 'POST',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: JSON.stringify({
      gameType: candidate.gameId,
      maxLevel: candidate.bestLevel,
    }),
  })
}

export function submitFixedAccuracy(gameId: GameId, difficulty: number, questionCount: number, accuracy: number, token?: string) {
  const normalizedAccuracy = Math.max(0, Math.min(100, accuracy))
  const correctCount = Math.round((normalizedAccuracy / 100) * questionCount)

  return requestJson<{ ok: true }>('/leaderboard/fixed', {
    method: 'POST',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: JSON.stringify({
      gameType: gameId,
      difficulty,
      questionCount,
      accuracy: normalizedAccuracy,
      correctCount,
      totalCount: questionCount,
    }),
  })
}
