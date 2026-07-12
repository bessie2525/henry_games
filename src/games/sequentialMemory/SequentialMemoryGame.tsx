import { useEffect, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GameModeSelector from '@/components/GameModeSelector'
import GridBoard from '@/components/GridBoard'
import PracticeAccuracyBoard from '@/components/PracticeAccuracyBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameMode, GameResult, GameStatus } from '@/types/game'
import { generateSequence, SEQUENCE_HIGHLIGHT_DURATION, SEQUENCE_HIGHLIGHT_GAP } from './logic'

const game = getGameConfig('sequential-memory')
const DEFAULT_PRACTICE_TOTAL = 10
const MIN_PRACTICE_TOTAL = 5
const MAX_PRACTICE_TOTAL = 50

export default function SequentialMemoryGame() {
  const { bestScores, saveBestScore, savePracticeAccuracy } = useBestScores()
  const [mode, setMode] = useState<GameMode>('challenge')
  const [startLength, setStartLength] = useState(game.defaultStartLevel)
  const [currentLength, setCurrentLength] = useState(startLength)
  const [bestPassed, setBestPassed] = useState(0)
  const [practiceTotal, setPracticeTotal] = useState(DEFAULT_PRACTICE_TOTAL)
  const [practiceQuestion, setPracticeQuestion] = useState(1)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)
  const practiceScores =
    bestScores[game.id]?.practiceBestAccuracyByQuestionCount?.[practiceTotal] ??
    (practiceTotal === DEFAULT_PRACTICE_TOTAL ? bestScores[game.id]?.practiceBestAccuracyByLevel : undefined)
  const currentPracticeBest = Math.round(practiceScores?.[startLength] ?? 0)

  const startRound = (length: number, resetScore = false) => {
    setCurrentLength(length)
    setSequence(generateSequence(length))
    setActiveCell(null)
    setInputIndex(0)
    setResult(null)
    setStatus('showing')

    if (resetScore) {
      setBestPassed(0)
      setPracticeQuestion(1)
      setPracticeCorrect(0)
    }
  }

  const startGame = () => {
    startRound(startLength, true)
  }

  const finishPractice = (correctCount: number) => {
    const accuracy = (correctCount / practiceTotal) * 100
    const isNewBest = savePracticeAccuracy(game.id, startLength, practiceTotal, accuracy)

    setResult({
      gameId: game.id,
      title: '固定难度练习完成',
      bestLevel: startLength,
      score: correctCount,
      accuracy,
      detail: `${startLength} 步序列，连续完成 ${practiceTotal} 题，答对 ${correctCount} 题。当前题数下该难度历史最高正确率：${Math.round(
        Math.max(currentPracticeBest, accuracy),
      )}%。`,
      bestLevelLabel: '练习难度',
      scoreLabel: '答对题数',
      isNewBest,
    })
    setStatus('result')
  }

  const completePracticeQuestion = (isCorrect: boolean) => {
    const nextCorrect = practiceCorrect + (isCorrect ? 1 : 0)

    if (practiceQuestion >= practiceTotal) {
      finishPractice(nextCorrect)
      return
    }

    setPracticeCorrect(nextCorrect)
    setPracticeQuestion((value) => value + 1)
    setStatus(isCorrect ? 'success' : 'failed')
    window.setTimeout(() => startRound(startLength), 700)
  }

  const finishGame = (detail: string) => {
    if (mode === 'practice') {
      completePracticeQuestion(false)
      return
    }

    const candidate = {
      gameId: game.id,
      bestLevel: bestPassed,
      bestScore: bestPassed,
      updatedAt: Date.now(),
    }
    const isNewBest = bestPassed > 0 ? saveBestScore(candidate) : false
    setResult({
      gameId: game.id,
      title: '序列复现失败',
      bestLevel: bestPassed,
      score: bestPassed,
      detail,
      isNewBest,
    })
    setStatus('result')
  }

  const handleCellClick = (cell: number) => {
    if (status !== 'input') {
      return
    }

    if (sequence[inputIndex] !== cell) {
      finishGame(`第 ${inputIndex + 1} 步点错了，请留意亮灯顺序。`)
      return
    }

    if (inputIndex === sequence.length - 1) {
      if (mode === 'practice') {
        completePracticeQuestion(true)
        return
      }

      const nextBest = Math.max(bestPassed, currentLength)
      setBestPassed(nextBest)

      if (currentLength >= game.maxStartLevel) {
        const candidate = {
          gameId: game.id,
          bestLevel: nextBest,
          bestScore: nextBest,
          updatedAt: Date.now(),
        }
        const isNewBest = saveBestScore(candidate)
        setResult({
          gameId: game.id,
          title: '你完成了最高序列长度',
          bestLevel: nextBest,
          score: nextBest,
          detail: '已经到达序列记忆的最高可选难度。',
          isNewBest,
        })
        setStatus('result')
        return
      }

      setStatus('success')
      window.setTimeout(() => startRound(currentLength + 1), 700)
      return
    }

    setInputIndex((value) => value + 1)
  }

  useEffect(() => {
    if (status !== 'showing' || sequence.length === 0) {
      return undefined
    }

    let step = 0
    const timers: number[] = []

    const playStep = () => {
      setActiveCell(sequence[step])
      timers.push(
        window.setTimeout(() => {
          setActiveCell(null)
          step += 1

          if (step >= sequence.length) {
            timers.push(window.setTimeout(() => setStatus('input'), SEQUENCE_HIGHLIGHT_GAP))
            return
          }

          timers.push(window.setTimeout(playStep, SEQUENCE_HIGHLIGHT_GAP))
        }, SEQUENCE_HIGHLIGHT_DURATION),
      )
    }

    timers.push(window.setTimeout(playStep, 350))

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [sequence, status])

  return (
    <main className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={
            status === 'intro'
              ? '尚未开始'
              : mode === 'practice'
                ? `${currentLength} 步 · ${practiceQuestion}/${practiceTotal}`
                : `${currentLength} 步序列`
          }
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">看亮灯顺序，再复现</h2>
              <p className="mt-4 leading-7 text-slate-500">
                九宫格会依次亮起，同一个格子可能重复出现。播放期间无法点击，播放结束后请按同样顺序点击。
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
                    suffix="步"
                    questionCount={practiceTotal}
                    scores={practiceScores}
                  />
                </>
              ) : null}
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                {mode === 'practice' ? `开始 ${practiceTotal} 题练习` : '开始播放'}
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLength}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="步"
              description={
                mode === 'practice'
                  ? `固定 ${startLength} 步，做 ${practiceTotal} 题。当前题数最高正确率：${currentPracticeBest}%。`
                  : '起始长度越长，播放和复现压力越大。'
              }
              onChange={setStartLength}
            />
          </section>
        ) : (
          <section className="panel mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-slate-600">
                {status === 'showing' ? '正在播放序列，请观察。' : `输入进度：${inputIndex}/${sequence.length}`}
              </p>
              {status === 'success' ? (
                <p className="status-pill success">{mode === 'practice' ? '本题正确，进入下一题' : '正确，进入下一关'}</p>
              ) : null}
              {status === 'failed' ? <p className="status-pill">本题错误，进入下一题</p> : null}
            </div>
            <GridBoard
              cells={9}
              columns={3}
              activeCells={activeCell === null ? [] : [activeCell]}
              disabled={status !== 'input'}
              onCellClick={handleCellClick}
            />
          </section>
        )}
      </div>

      {result ? (
        <ResultModal result={result} onReplay={startGame} onAdjust={() => setStatus('intro')} />
      ) : null}
    </main>
  )
}
