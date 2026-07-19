import type { WordChallengeTask, WordChallengeWord } from '@/types/wordChallenge'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const WORD_CHALLENGE_STAGE_COUNT = 5

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Word challenge API failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function fetchWordChallengeTasks(token: string, params: { date?: string } = {}) {
  return requestJson<{ tasks: WordChallengeTask[] }>(`/word-challenge/tasks${buildQuery(params)}`, token)
}

export function createWordChallengeTask(
  token: string,
  payload: {
    taskDate: string
    title: string
    words: WordChallengeWord[]
  },
) {
  return requestJson<{ ok: true; task: WordChallengeTask }>('/word-challenge/tasks', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateWordChallengeTask(
  token: string,
  taskId: number,
  payload: {
    taskDate: string
    title: string
    words: WordChallengeWord[]
  },
) {
  return requestJson<{ ok: true; task: WordChallengeTask }>(`/word-challenge/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteWordChallengeTask(token: string, taskId: number) {
  return requestJson<{ ok: true }>(`/word-challenge/tasks/${taskId}`, token, {
    method: 'DELETE',
  })
}

export function completeWordChallengeTask(token: string, taskId: number) {
  return requestJson<{
    ok: true
    alreadyCompleted: boolean
    pointRecordId: number
    awardedStars?: number
    bonusStars?: number
    bonusPointRecordId?: number | null
    totalAwardedStars?: number
    streakDays?: number
    streakMilestone?: number | null
    isTodayTask?: boolean
  }>(
    `/word-challenge/tasks/${taskId}/complete`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ completedStages: WORD_CHALLENGE_STAGE_COUNT }),
    },
  )
}
