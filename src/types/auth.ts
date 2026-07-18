export type AuthUser = {
  id: number
  username: string
  role: 'user' | 'admin'
}

export type AuthResponse = {
  ok: true
  user: AuthUser
  token: string
}
