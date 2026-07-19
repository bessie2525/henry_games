import type { EnglishReadingTask, ReadingQuestion, ReadingVocabularyWord } from '@/types/englishReading'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export type EnglishReadingTaskPayload = {
  taskDate: string
  title: string
  level: string
  wordCount?: number
  summary: string
  vocabulary: ReadingVocabularyWord[]
  paragraphs: string[]
  questions: ReadingQuestion[]
}

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
    throw new Error(body?.error || `English reading API failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function fetchEnglishReadingTasks(token: string) {
  return requestJson<{ tasks: EnglishReadingTask[] }>('/english-reading/tasks', token)
}

export function createEnglishReadingTask(token: string, payload: EnglishReadingTaskPayload) {
  return requestJson<{ ok: true; task: EnglishReadingTask }>('/english-reading/tasks', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEnglishReadingTask(token: string, taskId: number, payload: EnglishReadingTaskPayload) {
  return requestJson<{ ok: true; task: EnglishReadingTask }>(`/english-reading/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteEnglishReadingTask(token: string, taskId: number) {
  return requestJson<{ ok: true }>(`/english-reading/tasks/${taskId}`, token, {
    method: 'DELETE',
  })
}

export function completeEnglishReadingTask(token: string, taskId: number) {
  return requestJson<{ ok: true; alreadyCompleted: boolean; pointRecordId: number; awardedStars?: number }>(
    `/english-reading/tasks/${taskId}/complete`,
    token,
    { method: 'POST' },
  )
}
