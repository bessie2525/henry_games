export type AuthUser = {
  id: number
  username: string
  role: 'student' | 'admin'
}

export type AuthResponse = {
  ok: true
  user: AuthUser
  token: string
}
