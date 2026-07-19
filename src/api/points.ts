import type { PointCategoryId, PointRecord, PointSummary, StudentOption } from '@/types/points'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
    throw new Error(body?.error || `Points API failed: ${response.status}`)
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

export function fetchPointStudents(token: string) {
  return requestJson<StudentOption[]>('/points/students', token)
}

export function fetchPointRecords(
  token: string,
  params: {
    studentUserId?: number | null
    from?: string
    to?: string
    limit?: number
  } = {},
) {
  return requestJson<{ records: PointRecord[] }>(`/points/records${buildQuery(params)}`, token)
}

export function fetchPointSummary(
  token: string,
  params: {
    studentUserId?: number | null
    from?: string
    to?: string
  } = {},
) {
  return requestJson<PointSummary>(`/points/summary${buildQuery(params)}`, token)
}

export function createPointRecord(
  token: string,
  payload: {
    studentUserId?: number | null
    recordDate: string
    category: PointCategoryId
    stars: number
    detail: string
    note: string
  },
) {
  return requestJson<{ ok: true; record: PointRecord }>('/points/records', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePointRecord(
  token: string,
  recordId: number,
  payload: {
    category: PointCategoryId
    stars: number
    detail: string
    note: string
  },
) {
  return requestJson<{ ok: true }>(`/points/records/${recordId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
