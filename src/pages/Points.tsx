import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BookOpen, LogIn, Pencil, Save, Settings, Sparkles, Star, UserPlus } from 'lucide-react'
import { createPointRecord, fetchPointRecords, fetchPointStudents, fetchPointSummary, updatePointRecord } from '@/api/points'
import AuthModal from '@/components/AuthModal'
import { pointCategories, pointCategoryMap } from '@/data/pointCategories'
import { useAuth } from '@/hooks/useAuth'
import type { PointCategoryId, PointRecord, PointSummary, StudentOption } from '@/types/points'

type AuthMode = 'login' | 'register' | 'account'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function createEmptySummary(): PointSummary {
  return {
    dailySummaries: [],
    totalStars: 0,
  }
}

function categoryName(category: PointCategoryId) {
  return pointCategoryMap[category]?.name ?? category
}

function parseStars(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null
}

export default function Points() {
  const { user, token, isLoading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [recordDate, setRecordDate] = useState(todayString())
  const [category, setCategory] = useState<PointCategoryId>('math')
  const [starsInput, setStarsInput] = useState('1')
  const [detail, setDetail] = useState('')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<PointRecord[]>([])
  const [summary, setSummary] = useState<PointSummary>(createEmptySummary)
  const [editingRecord, setEditingRecord] = useState<PointRecord | null>(null)
  const [editingStarsInput, setEditingStarsInput] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAdmin = user?.role === 'admin'

  const activeCategory = pointCategoryMap[category]
  const queryStudentId = isAdmin && selectedStudentId !== '' ? Number(selectedStudentId) : null

  const refreshData = useCallback(async () => {
    if (!token || !user) {
      return
    }

    const params = {
      studentUserId: queryStudentId,
      limit: 200,
    }
    const [recordsResponse, summaryResponse] = await Promise.all([
      fetchPointRecords(token, params),
      fetchPointSummary(token, { studentUserId: queryStudentId }),
    ])

    setRecords(recordsResponse.records)
    setSummary(summaryResponse)
  }, [queryStudentId, token, user])

  useEffect(() => {
    if (!token || !user || !isAdmin) {
      return
    }

    fetchPointStudents(token)
      .then(setStudents)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : '学生列表加载失败'))
  }, [isAdmin, token, user])

  useEffect(() => {
    refreshData().catch((loadError) => setError(loadError instanceof Error ? loadError.message : '积分记录加载失败'))
  }, [refreshData])

  const dailySummaries = summary.dailySummaries
  const latestSummary = dailySummaries[0]

  const groupedRecords = useMemo(() => {
    const groups = new Map<string, PointRecord[]>()
    for (const record of records) {
      if (!groups.has(record.recordDate)) {
        groups.set(record.recordDate, [])
      }
      groups.get(record.recordDate)?.push(record)
    }

    return Array.from(groups.entries())
  }, [records])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token || !user) {
      setError('请先登录')
      return
    }

    if (category === 'other' && !detail.trim()) {
      setError('选择“其他”时需要填写具体内容')
      return
    }

    if (isAdmin && selectedStudentId === '') {
      setError('管理员补录时需要先选择学生')
      return
    }

    const parsedStars = parseStars(starsInput)
    if (parsedStars === null) {
      setError('星星数需要填写 0-100 的整数')
      return
    }

    try {
      setIsSubmitting(true)
      await createPointRecord(token, {
        studentUserId: isAdmin ? Number(selectedStudentId) : undefined,
        recordDate,
        category,
        stars: parsedStars,
        detail,
        note,
      })
      setMessage('积分已提交')
      setDetail('')
      setNote('')
      await refreshData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '积分提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token || !editingRecord) {
      return
    }

    if (editingRecord.category === 'other' && !editingRecord.detail.trim()) {
      setError('选择“其他”时需要填写具体内容')
      return
    }

    const parsedStars = parseStars(editingStarsInput)
    if (parsedStars === null) {
      setError('星星数需要填写 0-100 的整数')
      return
    }

    try {
      setIsSubmitting(true)
      await updatePointRecord(token, editingRecord.id, {
        category: editingRecord.category,
        stars: parsedStars,
        detail: editingRecord.detail,
        note: editingRecord.note,
      })
      setMessage('积分记录已更新')
      setEditingRecord(null)
      setEditingStarsInput('')
      await refreshData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '积分记录更新失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.28),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(16,185,129,0.16),transparent_26%),#fff7ed] px-4 py-6">
        <div className="mx-auto max-w-5xl rounded-[30px] border border-amber-100 bg-white/85 p-5 font-bold text-amber-800 shadow-sm shadow-amber-100">
          正在加载积分系统...
        </div>
      </main>
    )
  }

  if (!user || !token) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.3),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(16,185,129,0.16),transparent_26%),#fff7ed] px-4 py-6 md:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <nav className="flex flex-col gap-3 rounded-[30px] border border-amber-100 bg-white/80 p-4 shadow-sm shadow-amber-100/80 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-amber-500 text-white">
                <Star size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Student Points</p>
                <h1 className="text-xl font-black tracking-tight text-slate-950">学生积分系统</h1>
              </div>
            </div>
            <Link className="btn-secondary justify-center" to="/">
              <Activity size={17} />
              认知训练小游戏
            </Link>
          </nav>

          <section className="overflow-hidden rounded-[38px] border border-amber-100 bg-white/90 p-6 text-center shadow-sm shadow-amber-100/80 backdrop-blur sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-700">
              <Star size={30} />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-amber-600">Daily Stars</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">每日积分单独记录，和小游戏训练分开管理。</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              登录后可以登记每日星星，查看每天每个项目的明细、每日总数和累计总数。管理员可以选择学生并编辑积分记录。
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button className="btn-primary bg-amber-600 shadow-amber-200 hover:bg-amber-700" type="button" onClick={() => setAuthMode('login')}>
                <LogIn size={18} />
                登录积分系统
              </button>
              <button className="btn-secondary justify-center" type="button" onClick={() => setAuthMode('register')}>
                <UserPlus size={18} />
                注册学生账户
              </button>
            </div>
          </section>
        </div>

        {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} /> : null}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.28),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(16,185,129,0.16),transparent_26%),#fff7ed] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-col gap-3 rounded-[30px] border border-amber-100 bg-white/80 p-4 shadow-sm shadow-amber-100/80 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-500 text-white">
              <Star size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Student Points</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">学生积分系统</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                当前账户：{user.username} · {isAdmin ? '管理员' : '学生'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary justify-center" type="button" onClick={() => setAuthMode('account')}>
              <Settings size={17} />
              账户设置
            </button>
            <Link className="btn-secondary justify-center" to="/word-challenge">
              <BookOpen size={17} />
              英语单词闯关
            </Link>
            <Link className="btn-secondary justify-center" to="/">
              <Activity size={17} />
              认知训练小游戏
            </Link>
          </div>
        </nav>

        {error ? <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}
        {message ? <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <form className="panel space-y-4" onSubmit={handleCreate}>
            <div>
              <p className="eyebrow">{isAdmin ? 'Add Record' : 'Today Record'}</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{isAdmin ? '管理员补录积分' : '登记每日积分'}</h2>
            </div>

            {isAdmin ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-600">学生</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value ? Number(event.target.value) : '')}
                >
                  <option value="">选择学生</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.username}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">日期</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  type="date"
                  value={recordDate}
                  onChange={(event) => setRecordDate(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-600">积分项目</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as PointCategoryId)}
                >
                  {pointCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-3xl bg-cyan-50 px-4 py-3">
              <p className="text-sm font-black text-cyan-900">{activeCategory.name}</p>
              <p className="mt-1 text-sm leading-6 text-cyan-800">{activeCategory.description}</p>
              <p className="mt-1 text-xs font-bold text-cyan-600">{activeCategory.suggestedRange}</p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-600">星星数</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                inputMode="numeric"
                pattern="[0-9]*"
                type="text"
                value={starsInput}
                onChange={(event) => setStarsInput(event.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </label>

            {category === 'other' ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-600">其他具体内容</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="填写具体做了什么"
                  maxLength={100}
                />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm font-bold text-slate-600">具体内容，可选</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="例如：背诵 10 个单词、洗碗"
                  maxLength={100}
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-bold text-slate-600">备注，可选</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="读后感、作文题目或其他说明"
                maxLength={500}
              />
            </label>

            <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
              <Sparkles size={18} />
              {isSubmitting ? '提交中...' : '提交积分'}
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[30px] border border-amber-100 bg-amber-50/80 p-5 shadow-sm shadow-amber-100">
              <p className="eyebrow text-amber-600">Total Stars</p>
              <p className="mt-2 text-5xl font-black text-amber-600">{summary.totalStars}</p>
              <p className="mt-1 text-sm font-bold text-amber-800">累计到现在的星星总数</p>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-sm shadow-slate-200/70">
              <p className="eyebrow">Latest Day</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{latestSummary?.recordDate ?? '暂无记录'}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pointCategories.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-slate-500">{item.name}</p>
                    <p className="text-lg font-black text-slate-950">{latestSummary?.byCategory[item.id] ?? 0}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                当日总计：{latestSummary?.totalStars ?? 0} 颗星
              </p>
            </div>
          </aside>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">History</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">历史积分记录</h2>
            </div>
            {isAdmin && selectedStudentId === '' ? (
              <p className="text-xs font-bold text-slate-400">当前显示全部学生记录</p>
            ) : null}
          </div>

          <div className="mt-5 space-y-5">
            {groupedRecords.length === 0 ? (
              <p className="rounded-3xl bg-slate-50 px-5 py-6 text-center text-sm font-bold text-slate-500">暂无积分记录</p>
            ) : null}

            {groupedRecords.map(([date, dateRecords]) => (
              <div key={date} className="rounded-[26px] border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-slate-950">{date}</h3>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                    总计 {dateRecords.reduce((sum, item) => sum + item.stars, 0)} 颗星
                  </p>
                </div>
                <div className="mt-3 grid gap-3">
                  {dateRecords.map((record) => (
                    <div key={record.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-slate-200/60">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {categoryName(record.category)} · {record.stars} 颗星
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            学生：{record.studentUsername} · 创建：{record.createdAt}
                          </p>
                          {record.detail ? <p className="mt-2 text-sm font-semibold text-slate-600">内容：{record.detail}</p> : null}
                          {record.note ? <p className="mt-1 text-sm font-semibold text-slate-600">备注：{record.note}</p> : null}
                        </div>
                        {isAdmin ? (
                          <button
                            className="btn-secondary min-h-0 px-3 py-2 text-xs"
                            type="button"
                            onClick={() => {
                              setEditingRecord(record)
                              setEditingStarsInput(String(record.stars))
                            }}
                          >
                            <Pencil size={14} />
                            编辑
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editingRecord ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <form className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-2xl shadow-slate-900/20" onSubmit={handleUpdate}>
            <p className="eyebrow">Admin Edit</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">编辑积分记录</h2>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-600">项目</span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={editingRecord.category}
                onChange={(event) => setEditingRecord({ ...editingRecord, category: event.target.value as PointCategoryId })}
              >
                {pointCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-600">星星数</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                inputMode="numeric"
                pattern="[0-9]*"
                type="text"
                value={editingStarsInput}
                onChange={(event) => setEditingStarsInput(event.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-600">具体内容</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={editingRecord.detail}
                onChange={(event) => setEditingRecord({ ...editingRecord, detail: event.target.value })}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-600">备注</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                value={editingRecord.note}
                onChange={(event) => setEditingRecord({ ...editingRecord, note: event.target.value })}
              />
            </label>

            <div className="mt-5 flex gap-3">
              <button className="btn-primary flex-1" type="submit" disabled={isSubmitting}>
                <Save size={18} />
                保存
              </button>
              <button
                className="btn-secondary flex-1 justify-center"
                type="button"
                onClick={() => {
                  setEditingRecord(null)
                  setEditingStarsInput('')
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} /> : null}
    </main>
  )
}
