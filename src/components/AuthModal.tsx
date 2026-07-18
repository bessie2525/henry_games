import { FormEvent, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type AuthModalProps = {
  mode: 'login' | 'register' | 'account'
  onClose: () => void
}

const modeTitle = {
  login: '登录账户',
  register: '注册账户',
  account: '账户设置',
}

export default function AuthModal({ mode, onClose }: AuthModalProps) {
  const { user, login, register, updateUsername, logout } = useAuth()
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setUsername(user?.username ?? '')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }, [mode, user?.username])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      setIsSubmitting(true)

      if (mode === 'login') {
        await login(username, password)
      }

      if (mode === 'register') {
        await register(username, password)
      }

      if (mode === 'account') {
        await updateUsername(username)
      }

      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请稍后再试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Account</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{modeTitle[mode]}</h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            type="button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-600">用户名</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="2-20 个字符"
              autoComplete="username"
            />
          </label>

          {mode !== 'account' ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-600">密码</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          ) : null}

          {mode === 'register' ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-600">确认密码</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                type="password"
                autoComplete="new-password"
              />
            </label>
          ) : null}

          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

          <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '处理中...' : mode === 'account' ? '保存设置' : mode === 'login' ? '登录' : '注册并登录'}
          </button>

          {mode === 'account' ? (
            <button className="btn-secondary w-full justify-center" type="button" onClick={handleLogout}>
              退出登录
            </button>
          ) : null}
        </form>
      </div>
    </div>
  )
}
