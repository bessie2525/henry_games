import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, LogIn, Pencil, Plus, RotateCcw, Save, Star, Volume2 } from 'lucide-react'
import {
  completeWordChallengeTask,
  createWordChallengeTask,
  fetchWordChallengeTasks,
  updateWordChallengeTask,
} from '@/api/wordChallenge'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import type { WordChallengeTask, WordChallengeWord } from '@/types/wordChallenge'

type AuthMode = 'login' | 'register'
type Stage = 'learn' | 'meaning' | 'order' | 'sky' | 'spelling' | 'sentence' | 'done'

const stages: { id: Stage; name: string }[] = [
  { id: 'learn', name: '学新词' },
  { id: 'meaning', name: '选意思' },
  { id: 'order', name: '字母归位' },
  { id: 'sky', name: '字母天空' },
  { id: 'spelling', name: '单词拼写' },
  { id: 'sentence', name: '例句填空' },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function emptyWords(): WordChallengeWord[] {
  return Array.from({ length: 10 }, () => ({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
  }))
}

function cleanLetters(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function blankExample(example: string, word: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'ig')
  const blanked = example.replace(pattern, '____')
  return blanked === example ? `${example}  ____` : blanked
}

function shuffleText(text: string) {
  return text
    .split('')
    .map((letter, index) => ({ letter, sort: (letter.charCodeAt(0) * 17 + index * 31) % 97 }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.letter)
}

function remainingShuffledLetters(word: string, answer: string) {
  const usedLetters = answer.split('')
  return shuffleText(cleanLetters(word)).filter((letter) => {
    const usedIndex = usedLetters.indexOf(letter)
    if (usedIndex === -1) {
      return true
    }

    usedLetters.splice(usedIndex, 1)
    return false
  })
}

function meaningOptions(words: WordChallengeWord[], currentIndex: number) {
  return [words[currentIndex].meaning, ...words.filter((_, itemIndex) => itemIndex !== currentIndex).slice(0, 3).map((word) => word.meaning)]
    .map((meaning, index) => ({ meaning, sort: (meaning.charCodeAt(0) * 13 + currentIndex * 29 + index * 7) % 97 }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.meaning)
}

function missingPositions(word: string) {
  const letters = cleanLetters(word)
  if (letters.length <= 2) {
    return [0]
  }

  return [1, Math.max(2, letters.length - 2)]
}

function speakWord(word: string) {
  if (!('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const usVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('en-us'))
  if (usVoice) {
    utterance.voice = usVoice
  }
  window.speechSynthesis.speak(utterance)
}

function validateWords(words: WordChallengeWord[]) {
  return words.length === 10 && words.every((item) => item.word.trim() && item.meaning.trim() && item.example.trim())
}

export default function WordChallenge() {
  const { user, token, isLoading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [tasks, setTasks] = useState<WordChallengeTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskDate, setTaskDate] = useState(todayString())
  const [title, setTitle] = useState('每日英语单词闯关')
  const [words, setWords] = useState<WordChallengeWord[]>(emptyWords)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('learn')
  const [learnIndex, setLearnIndex] = useState(0)
  const [heardWords, setHeardWords] = useState<Set<number>>(new Set())
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [meaningIndex, setMeaningIndex] = useState(0)
  const [meaningHeardWords, setMeaningHeardWords] = useState<Set<number>>(new Set())
  const [meaningAnswers, setMeaningAnswers] = useState<Record<number, string>>({})
  const [orderIndex, setOrderIndex] = useState(0)
  const [orderAnswer, setOrderAnswer] = useState('')
  const [orderFeedback, setOrderFeedback] = useState('')
  const [orderPassed, setOrderPassed] = useState<Set<number>>(new Set())
  const [skyAnswers, setSkyAnswers] = useState<Record<number, string>>({})
  const [skyPassed, setSkyPassed] = useState<Set<number>>(new Set())
  const [spellAnswers, setSpellAnswers] = useState<Record<number, string>>({})
  const [spellPassed, setSpellPassed] = useState<Set<number>>(new Set())
  const [sentenceAnswers, setSentenceAnswers] = useState<Record<number, string>>({})
  const [sentencePassed, setSentencePassed] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAdmin = user?.role === 'admin'

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null,
    [selectedTaskId, tasks],
  )
  const activeWords = selectedTask?.words ?? []

  const loadTasks = useCallback(async () => {
    if (!token || !user) {
      return
    }

    const response = await fetchWordChallengeTasks(token, isAdmin ? {} : { date: todayString() })
    setTasks(response.tasks)
    setSelectedTaskId((current) => current ?? response.tasks[0]?.id ?? null)
  }, [isAdmin, token, user])

  useEffect(() => {
    loadTasks().catch((loadError) => setError(loadError instanceof Error ? loadError.message : '单词任务加载失败'))
  }, [loadTasks])

  const resetChallenge = () => {
    setStage('learn')
    setLearnIndex(0)
    setHeardWords(new Set())
    setFlippedCards(new Set())
    setMeaningIndex(0)
    setMeaningHeardWords(new Set())
    setMeaningAnswers({})
    setOrderIndex(0)
    setOrderAnswer('')
    setOrderFeedback('')
    setOrderPassed(new Set())
    setSkyAnswers({})
    setSkyPassed(new Set())
    setSpellAnswers({})
    setSpellPassed(new Set())
    setSentenceAnswers({})
    setSentencePassed(new Set())
    setMessage('')
    setError('')
  }

  useEffect(() => {
    resetChallenge()
  }, [selectedTaskId])

  const updateWord = (index: number, patch: Partial<WordChallengeWord>) => {
    setWords((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const handleSaveTask = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('请先登录')
      return
    }

    if (!validateWords(words)) {
      setError('请填写 10 个单词，每个单词至少包含英文、中文和例句')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingTaskId) {
        await updateWordChallengeTask(token, editingTaskId, { taskDate, title, words })
        setMessage('单词任务已更新')
      } else {
        await createWordChallengeTask(token, { taskDate, title, words })
        setMessage('单词任务已发布')
      }
      setEditingTaskId(null)
      setWords(emptyWords())
      await loadTasks()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '单词任务保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!token || !selectedTask) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await completeWordChallengeTask(token, selectedTask.id)
      setMessage(response.alreadyCompleted ? '这个任务之前已经完成过，积分不会重复增加' : '闯关完成，已自动增加 2 颗英语闯关星星')
      setStage('done')
      await loadTasks()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '完成记录提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const skyDone = activeWords.length > 0 && skyPassed.size === activeWords.length
  const spellingDone = activeWords.length > 0 && spellPassed.size === activeWords.length
  const sentenceDone = activeWords.length > 0 && sentencePassed.size === activeWords.length
  const learnWord = activeWords[learnIndex]
  const learnCanContinue = Boolean(learnWord && heardWords.has(learnIndex) && flippedCards.has(learnIndex))
  const meaningWord = activeWords[meaningIndex]
  const selectedMeaning = meaningAnswers[meaningIndex]
  const meaningCanContinue = Boolean(meaningWord && meaningHeardWords.has(meaningIndex) && selectedMeaning)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.18),transparent_30%),#eff6ff] px-4 py-6">
        <div className="mx-auto max-w-5xl rounded-[30px] border border-blue-100 bg-white/85 p-5 font-bold text-blue-800">
          正在加载英语单词闯关...
        </div>
      </main>
    )
  }

  if (!user || !token) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_30%),#eff6ff] px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <nav className="flex items-center justify-between rounded-[30px] border border-blue-100 bg-white/85 p-4 shadow-sm shadow-blue-100">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Word Challenge</p>
              <h1 className="text-xl font-black text-slate-950">英语单词闯关</h1>
            </div>
            <Link className="btn-secondary justify-center" to="/">
              <Activity size={17} />
              认知训练小游戏
            </Link>
          </nav>
          <section className="rounded-[38px] border border-blue-100 bg-white/90 p-8 text-center shadow-sm shadow-blue-100">
            <p className="text-5xl">🔤</p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">请先登录后开始单词闯关</h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold leading-7 text-slate-600">
              管理员发布每日 10 个单词任务，学生完成六个环节后自动获得 2 颗英语闯关星星。
            </p>
            <button className="btn-primary mt-6 bg-blue-600 shadow-blue-200 hover:bg-blue-700" type="button" onClick={() => setAuthMode('login')}>
              <LogIn size={18} />
              登录
            </button>
          </section>
        </div>
        {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} /> : null}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(251,191,36,0.18),transparent_28%),#eff6ff] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-col gap-3 rounded-[30px] border border-blue-100 bg-white/85 p-4 shadow-sm shadow-blue-100 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Word Challenge</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">英语单词闯关</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">当前账户：{user.username} · {isAdmin ? '管理员' : '学生'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary justify-center" to="/points">
              <Star size={17} />
              学生积分系统
            </Link>
            <Link className="btn-secondary justify-center" to="/">
              <Activity size={17} />
              认知训练小游戏
            </Link>
          </div>
        </nav>

        {error ? <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}
        {message ? <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{message}</div> : null}

        {isAdmin ? (
          <section className="panel space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Admin</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{editingTaskId ? '编辑单词任务' : '发布每日单词任务'}</h2>
              </div>
              <button
                className="btn-secondary justify-center"
                type="button"
                onClick={() => {
                  setEditingTaskId(null)
                  setTaskDate(todayString())
                  setTitle('每日英语单词闯关')
                  setWords(emptyWords())
                }}
              >
                <Plus size={17} />
                新任务
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveTask}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-600">任务日期</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    type="date"
                    value={taskDate}
                    onChange={(event) => setTaskDate(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-600">任务标题</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-3">
                {words.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-3xl bg-blue-50/70 p-3 md:grid-cols-[1fr_1fr_1.2fr_2fr]">
                    <input className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-bold" value={item.word} onChange={(event) => updateWord(index, { word: event.target.value })} placeholder={`单词 ${index + 1}`} />
                    <input className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-bold" value={item.phonetic} onChange={(event) => updateWord(index, { phonetic: event.target.value })} placeholder="音标" />
                    <input className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-bold" value={item.meaning} onChange={(event) => updateWord(index, { meaning: event.target.value })} placeholder="中文" />
                    <input className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-bold" value={item.example} onChange={(event) => updateWord(index, { example: event.target.value })} placeholder="英文例句" />
                  </div>
                ))}
              </div>

              <button className="btn-primary bg-blue-600 shadow-blue-200 hover:bg-blue-700" type="submit" disabled={isSubmitting}>
                <Save size={18} />
                {isSubmitting ? '保存中...' : editingTaskId ? '保存修改' : '发布任务'}
              </button>
            </form>
          </section>
        ) : null}

        {isAdmin && tasks.length > 0 ? (
          <section className="rounded-[30px] border border-white/80 bg-white/85 p-4 shadow-sm shadow-blue-100">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Tasks</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  type="button"
                  onClick={() => {
                    setEditingTaskId(task.id)
                    setTaskDate(task.taskDate)
                    setTitle(task.title)
                    setWords(task.words)
                    setSelectedTaskId(task.id)
                  }}
                >
                  <p className="text-sm font-black text-slate-950">{task.taskDate} · {task.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">共 {task.words.length} 个单词</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                    <Pencil size={13} />
                    编辑
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {!selectedTask ? (
          <section className="rounded-[38px] border border-blue-100 bg-white/90 p-8 text-center shadow-sm shadow-blue-100">
            <p className="text-5xl">📘</p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">{isAdmin ? '还没有单词任务' : '今天还没有单词任务'}</h2>
            <p className="mt-3 font-semibold text-slate-500">{isAdmin ? '请先发布一个包含 10 个单词的任务。' : '等待管理员发布后，这里会自动显示。'}</p>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="rounded-[38px] border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-100">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Today Task</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedTask.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{selectedTask.taskDate} · 完成后自动增加 2 颗英语闯关星星</p>
                </div>
                <button className="btn-secondary justify-center" type="button" onClick={resetChallenge}>
                  <RotateCcw size={17} />
                  重新开始
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
                {stages.map((item) => (
                  <button
                    key={item.id}
                    className={`rounded-2xl px-3 py-2 text-sm font-black transition ${
                      stage === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-blue-50 text-blue-800'
                    }`}
                    type="button"
                    onClick={() => setStage(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedTask.isCompleted ? (
              <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                这个任务已经完成过，积分已记录。仍然可以继续复习单词。
              </div>
            ) : null}

            {stage === 'learn' ? (
              <section className="panel">
                {learnWord ? (
                  <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-black text-blue-600">第 {learnIndex + 1} / {activeWords.length} 个单词</p>
                    <button
                      className="mt-4 min-h-80 w-full rounded-[34px] border border-blue-100 bg-white p-6 text-left shadow-sm shadow-blue-100 transition hover:-translate-y-0.5"
                      type="button"
                      onClick={() =>
                        setFlippedCards((current) => {
                          const next = new Set(current)
                          if (next.has(learnIndex)) {
                            next.delete(learnIndex)
                          } else {
                            next.add(learnIndex)
                          }
                          return next
                        })
                      }
                    >
                      {!flippedCards.has(learnIndex) ? (
                        <div className="grid min-h-64 place-items-center text-center">
                          <div>
                            <p className="text-6xl font-black tracking-tight text-slate-950 sm:text-7xl">{learnWord.word}</p>
                            <p className="mt-4 text-2xl font-black text-blue-600">{learnWord.phonetic}</p>
                            <p className="mt-6 text-sm font-black text-blue-700">点卡片翻出中文意思和例句</p>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-64">
                          <p className="text-4xl font-black text-slate-950">{learnWord.meaning}</p>
                          <div className="mt-6 rounded-[28px] border border-amber-100 bg-amber-50 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Example</p>
                            <p className="mt-3 text-3xl font-black leading-10 text-amber-950">{learnWord.example}</p>
                          </div>
                          <span className="mt-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">已翻出中文和例句</span>
                        </div>
                      )}
                    </button>
                    <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        className="btn-secondary justify-center"
                        type="button"
                        onClick={() => {
                          speakWord(learnWord.word)
                          setHeardWords((current) => new Set(current).add(learnIndex))
                        }}
                      >
                        <Volume2 size={17} />
                        朗读单词
                      </button>
                      <button
                        className="btn-primary bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                        type="button"
                        disabled={!learnCanContinue}
                        onClick={() => {
                          if (learnIndex + 1 < activeWords.length) {
                            setLearnIndex(learnIndex + 1)
                          } else {
                            setStage('meaning')
                          }
                        }}
                      >
                        {learnIndex + 1 < activeWords.length ? '下一个单词' : '开始选意思'}
                      </button>
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      需要先点“朗读单词”，并翻出中文意思和例句，才能继续。
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {stage === 'meaning' ? (
              <section className="panel">
                {meaningWord ? (
                  <div className="mx-auto max-w-3xl">
                    <div className="rounded-[34px] bg-blue-50/80 p-5 text-center">
                      <p className="text-sm font-black text-blue-600">第 {meaningIndex + 1} / {activeWords.length} 题</p>
                      <p className="mt-3 text-5xl font-black text-slate-950">{meaningWord.word}</p>
                      <button
                        className="btn-secondary mx-auto mt-4 justify-center"
                        type="button"
                        onClick={() => {
                          speakWord(meaningWord.word)
                          setMeaningHeardWords((current) => new Set(current).add(meaningIndex))
                        }}
                      >
                        <Volume2 size={17} />
                        朗读
                      </button>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {meaningOptions(activeWords, meaningIndex).map((option) => (
                        <button
                          key={option}
                          className={`rounded-2xl px-5 py-4 text-left text-base font-black ${
                            selectedMeaning && option === meaningWord.meaning
                              ? 'bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50'
                              : selectedMeaning === option
                                ? 'bg-rose-100 text-rose-800 ring-4 ring-rose-50'
                                : 'bg-white text-slate-700 shadow-sm shadow-blue-100'
                          }`}
                          type="button"
                          onClick={() => setMeaningAnswers((current) => ({ ...current, [meaningIndex]: option }))}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {selectedMeaning ? (
                      <div className="mt-5 rounded-[28px] border border-amber-100 bg-amber-50 p-5">
                        <p className="text-sm font-black text-amber-700">
                          {selectedMeaning === meaningWord.meaning ? '回答正确' : `答错了，正确答案是：${meaningWord.meaning}`}
                        </p>
                        <p className="mt-3 text-2xl font-black leading-9 text-amber-950">{meaningWord.example}</p>
                      </div>
                    ) : null}
                    <button
                      className="btn-primary mt-5 w-full bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                      type="button"
                      disabled={!meaningCanContinue}
                      onClick={() => {
                        if (meaningIndex + 1 < activeWords.length) {
                          setMeaningIndex(meaningIndex + 1)
                        } else {
                          setStage('order')
                        }
                      }}
                    >
                      {meaningIndex + 1 < activeWords.length ? '下一题' : '进入字母归位'}
                    </button>
                    <p className="mt-3 text-center text-sm font-bold text-slate-500">
                      需要先朗读，并选择答案看到中文和例句，才能继续。
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {stage === 'order' ? (
              <section className="panel text-center">
                <p className="text-sm font-black text-blue-600">第 {orderIndex + 1} / {activeWords.length} 个</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{activeWords[orderIndex]?.meaning}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">点击字母，拼回完整单词</p>
                <div className="mx-auto mt-5 min-h-16 max-w-xl rounded-3xl bg-blue-50 px-4 py-4 text-3xl font-black tracking-[0.2em] text-blue-800">
                  {orderAnswer || ' '}
                </div>
                {orderFeedback ? (
                  <div className="mx-auto mt-3 max-w-xl rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                    {orderFeedback}
                  </div>
                ) : null}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {remainingShuffledLetters(activeWords[orderIndex]?.word ?? '', orderAnswer).map((letter, index) => (
                    <button
                      key={`${letter}-${index}`}
                      className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl font-black text-slate-950 shadow-sm"
                      type="button"
                      onClick={() => {
                        setError('')
                        setOrderFeedback('')
                        setOrderAnswer((current) => current + letter)
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    className="btn-secondary justify-center"
                    type="button"
                    onClick={() => {
                      setOrderFeedback('')
                      setOrderAnswer((current) => current.slice(0, -1))
                    }}
                    disabled={!orderAnswer}
                  >
                    退格
                  </button>
                  <button
                    className="btn-secondary justify-center"
                    type="button"
                    onClick={() => {
                      setOrderFeedback('')
                      setOrderAnswer('')
                    }}
                    disabled={!orderAnswer}
                  >
                    清空
                  </button>
                  <button
                    className="btn-primary bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                    type="button"
                    onClick={() => {
                      const isCorrect = orderAnswer === cleanLetters(activeWords[orderIndex]?.word ?? '')
                      if (!isCorrect) {
                        setOrderFeedback(`正确答案是 ${activeWords[orderIndex]?.word}，请重新拼一次`)
                        setOrderAnswer('')
                        return
                      }
                      setError('')
                      setOrderFeedback('')
                      setOrderPassed((current) => new Set(current).add(orderIndex))
                      setOrderAnswer('')
                      if (orderIndex + 1 < activeWords.length) {
                        setOrderIndex(orderIndex + 1)
                      } else {
                        setStage('sky')
                      }
                    }}
                  >
                    确认
                  </button>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-500">已完成 {orderPassed.size} / {activeWords.length}</p>
              </section>
            ) : null}

            {stage === 'sky' ? (
              <section className="panel space-y-4">
                {activeWords.map((item, index) => {
                  const letters = cleanLetters(item.word)
                  const positions = missingPositions(item.word)
                  const answer = skyAnswers[index] ?? ''
                  const isPassed = skyPassed.has(index)
                  return (
                    <div key={item.word} className="rounded-3xl bg-blue-50/70 p-4">
                      <p className="text-sm font-bold text-slate-500">{item.meaning}</p>
                      <p className="mt-2 text-2xl font-black tracking-[0.2em] text-slate-950">
                        {letters.split('').map((letter, letterIndex) => (positions.includes(letterIndex) ? '_' : letter)).join(' ')}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-black" value={answer} onChange={(event) => setSkyAnswers((current) => ({ ...current, [index]: event.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, positions.length) }))} placeholder={`填写 ${positions.length} 个字母`} />
                        <button
                          className="btn-secondary justify-center"
                          type="button"
                          onClick={() => {
                            const expected = positions.map((position) => letters[position]).join('')
                            if (answer === expected) {
                              setSkyPassed((current) => new Set(current).add(index))
                            } else {
                              setError(`正确答案是 ${item.word}`)
                            }
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={17} /> : null}
                          检查
                        </button>
                      </div>
                    </div>
                  )
                })}
                <button className="btn-primary bg-blue-600 shadow-blue-200 hover:bg-blue-700" type="button" disabled={!skyDone} onClick={() => setStage('spelling')}>
                  进入单词拼写
                </button>
              </section>
            ) : null}

            {stage === 'spelling' ? (
              <section className="panel space-y-4">
                {activeWords.map((item, index) => {
                  const answer = spellAnswers[index] ?? ''
                  const isPassed = spellPassed.has(index)
                  return (
                    <div key={item.word} className="rounded-3xl bg-blue-50/70 p-4">
                      <p className="text-lg font-black text-slate-950">{item.meaning}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">根据中文提示，拼写完整英文单词。</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-black" value={answer} onChange={(event) => setSpellAnswers((current) => ({ ...current, [index]: event.target.value.toLowerCase().replace(/[^a-z]/g, '') }))} placeholder="拼写完整单词" />
                        <button
                          className="btn-secondary justify-center"
                          type="button"
                          onClick={() => {
                            if (answer === cleanLetters(item.word)) {
                              setSpellPassed((current) => new Set(current).add(index))
                            } else {
                              setError(`正确答案是 ${item.word}`)
                            }
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={17} /> : null}
                          检查
                        </button>
                      </div>
                    </div>
                  )
                })}
                <button className="btn-primary bg-blue-600 shadow-blue-200 hover:bg-blue-700" type="button" disabled={!spellingDone} onClick={() => setStage('sentence')}>
                  进入例句填空
                </button>
              </section>
            ) : null}

            {stage === 'sentence' ? (
              <section className="panel space-y-4">
                {activeWords.map((item, index) => {
                  const answer = sentenceAnswers[index] ?? ''
                  const isPassed = sentencePassed.has(index)
                  return (
                    <div key={item.word} className="rounded-3xl bg-blue-50/70 p-4">
                      <p className="text-sm font-bold text-slate-500">根据例句，把挖掉的单词填回来</p>
                      <p className="mt-2 text-lg font-black leading-8 text-slate-950">{blankExample(item.example, item.word)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">中文提示：{item.meaning}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input className="rounded-2xl border border-blue-100 px-4 py-3 text-sm font-black" value={answer} onChange={(event) => setSentenceAnswers((current) => ({ ...current, [index]: event.target.value.toLowerCase().replace(/[^a-z]/g, '') }))} placeholder="填入单词" />
                        <button
                          className="btn-secondary justify-center"
                          type="button"
                          onClick={() => {
                            if (answer === cleanLetters(item.word)) {
                              setSentencePassed((current) => new Set(current).add(index))
                              setError('')
                            } else {
                              setError(`正确答案是 ${item.word}`)
                            }
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={17} /> : null}
                          检查
                        </button>
                      </div>
                    </div>
                  )
                })}
                <button className="btn-primary bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700" type="button" disabled={!sentenceDone || isSubmitting} onClick={handleComplete}>
                  {isSubmitting ? '提交中...' : '完成闯关并领取 2 颗星'}
                </button>
              </section>
            ) : null}

            {stage === 'done' ? (
              <section className="rounded-[38px] border border-emerald-100 bg-emerald-50 p-8 text-center shadow-sm shadow-emerald-100">
                <p className="text-5xl">🌟</p>
                <h2 className="mt-4 text-3xl font-black text-emerald-900">闯关完成</h2>
                <p className="mt-3 font-bold text-emerald-700">积分系统已记录英语闯关 2 颗星。</p>
              </section>
            ) : null}
          </section>
        )}
      </div>
    </main>
  )
}
