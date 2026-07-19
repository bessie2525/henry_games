import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RotateCcw, Search, Settings, Star, Type, Volume2, XCircle } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { getDailyEnglishReadingArticle } from '@/data/englishReading'
import { useAuth } from '@/hooks/useAuth'
import type { ReadingVocabularyWord } from '@/types/englishReading'

type AuthMode = 'login' | 'register' | 'account'

const notebookStorageKey = 'english-reading-vocabulary'

function todayLabel() {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
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

export default function EnglishReading() {
  const { user } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [isLargeText, setIsLargeText] = useState(false)
  const [selectedWord, setSelectedWord] = useState<ReadingVocabularyWord | null>(null)
  const [notebookWords, setNotebookWords] = useState<ReadingVocabularyWord[]>(() => loadNotebook())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const article = useMemo(() => getDailyEnglishReadingArticle(), [])
  const articleText = useMemo(
    () => article.paragraphs.map((paragraph) => paragraph.map((segment) => segment.text).join('')).join('\n\n'),
    [article.paragraphs],
  )
  const correctCount = article.questions.filter((question) => answers[question.id] === question.answer).length
  const answeredCount = Object.keys(answers).length

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.getVoices()
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices()
    }

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
  }, [])

  function addNotebookWord(word: ReadingVocabularyWord) {
    setNotebookWords((current) => {
      if (current.some((item) => item.id === word.id)) {
        return current
      }

      const next = [...current, word]
      saveNotebook(next)
      return next
    })
  }

  function handleWordClick(vocabId: string) {
    const word = article.vocabulary.find((item) => item.id === vocabId)
    if (!word) {
      return
    }

    setError('')
    addNotebookWord(word)
    setSelectedWord(word)
    speakText(word.word, setError)
  }

  function resetQuestions() {
    setAnswers({})
    setError('')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.2),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(20,184,166,0.16),transparent_30%),#fff7ed] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="flex flex-col gap-3 rounded-[30px] border border-orange-100 bg-white/85 p-4 shadow-sm shadow-orange-100 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">English Reading</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">英语阅读小达人</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">每天一篇小短文，读故事后马上闯关。</p>
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

        {error ? <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}

        <section className="relative overflow-hidden rounded-[42px] border border-orange-100 bg-white/85 p-5 shadow-sm shadow-orange-100 sm:p-7">
          <div className="absolute right-6 top-6 hidden text-8xl opacity-10 sm:block">{article.emoji}</div>
          <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">{todayLabel()}</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                {article.emoji} {article.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">{article.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="status-pill bg-orange-100 text-orange-800">{article.level}</span>
                <span className="status-pill bg-teal-100 text-teal-800">约 {article.wordCount} 词</span>
                <span className="status-pill bg-amber-100 text-amber-800">阅读 5-8 分钟</span>
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
            </div>
          </div>
        </section>

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
              {article.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="rounded-[28px] bg-white/70 p-4 shadow-sm shadow-orange-100">
                  <span className="mr-3 align-top text-sm font-black text-orange-400">{paragraphIndex + 1}</span>
                  {paragraph.map((segment, segmentIndex) =>
                    segment.vocabId ? (
                      <button
                        key={`${segment.text}-${segmentIndex}`}
                        className="mx-0.5 rounded-xl bg-amber-100 px-1.5 font-black text-amber-900 underline decoration-amber-400 decoration-2 underline-offset-4 transition hover:bg-amber-200"
                        type="button"
                        onClick={() => handleWordClick(segment.vocabId ?? '')}
                      >
                        {segment.text}
                      </button>
                    ) : (
                      <span key={`${segment.text}-${segmentIndex}`}>{segment.text}</span>
                    ),
                  )}
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
                <button className="btn-secondary px-4 py-2" type="button" onClick={resetQuestions}>
                  <RotateCcw size={16} />
                  重做
                </button>
              </div>
              <div className="mt-4 rounded-3xl bg-teal-50 px-4 py-3 text-sm font-black text-teal-800">
                已答 {answeredCount} / {article.questions.length}，答对 {correctCount} 题。
              </div>

              <div className="mt-5 space-y-4">
                {article.questions.map((question, questionIndex) => {
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
                      key={word.id}
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
          </aside>
        </section>
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
