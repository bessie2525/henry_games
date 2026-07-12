import { FormEvent, useEffect, useRef, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GameModeSelector from '@/components/GameModeSelector'
import PracticeAccuracyBoard from '@/components/PracticeAccuracyBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameMode, GameResult, GameStatus } from '@/types/game'
import { generateNumberString, getNumberDisplayDuration } from './logic'

const game = getGameConfig('number-memory')
const DEFAULT_PRACTICE_TOTAL = 10
const MIN_PRACTICE_TOTAL = 5
const MAX_PRACTICE_TOTAL = 50

export default function NumberMemoryGame() {
  const { bestScores, saveBestScore, savePracticeAccuracy } = useBestScores()
  const [mode, setMode] = useState<GameMode>('challenge')
  const [startDigits, setStartDigits] = useState(game.defaultStartLevel)
  const [currentDigits, setCurrentDigits] = useState(startDigits)
  const [bestPassed, setBestPassed] = useState(0)
  const [practiceTotal, setPracticeTotal] = useState(DEFAULT_PRACTICE_TOTAL)
  const [practiceQuestion, setPracticeQuestion] = useState(1)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [targetNumber, setTargetNumber] = useState('')
  const [userInput, setUserInput] = useState('')
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)
  const [displayDuration, setDisplayDuration] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hideTimerRef = useRef<number | null>(null)
  const displayEndAtRef = useRef(0)

  const remainingPercent = displayDuration ? Math.max(0, Math.min(100, (remainingMs / displayDuration) * 100)) : 0
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const practiceScores =
    bestScores[game.id]?.practiceBestAccuracyByQuestionCount?.[practiceTotal] ??
    (practiceTotal === DEFAULT_PRACTICE_TOTAL ? bestScores[game.id]?.practiceBestAccuracyByLevel : undefined)
  const currentPracticeBest = Math.round(practiceScores?.[startDigits] ?? 0)

  const startRound = (digits: number, resetScore = false) => {
    const duration = getNumberDisplayDuration(digits)

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
    }

    setCurrentDigits(digits)
    setTargetNumber(generateNumberString(digits))
    setUserInput('')
    setResult(null)
    setDisplayDuration(duration)
    setRemainingMs(duration)
    displayEndAtRef.current = Date.now() + duration
    setStatus('showing')

    if (resetScore) {
      setBestPassed(0)
      setPracticeQuestion(1)
      setPracticeCorrect(0)
    }

    hideTimerRef.current = window.setTimeout(() => {
      setStatus('input')
      setRemainingMs(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }, duration)
  }

  const startGame = () => {
    startRound(startDigits, true)
  }

  const finishPractice = (correctCount: number) => {
    const accuracy = (correctCount / practiceTotal) * 100
    const isNewBest = savePracticeAccuracy(game.id, startDigits, practiceTotal, accuracy)

    setResult({
      gameId: game.id,
      title: '固定难度练习完成',
      bestLevel: startDigits,
      score: correctCount,
      accuracy,
      detail: `${startDigits} 位数字，连续完成 ${practiceTotal} 题，答对 ${correctCount} 题。当前题数下该难度历史最高正确率：${Math.round(
        Math.max(currentPracticeBest, accuracy),
      )}%。`,
      bestLevelLabel: '练习难度',
      scoreLabel: '答对题数',
      isNewBest,
    })
    setStatus('result')
  }

  const finishGame = (detail: string, answer: string, userAnswer: string) => {
    const candidate = {
      gameId: game.id,
      bestLevel: bestPassed,
      bestScore: bestPassed,
      updatedAt: Date.now(),
    }
    const isNewBest = bestPassed > 0 ? saveBestScore(candidate) : false
    setResult({
      gameId: game.id,
      title: '数字没有完全匹配',
      bestLevel: bestPassed,
      score: bestPassed,
      detail,
      answer,
      userAnswer,
      isNewBest,
    })
    setStatus('result')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (status !== 'input') {
      return
    }

    const isCorrect = userInput === targetNumber

    if (mode === 'practice') {
      const nextCorrect = practiceCorrect + (isCorrect ? 1 : 0)

      if (practiceQuestion >= practiceTotal) {
        finishPractice(nextCorrect)
        return
      }

      setPracticeCorrect(nextCorrect)
      setPracticeQuestion((value) => value + 1)
      setStatus(isCorrect ? 'success' : 'failed')
      window.setTimeout(() => startRound(startDigits), 650)
      return
    }

    if (isCorrect) {
      const nextBest = Math.max(bestPassed, currentDigits)
      setBestPassed(nextBest)

      if (currentDigits >= game.maxStartLevel) {
        const candidate = {
          gameId: game.id,
          bestLevel: nextBest,
          bestScore: nextBest,
          updatedAt: Date.now(),
        }
        const isNewBest = saveBestScore(candidate)
        setResult({
          gameId: game.id,
          title: '你完成了最高位数挑战',
          bestLevel: nextBest,
          score: nextBest,
          detail: '已经到达数字记忆的最高可选难度。',
          isNewBest,
        })
        setStatus('result')
        return
      }

      setStatus('success')
      window.setTimeout(() => startRound(currentDigits + 1), 650)
      return
    }

    finishGame('输入必须与展示数字完全一致，前导 0 也需要保留。', targetNumber, userInput)
  }

  useEffect(() => {
    if (status === 'input') {
      inputRef.current?.focus()
    }
  }, [status])

  useEffect(() => {
    if (status !== 'showing') {
      return undefined
    }

    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, displayEndAtRef.current - Date.now()))
    }, 100)

    return () => window.clearInterval(interval)
  }, [status])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  return (
    <main className="min-h-screen px-3 py-4 sm:px-4 md:py-8">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={
            status === 'intro'
              ? '尚未开始'
              : mode === 'practice'
                ? `${currentDigits} 位 · ${practiceQuestion}/${practiceTotal}`
                : `${currentDigits} 位数字`
          }
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">看清数字，完整复现</h2>
              <p className="mt-4 leading-7 text-slate-500">
                数字会短暂显示，隐藏后请在输入框中完整输入。答案按字符串比较，所以 0 开头的数字也必须原样保留。
              </p>
              <div className="mt-6">
                <GameModeSelector mode={mode} onChange={setMode} />
              </div>
              {mode === 'practice' ? (
                <>
                  <div className="mt-6">
                    <DifficultySelector
                      label="练习题数"
                      value={practiceTotal}
                      min={MIN_PRACTICE_TOTAL}
                      max={MAX_PRACTICE_TOTAL}
                      suffix="题"
                      description="本次固定难度练习的总题数。"
                      onChange={setPracticeTotal}
                    />
                  </div>
                  <PracticeAccuracyBoard
                    min={game.minStartLevel}
                    max={game.maxStartLevel}
                    suffix="位"
                    questionCount={practiceTotal}
                    scores={practiceScores}
                  />
                </>
              ) : null}
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                {mode === 'practice' ? `开始 ${practiceTotal} 题练习` : '开始记忆'}
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startDigits}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="位"
              description={
                mode === 'practice'
                  ? `固定 ${startDigits} 位，做 ${practiceTotal} 题。当前题数最高正确率：${currentPracticeBest}%。`
                  : `展示约 ${Math.round(getNumberDisplayDuration(startDigits) / 100) / 10} 秒。`
              }
              onChange={setStartDigits}
            />
          </section>
        ) : (
          <section className="panel mt-4 text-center sm:mt-6">
            <p className="eyebrow">{status === 'showing' ? 'Remember' : 'Type it back'}</p>
            {status === 'showing' ? (
              <>
                <div className="mx-auto mt-5 max-w-3xl overflow-x-auto whitespace-nowrap rounded-[24px] bg-slate-950 px-4 py-8 text-center text-3xl font-black tracking-[0.12em] text-cyan-200 shadow-2xl shadow-slate-200 sm:mt-8 sm:rounded-[32px] sm:px-6 sm:py-10 sm:text-6xl sm:tracking-[0.18em]">
                  {targetNumber}
                </div>
                <div className="mx-auto mt-5 max-w-3xl sm:mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-400 sm:tracking-[0.18em]">
                    <span>倒计时</span>
                    <span>{remainingSeconds} 秒</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-[width] duration-100 ease-linear"
                      style={{ width: `${remainingPercent}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-500 sm:mt-5">数字即将隐藏，请集中注意力。</p>
              </>
            ) : (
              <form className="mx-auto mt-5 max-w-xl sm:mt-8" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.1em] text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 sm:rounded-[28px] sm:px-6 sm:py-5 sm:text-3xl sm:tracking-[0.16em]"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value.replace(/\D/g, ''))}
                  placeholder="输入刚才的数字"
                />
                <button className="btn-primary mx-auto mt-5" type="submit">
                  提交答案
                </button>
                {status === 'success' ? (
                  <p className="status-pill success mx-auto mt-4">
                    {mode === 'practice' ? '正确，进入下一题' : '正确，进入下一位数'}
                  </p>
                ) : null}
                {status === 'failed' ? <p className="status-pill mx-auto mt-4">本题错误，进入下一题</p> : null}
              </form>
            )}
          </section>
        )}
      </div>

      {result ? (
        <ResultModal result={result} onReplay={startGame} onAdjust={() => setStatus('intro')} />
      ) : null}
    </main>
  )
}
