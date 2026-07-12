import { FormEvent, useEffect, useRef, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameResult, GameStatus } from '@/types/game'
import { generateNumberString, getNumberDisplayDuration } from './logic'

const game = getGameConfig('number-memory')

export default function NumberMemoryGame() {
  const { bestScores, saveBestScore } = useBestScores()
  const [startDigits, setStartDigits] = useState(game.defaultStartLevel)
  const [currentDigits, setCurrentDigits] = useState(startDigits)
  const [bestPassed, setBestPassed] = useState(0)
  const [targetNumber, setTargetNumber] = useState('')
  const [userInput, setUserInput] = useState('')
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startRound = (digits: number, resetScore = false) => {
    setCurrentDigits(digits)
    setTargetNumber(generateNumberString(digits))
    setUserInput('')
    setResult(null)
    setStatus('showing')

    if (resetScore) {
      setBestPassed(0)
    }

    window.setTimeout(() => {
      setStatus('input')
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }, getNumberDisplayDuration(digits))
  }

  const startGame = () => {
    startRound(startDigits, true)
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

    if (userInput === targetNumber) {
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

  return (
    <main className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={status === 'intro' ? '尚未开始' : `${currentDigits} 位数字`}
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">看清数字，完整复现</h2>
              <p className="mt-4 leading-7 text-slate-500">
                数字会短暂显示，隐藏后请在输入框中完整输入。答案按字符串比较，所以 0 开头的数字也必须原样保留。
              </p>
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                开始记忆
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startDigits}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="位"
              description={`展示约 ${Math.round(getNumberDisplayDuration(startDigits) / 100) / 10} 秒。`}
              onChange={setStartDigits}
            />
          </section>
        ) : (
          <section className="panel mt-6 text-center">
            <p className="eyebrow">{status === 'showing' ? 'Remember' : 'Type it back'}</p>
            {status === 'showing' ? (
              <>
                <div className="mx-auto mt-8 max-w-3xl overflow-x-auto rounded-[32px] bg-slate-950 px-6 py-10 text-center text-4xl font-black tracking-[0.18em] text-cyan-200 shadow-2xl shadow-slate-200 sm:text-6xl">
                  {targetNumber}
                </div>
                <p className="mt-5 text-sm font-bold text-slate-500">数字即将隐藏，请集中注意力。</p>
              </>
            ) : (
              <form className="mx-auto mt-8 max-w-xl" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  className="w-full rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-center text-3xl font-black tracking-[0.16em] text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value.replace(/\D/g, ''))}
                  placeholder="输入刚才的数字"
                />
                <button className="btn-primary mx-auto mt-5" type="submit">
                  提交答案
                </button>
                {status === 'success' ? <p className="status-pill success mx-auto mt-4">正确，进入下一位数</p> : null}
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
