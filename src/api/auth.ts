import type { AuthResponse, AuthUser } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Auth API failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function registerAccount(username: string, password: string) {
  return requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function loginAccount(username: string, password: string) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function fetchCurrentUser(token: string) {
  return requestJson<AuthUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateCurrentUser(token: string, username: string) {
  return requestJson<AuthResponse>('/auth/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  })
}
