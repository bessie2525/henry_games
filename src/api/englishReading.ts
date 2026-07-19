import type { EnglishReadingTask, ReadingDictionaryResult, ReadingNotebookWord, ReadingQuestion, ReadingVocabularyWord } from '@/types/englishReading'

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

export function lookupEnglishReadingWord(token: string, word: string) {
  return requestJson<{ ok: true; word: ReadingDictionaryResult }>(`/english-reading/dictionary?word=${encodeURIComponent(word)}`, token)
}

export function fetchReadingNotebookWords(token: string, includeMastered: boolean) {
  return requestJson<{ words: ReadingNotebookWord[] }>(`/english-reading/vocabulary-notebook?includeMastered=${includeMastered ? 'true' : 'false'}`, token)
}

export function saveReadingNotebookWord(token: string, word: Omit<ReadingVocabularyWord, 'id'> & { id?: string | number; source?: string }) {
  return requestJson<{ ok: true; word: ReadingNotebookWord }>('/english-reading/vocabulary-notebook', token, {
    method: 'POST',
    body: JSON.stringify(word),
  })
}

export function updateReadingNotebookWordMastery(token: string, wordId: number, mastered: boolean) {
  return requestJson<{ ok: true; word: ReadingNotebookWord }>(`/english-reading/vocabulary-notebook/${wordId}/mastered`, token, {
    method: 'PATCH',
    body: JSON.stringify({ mastered }),
  })
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
