import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil, Plus, RotateCcw, Search, Settings, Star, Trash2, Type, Volume2, XCircle } from 'lucide-react'
import {
  completeEnglishReadingTask,
  createEnglishReadingTask,
  deleteEnglishReadingTask,
  fetchEnglishReadingTasks,
  updateEnglishReadingTask,
  type EnglishReadingTaskPayload,
} from '@/api/englishReading'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import type { EnglishReadingTask, ReadingQuestion, ReadingVocabularyWord } from '@/types/englishReading'

type AuthMode = 'login' | 'register' | 'account'

const notebookStorageKey = 'english-reading-vocabulary'
const defaultVocabularyJson = JSON.stringify(
  [
    { word: 'breeze', phonetic: '/briːz/', meaning: '微风', example: 'A soft breeze moved the curtains.' },
    { word: 'patiently', phonetic: '/ˈpeɪʃəntli/', meaning: '耐心地', example: 'She waited patiently for her turn.' },
  ],
  null,
  2,
)
const defaultQuestionsJson = JSON.stringify(
  [
    {
      id: 'q1',
      prompt: 'Where did the story happen?',
      options: ['In a park', 'In a shop', 'In a kitchen', 'In a car'],
      answer: 'In a park',
      explanation: '原文提到了 park，所以故事发生在公园。',
      paragraphHint: '回到第 1 段找地点。',
    },
  ],
  null,
  2,
)

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function loadNotebook() {
  try {
    const saved = localStorage.getItem(notebookStorageKey)
    if (!saved) {
      return []
    }

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as ReadingVocabularyWord[]) : []
  } catch {
    return []
  }
}

function saveNotebook(words: ReadingVocabularyWord[]) {
  localStorage.setItem(notebookStorageKey, JSON.stringify(words))
}

function parseJsonArray<T>(value: string, label: string): T[] {
  const parsed = JSON.parse(value)
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} 必须是 JSON 数组`)
  }

  return parsed as T[]
}

function speakText(text: string, onError?: (message: string) => void) {
  if (!('speechSynthesis' in window)) {
    onError?.('当前浏览器不支持朗读，请换用 Chrome 或 Safari。')
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.86
  utterance.pitch = 1
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice =
    voices.find((voice) => voice.lang === 'en-US' && /female|samantha|google us english/i.test(voice.name)) ??
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.startsWith('en'))

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  window.speechSynthesis.cancel()
  window.speechSynthesis.resume()
  window.speechSynthesis.speak(utterance)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function EnglishReading() {
  const { user, token, isLoading } = useAuth()
  const { taskId } = useParams()
  const routeTaskId = taskId ? Number(taskId) : null
  const isTaskPage = Number.isInteger(routeTaskId)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [tasks, setTasks] = useState<EnglishReadingTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(isTaskPage ? routeTaskId : null)
  const [showOnlyIncompleteTasks, setShowOnlyIncompleteTasks] = useState(true)
  const [isLargeText, setIsLargeText] = useState(false)
  const [selectedWord, setSelectedWord] = useState<ReadingVocabularyWord | null>(null)
  const [notebookWords, setNotebookWords] = useState<ReadingVocabularyWord[]>(() => loadNotebook())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [taskDate, setTaskDate] = useState(todayString())
  const [title, setTitle] = useState('每日英语阅读小达人')
  const [level, setLevel] = useState('入门')
  const [summary, setSummary] = useState('')
  const [paragraphsText, setParagraphsText] = useState('')
  const [vocabularyJson, setVocabularyJson] = useState(defaultVocabularyJson)
  const [questionsJson, setQuestionsJson] = useState(defaultQuestionsJson)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAdmin = user?.role === 'admin'

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? null, [selectedTaskId, tasks])
  const visibleTasks = useMemo(
    () => (isAdmin || !showOnlyIncompleteTasks ? tasks : tasks.filter((task) => !task.isCompleted)),
    [isAdmin, showOnlyIncompleteTasks, tasks],
  )
  const articleText = useMemo(() => selectedTask?.paragraphs.join('\n\n') ?? '', [selectedTask])
  const correctCount = selectedTask?.questions.filter((question) => answers[question.id] === question.answer).length ?? 0
  const answeredCount = Object.keys(answers).length
  const allQuestionsAnswered = Boolean(selectedTask && selectedTask.questions.every((question) => answers[question.id]))
  const canClaimReward = Boolean(!isAdmin && selectedTask && !selectedTask.isCompleted && allQuestionsAnswered)

  const loadTasks = useCallback(async () => {
    if (!token || !user) {
      return
    }

    const response = await fetchEnglishReadingTasks(token)
    setTasks(response.tasks)
    setSelectedTaskId((current) => {
      if (isTaskPage) {
        return response.tasks.some((task) => task.id === routeTaskId) ? routeTaskId : null
      }

      return current && response.tasks.some((task) => task.id === current) ? current : null
    })
  }, [isTaskPage, routeTaskId, token, user])

  useEffect(() => {
    setSelectedTaskId(isTaskPage ? routeTaskId : null)
  }, [isTaskPage, routeTaskId])

  useEffect(() => {
    loadTasks().catch((loadError) => setError(loadError instanceof Error ? loadError.message : '英语阅读任务加载失败'))
  }, [loadTasks])

  useEffect(() => {
    setAnswers({})
    setMessage('')
    setError('')
  }, [selectedTaskId])

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.getVoices()
    const handleVoicesChanged = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
  }, [])

  function addNotebookWord(word: ReadingVocabularyWord) {
    setNotebookWords((current) => {
      if (current.some((item) => item.word.toLowerCase() === word.word.toLowerCase())) {
        return current
      }

      const next = [...current, word]
      saveNotebook(next)
      return next
    })
  }

  function handleWordClick(word: ReadingVocabularyWord) {
    setError('')
    addNotebookWord(word)
    setSelectedWord(word)
    speakText(word.word, setError)
  }

  function buildPayload(): EnglishReadingTaskPayload {
    const vocabulary = parseJsonArray<ReadingVocabularyWord>(vocabularyJson, '生词')
    const questions = parseJsonArray<ReadingQuestion>(questionsJson, '阅读理解题')
    const paragraphs = paragraphsText
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    if (!paragraphs.length) {
      throw new Error('请填写短文正文，段落之间空一行')
    }

    return { taskDate, title, level, summary, vocabulary, paragraphs, questions }
  }

  async function handleSaveTask(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('请先登录')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = buildPayload()
      if (editingTaskId) {
        await updateEnglishReadingTask(token, editingTaskId, payload)
        setMessage('英语阅读任务已更新')
      } else {
        await createEnglishReadingTask(token, payload)
        setMessage('英语阅读任务已发布')
      }
      setEditingTaskId(null)
      await loadTasks()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '英语阅读任务保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCompleteTask() {
    if (!token || !selectedTask) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await completeEnglishReadingTask(token, selectedTask.id)
      setMessage(response.alreadyCompleted ? '这个阅读任务之前已经完成过，积分不会重复增加' : '阅读任务完成，已自动增加 1 颗英语阅读星星')
      await loadTasks()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '完成记录提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTask(task: EnglishReadingTask) {
    if (!token) {
      setError('请先登录')
      return
    }

    const confirmed = window.confirm(`确定删除 ${task.taskDate} 的英语阅读任务「${task.title}」吗？`)
    if (!confirmed) {
      return
    }

    try {
      setIsSubmitting(true)
      await deleteEnglishReadingTask(token, task.id)
      setMessage('英语阅读任务已删除')
      await loadTasks()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '英语阅读任务删除失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEdit(task: EnglishReadingTask) {
    setEditingTaskId(task.id)
    setTaskDate(task.taskDate)
    setTitle(task.title)
    setLevel(task.level)
    setSummary(task.summary)
    setParagraphsText(task.paragraphs.join('\n\n'))
    setVocabularyJson(JSON.stringify(task.vocabulary, null, 2))
    setQuestionsJson(JSON.stringify(task.questions, null, 2))
    setMessage('')
    setError('')
  }

  function renderParagraph(paragraph: string) {
    const vocabulary = selectedTask?.vocabulary ?? []
    if (!vocabulary.length) {
      return paragraph
    }

    const pattern = new RegExp(`\\b(${vocabulary.map((item) => escapeRegExp(item.word)).join('|')})\\b`, 'gi')
    return paragraph.split(pattern).map((part, index) => {
      const word = vocabulary.find((item) => item.word.toLowerCase() === part.toLowerCase())
      if (!word) {
        return <span key={`${part}-${index}`}>{part}</span>
      }

      return (
        <button
          key={`${word.word}-${index}`}
          className="mx-0.5 rounded-xl bg-amber-100 px-1.5 font-black text-amber-900 underline decoration-amber-400 decoration-2 underline-offset-4 transition hover:bg-amber-200"
          type="button"
          onClick={() => handleWordClick(word)}
        >
          {part}
        </button>
      )
    })
  }

  const notebookSection = (
    <section className="rounded-[34px] border border-amber-100 bg-white/90 p-5 shadow-sm shadow-amber-100">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white">
          <Star size={20} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Vocabulary</p>
          <h3 className="text-xl font-black text-slate-950">生词本</h3>
        </div>
      </div>
      {notebookWords.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {notebookWords.map((word) => (
            <button
              key={`${word.word}-${word.meaning}`}
              className="rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 ring-1 ring-amber-100"
              type="button"
              onClick={() => {
                setSelectedWord(word)
                speakText(word.word, setError)
              }}
            >
              {word.word}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-3xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          阅读时点击正文里点亮的单词，它们会自动收进这里，方便随时点读复习。
        </p>
      )}
    </section>
  )

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fff7ed] px-4 py-6">
        <div className="mx-auto max-w-5xl rounded-[30px] border border-orange-100 bg-white/85 p-5 font-bold text-orange-800">
          正在加载英语阅读小达人...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.2),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(20,184,166,0.16),transparent_30%),#fff7ed] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="flex flex-col gap-3 rounded-[30px] border border-orange-100 bg-white/85 p-4 shadow-sm shadow-orange-100 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">English Reading</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">英语阅读小达人</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{user ? `当前账户：${user.username} · ${isAdmin ? '管理员' : '学生'}` : '请先登录后查看每日阅读任务'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary justify-center" to="/">
              <ArrowLeft size={17} />
              回到学习中心
            </Link>
            <button className="btn-secondary justify-center" type="button" onClick={() => setAuthMode(user ? 'account' : 'login')}>
              <Settings size={17} />
              帐户设置
            </button>
          </div>
        </nav>

        {!user || !token ? (
          <section className="rounded-[38px] border border-orange-100 bg-white/90 p-8 text-center shadow-sm shadow-orange-100">
            <p className="text-5xl">📖</p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">请先登录后开始英语阅读</h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold leading-7 text-slate-600">
              管理员发布每日短文任务，学生完成阅读理解后自动获得 1 颗英语阅读星星。
            </p>
            <button className="btn-primary mt-6 bg-orange-600 shadow-orange-200 hover:bg-orange-700" type="button" onClick={() => setAuthMode('login')}>
              登录
            </button>
          </section>
        ) : (
          <>
            {error ? <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}
            {message ? <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{message}</div> : null}

            {isAdmin && !isTaskPage ? (
              <section className="panel space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Admin</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{editingTaskId ? '编辑每日阅读任务' : '发布每日阅读任务'}</h2>
                  </div>
                  <button
                    className="btn-secondary justify-center"
                    type="button"
                    onClick={() => {
                      setEditingTaskId(null)
                      setTaskDate(todayString())
                      setTitle('每日英语阅读小达人')
                      setLevel('入门')
                      setSummary('')
                      setParagraphsText('')
                      setVocabularyJson(defaultVocabularyJson)
                      setQuestionsJson(defaultQuestionsJson)
                    }}
                  >
                    <Plus size={17} />
                    新任务
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleSaveTask}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-600">任务日期</span>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-600">标题</span>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={title} onChange={(event) => setTitle(event.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-600">难度</span>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={level} onChange={(event) => setLevel(event.target.value)} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-600">简介</span>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={summary} onChange={(event) => setSummary(event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-600">短文正文（段落之间空一行）</span>
                    <textarea className="mt-2 min-h-44 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6" value={paragraphsText} onChange={(event) => setParagraphsText(event.target.value)} />
                  </label>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-600">生词 JSON</span>
                      <textarea className="mt-2 min-h-52 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs leading-5" value={vocabularyJson} onChange={(event) => setVocabularyJson(event.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-600">阅读理解题 JSON</span>
                      <textarea className="mt-2 min-h-52 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs leading-5" value={questionsJson} onChange={(event) => setQuestionsJson(event.target.value)} />
                    </label>
                  </div>
                  <p className="rounded-2xl bg-orange-50 px-4 py-3 text-xs font-bold leading-5 text-orange-800">
                    批量上传建议使用 JSON 文件：把任务写入 reading/YYYY-MM-DD.json，然后执行 ADMIN_PASSWORD='管理员密码' ./reading/add_reading.sh YYYY-MM-DD。可参考 reading/sample-reading-task.json。
                  </p>
                  <button className="btn-primary bg-orange-600 shadow-orange-200 hover:bg-orange-700" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '保存中...' : editingTaskId ? '保存修改' : '发布任务'}
                  </button>
                </form>
              </section>
            ) : null}

            {!isTaskPage ? (
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                <div className="rounded-[34px] border border-orange-100 bg-white/90 p-5 shadow-sm shadow-orange-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Tasks</p>
                      <h2 className="text-xl font-black text-slate-950">每日阅读任务</h2>
                    </div>
                    {!isAdmin ? (
                      <button className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700" type="button" onClick={() => setShowOnlyIncompleteTasks((current) => !current)}>
                        {showOnlyIncompleteTasks ? '只显示未完成' : '显示全部任务'}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {visibleTasks.map((task) => (
                      <article key={task.id} className="rounded-[30px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-orange-600">{task.taskDate}</p>
                            <h3 className="mt-1 text-xl font-black text-slate-950">{task.title}</h3>
                            <p className="mt-2 text-sm font-bold text-slate-500">{task.level} · 约 {task.wordCount} 词</p>
                          </div>
                          {task.isCompleted ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">已完成</span> : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{task.summary}</p>
                        {isAdmin ? <p className="mt-3 text-xs font-bold text-slate-500">完成 {task.completionCount} / {task.totalStudentCount}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link className="btn-primary bg-orange-600 shadow-orange-200 hover:bg-orange-700" to={`/english-reading/tasks/${task.id}`}>
                            {task.isCompleted ? '复习阅读' : '开始阅读'}
                          </Link>
                          {isAdmin ? (
                            <>
                              <button className="btn-secondary justify-center" type="button" onClick={() => startEdit(task)}>
                                <Pencil size={16} />
                                编辑
                              </button>
                              <button className="btn-secondary justify-center text-rose-700" type="button" onClick={() => handleDeleteTask(task)}>
                                <Trash2 size={16} />
                                删除
                              </button>
                            </>
                          ) : null}
                        </div>
                        {isAdmin && task.completions.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {task.completions.map((completion) => (
                              <p key={`${task.id}-${completion.studentUserId}-${completion.completedAt}`} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                                {completion.studentUsername} · {completion.completedAt}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                    {visibleTasks.length === 0 ? <p className="rounded-3xl bg-orange-50 px-4 py-5 text-sm font-bold text-orange-800">暂无阅读任务。</p> : null}
                  </div>
                </div>
                {notebookSection}
              </section>
            ) : selectedTask ? (
              <section className="space-y-6">
                <div className="rounded-[42px] border border-orange-100 bg-white/85 p-5 shadow-sm shadow-orange-100 sm:p-7">
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                      <Link className="btn-secondary mb-4 justify-center" to="/english-reading">
                        <ArrowLeft size={17} />
                        返回阅读任务
                      </Link>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">{selectedTask.taskDate}</p>
                      <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">📖 {selectedTask.title}</h2>
                      <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">{selectedTask.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="status-pill bg-orange-100 text-orange-800">{selectedTask.level}</span>
                        <span className="status-pill bg-teal-100 text-teal-800">约 {selectedTask.wordCount} 词</span>
                        <span className="status-pill bg-amber-100 text-amber-800">完成得 1 颗星</span>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-[30px] bg-orange-50/80 p-4">
                      <button className="btn-primary justify-center bg-orange-600 shadow-orange-200 hover:bg-orange-700" type="button" onClick={() => speakText(articleText, setError)}>
                        <Volume2 size={18} />
                        全文朗读
                      </button>
                      <button className="btn-secondary justify-center" type="button" onClick={() => setIsLargeText((current) => !current)}>
                        <Type size={18} />
                        {isLargeText ? '恢复字号' : '大字号阅读'}
                      </button>
                      {canClaimReward ? (
                        <button className="btn-primary justify-center bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700" type="button" disabled={isSubmitting} onClick={handleCompleteTask}>
                          <Star size={18} />
                          领取 1 颗星
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
                  <article className="rounded-[38px] border border-orange-100 bg-[#fffaf0] p-5 shadow-sm shadow-orange-100 sm:p-7 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Read The Story</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-950">读故事</h3>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm">
                        <Search size={16} />
                        点亮生词可查看解释
                      </span>
                    </div>

                    <div className={`mt-6 space-y-5 font-serif text-slate-800 ${isLargeText ? 'text-2xl leading-10 sm:text-3xl sm:leading-[3.2rem]' : 'text-xl leading-9 sm:text-2xl sm:leading-10'}`}>
                      {selectedTask.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex} className="rounded-[28px] bg-white/70 p-4 shadow-sm shadow-orange-100">
                          <span className="mr-3 align-top text-sm font-black text-orange-400">{paragraphIndex + 1}</span>
                          {renderParagraph(paragraph)}
                        </p>
                      ))}
                    </div>
                  </article>

                  <aside className="space-y-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
                    <section className="rounded-[34px] border border-teal-100 bg-white/90 p-5 shadow-sm shadow-teal-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-600">Challenge</p>
                          <h3 className="mt-1 text-2xl font-black text-slate-950">阅读理解</h3>
                        </div>
                        <button className="btn-secondary px-4 py-2" type="button" onClick={() => setAnswers({})}>
                          <RotateCcw size={16} />
                          重做
                        </button>
                      </div>
                      <div className="mt-4 rounded-3xl bg-teal-50 px-4 py-3 text-sm font-black text-teal-800">
                        已答 {answeredCount} / {selectedTask.questions.length}，答对 {correctCount} 题。
                      </div>

                      <div className="mt-5 space-y-4">
                        {selectedTask.questions.map((question, questionIndex) => {
                          const selectedAnswer = answers[question.id]
                          const isAnswered = Boolean(selectedAnswer)
                          const isCorrect = selectedAnswer === question.answer

                          return (
                            <div key={question.id} className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-4">
                              <p className="text-sm font-black text-teal-700">Question {questionIndex + 1}</p>
                              <h4 className="mt-2 text-base font-black leading-6 text-slate-950">{question.prompt}</h4>
                              <div className="mt-3 grid gap-2">
                                {question.options.map((option) => (
                                  <button
                                    key={option}
                                    className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                                      isAnswered && option === question.answer
                                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200'
                                        : selectedAnswer === option
                                          ? 'bg-rose-100 text-rose-800 ring-2 ring-rose-200'
                                          : 'bg-white text-slate-700 shadow-sm hover:bg-teal-50'
                                    }`}
                                    type="button"
                                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                              {isAnswered ? (
                                <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                  <p className="flex items-center gap-2 font-black">
                                    {isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                                    {isCorrect ? '回答正确' : '答错了，再回原文看一看'}
                                  </p>
                                  <p className="mt-2 leading-6">{question.explanation}</p>
                                  {!isCorrect ? <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-black">{question.paragraphHint}</p> : null}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                    {notebookSection}
                  </aside>
                </section>
              </section>
            ) : (
              <section className="rounded-[38px] border border-orange-100 bg-white/90 p-8 text-center shadow-sm shadow-orange-100">
                <p className="text-5xl">📚</p>
                <h2 className="mt-4 text-2xl font-black text-slate-950">没有找到这个阅读任务</h2>
                <p className="mt-3 font-semibold text-slate-500">任务可能已删除，或者当前账户没有访问权限。</p>
                <Link className="btn-primary mt-6 bg-orange-600 shadow-orange-200 hover:bg-orange-700" to="/english-reading">
                  返回阅读任务
                </Link>
              </section>
            )}
          </>
        )}
      </div>

      {selectedWord ? (
        <div className="fixed inset-0 z-[900] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[34px] border border-amber-100 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">New Word</p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-4xl font-black text-slate-950">{selectedWord.word}</h3>
                <p className="mt-2 text-xl font-black text-orange-600">{selectedWord.phonetic}</p>
              </div>
              <button className="btn-secondary px-4 py-2" type="button" onClick={() => speakText(selectedWord.word, setError)}>
                <Volume2 size={17} />
              </button>
            </div>
            <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-lg font-black text-orange-900">{selectedWord.meaning}</p>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Example</p>
              <p className="mt-2 text-lg font-bold leading-7 text-slate-800">{selectedWord.example}</p>
            </div>
            <button className="btn-primary mt-6 w-full justify-center bg-orange-600 shadow-orange-200 hover:bg-orange-700" type="button" onClick={() => setSelectedWord(null)}>
              继续阅读
            </button>
          </div>
        </div>
      ) : null}

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} /> : null}
    </main>
  )
}
