import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Settings, Star, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from './AuthModal'

type AuthMode = 'login' | 'register' | 'account'

function formatRole(role: string) {
  return role === 'admin' ? '管理员' : '学生'
}

export default function AccountMenu() {
  const { user, isLoading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {user ? (
          <>
            <Link className="btn-primary" to="/points">
              <Star size={17} />
              积分系统
            </Link>
            <button className="btn-secondary justify-center" type="button" onClick={() => setAuthMode('account')}>
              <Settings size={17} />
              {user.username}
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] text-cyan-700">{formatRole(user.role)}</span>
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary justify-center" type="button" onClick={() => setAuthMode('login')} disabled={isLoading}>
              <LogIn size={17} />
              登录
            </button>
            <button className="btn-primary" type="button" onClick={() => setAuthMode('register')} disabled={isLoading}>
              <UserPlus size={17} />
              注册
            </button>
          </>
        )}
      </div>

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} /> : null}
    </>
  )
}
