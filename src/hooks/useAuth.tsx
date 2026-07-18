import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchCurrentUser, loginAccount, registerAccount, updateCurrentUser } from '@/api/auth'
import type { AuthUser } from '@/types/auth'

const AUTH_TOKEN_KEY = 'cognitive-games-auth-token'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  updateUsername: (username: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(AUTH_TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    fetchCurrentUser(token)
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
        }
      })
      .catch(() => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY)
        if (isMounted) {
          setUser(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const persistSession = useCallback((nextUser: AuthUser, nextToken: string) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    setUser(nextUser)
    setToken(nextToken)
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await loginAccount(username, password)
      persistSession(response.user, response.token)
    },
    [persistSession],
  )

  const register = useCallback(
    async (username: string, password: string) => {
      const response = await registerAccount(username, password)
      persistSession(response.user, response.token)
    },
    [persistSession],
  )

  const updateUsername = useCallback(
    async (username: string) => {
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await updateCurrentUser(token, username)
      persistSession(response.user, response.token)
    },
    [persistSession, token],
  )

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      updateUsername,
      logout,
    }),
    [isLoading, login, logout, register, token, updateUsername, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
