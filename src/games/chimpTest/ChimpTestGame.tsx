import { useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GameModeSelector from '@/components/GameModeSelector'
import PracticeAccuracyBoard from '@/components/PracticeAccuracyBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameMode, GameResult, GameStatus } from '@/types/game'
import { generateChimpItems, levelToChimpCount, type ChimpItem } from './logic'

const game = getGameConfig('chimp-test')
const DEFAULT_PRACTICE_TOTAL = 10
const MIN_PRACTICE_TOTAL = 5
const MAX_PRACTICE_TOTAL = 50

export default function ChimpTestGame() {
  const { bestScores, saveBestScore, savePracticeAccuracy } = useBestScores()
  const [mode, setMode] = useState<GameMode>('challenge')
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [practiceTotal, setPracticeTotal] = useState(DEFAULT_PRACTICE_TOTAL)
  const [practiceQuestion, setPracticeQuestion] = useState(1)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [status, setStatus] = useState<GameStatus>('intro')
  const [items, setItems] = useState<ChimpItem[]>([])
  const [nextExpected, setNextExpected] = useState(1)
  const [clickedValues, setClickedValues] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)
  const practiceScores =
    bestScores[game.id]?.practiceBestAccuracyByQuestionCount?.[practiceTotal] ??
    (practiceTotal === DEFAULT_PRACTICE_TOTAL ? bestScores[game.id]?.practiceBestAccuracyByLevel : undefined)
  const currentPracticeBest = Math.round(practiceScores?.[startLevel] ?? 0)

  const initRound = (level: number, resetPractice = false) => {
    setCurrentLevel(level)
    setItems(generateChimpItems(levelToChimpCount(level)))
    setNextExpected(1)
    setClickedValues([])
    setHidden(false)
    setResult(null)
    setStatus('input')

    if (resetPractice) {
      setPracticeQuestion(1)
      setPracticeCorrect(0)
    }
  }

  const startGame = () => {
    initRound(startLevel, true)
  }

  const finishPractice = (correctCount: number) => {
    const accuracy = (correctCount / practiceTotal) * 100
    const isNewBest = savePracticeAccuracy(game.id, startLevel, practiceTotal, accuracy)

    setResult({
      gameId: game.id,
      title: '固定难度练习完成',
      bestLevel: startLevel,
      score: correctCount,
      accuracy,
      detail: `第 ${startLevel} 关，连续完成 ${practiceTotal} 题，答对 ${correctCount} 题。当前题数下该难度历史最高正确率：${Math.round(
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
    window.setTimeout(() => initRound(startLevel), 650)
  }

  const failRound = (detail: string) => {
    if (mode === 'practice') {
      completePracticeQuestion(false)
      return
    }

    const score = levelToChimpCount(currentLevel)
    const candidate = {
      gameId: game.id,
      bestLevel: currentLevel,
      bestScore: score,
      updatedAt: Date.now(),
    }
    const isNewBest = saveBestScore(candidate)
    setResult({
      gameId: game.id,
      title: '本轮结束',
      bestLevel: currentLevel,
      score,
      detail,
      isNewBest,
    })
    setStatus('result')
  }

  const passRound = () => {
    if (mode === 'practice') {
      completePracticeQuestion(true)
      return
    }

    if (currentLevel >= game.maxStartLevel) {
      failRound('你已经完成黑猩猩测试的最高难度。')
      return
    }

    setStatus('success')
    window.setTimeout(() => initRound(currentLevel + 1), 650)
  }

  const handleItemClick = (item: ChimpItem) => {
    if (status !== 'input') {
      return
    }

    if (item.value !== nextExpected) {
      failRound(`你点击了 ${item.value}，当前应该点击 ${nextExpected}。`)
      return
    }

    if (item.value === 1) {
      setHidden(true)
    }

    setClickedValues((values) => [...values, item.value])

    if (item.value === items.length) {
      passRound()
      return
    }

    setNextExpected((value) => value + 1)
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-4 md:py-8">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={
            status === 'intro'
              ? '尚未开始'
              : mode === 'practice'
                ? `第 ${currentLevel} 关 · ${practiceQuestion}/${practiceTotal}`
                : `第 ${currentLevel} 关`
          }
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">记住位置，按顺序点击</h2>
              <p className="mt-4 leading-7 text-slate-500">
                数字会随机落在对齐的训练格点上。点击 1 后，其余数字会被隐藏成方块，你需要依靠空间记忆继续按顺序点击。
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
                    suffix="关"
                    questionCount={practiceTotal}
                    scores={practiceScores}
                  />
                </>
              ) : null}
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                {mode === 'practice' ? `开始 ${practiceTotal} 题练习` : '开始挑战'}
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLevel}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="关"
              description={
                mode === 'practice'
                  ? `固定第 ${startLevel} 关，做 ${practiceTotal} 题。当前题数最高正确率：${currentPracticeBest}%。`
                  : `本关会出现 ${levelToChimpCount(startLevel)} 个数字。`
              }
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="mt-4 sm:mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
              <p className="text-sm font-bold text-slate-500">
                下一步：点击 <span className="text-cyan-700">{nextExpected}</span>
              </p>
              {status === 'success' ? (
                <p className="status-pill success">{mode === 'practice' ? '本题正确，进入下一题' : '通过，进入下一关'}</p>
              ) : null}
              {status === 'failed' ? <p className="status-pill">本题错误，进入下一题</p> : null}
            </div>
            <div className="relative h-[min(62vh,520px)] min-h-[340px] overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200 sm:min-h-[420px] sm:rounded-[36px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.24),transparent_30%)]" />
              <div className="absolute inset-3 rounded-[20px] border border-white/10 bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:20%_25%] sm:inset-4 sm:rounded-[28px]" />
              {items.map((item) => (
                <button
                  key={item.value}
                  className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border border-cyan-200/60 bg-white text-lg font-black text-slate-950 shadow-xl shadow-cyan-950/20 transition hover:scale-105 disabled:opacity-25 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-xl md:h-16 md:w-16 md:text-2xl"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  type="button"
                  disabled={clickedValues.includes(item.value)}
                  onClick={() => handleItemClick(item)}
                >
                  {hidden && !clickedValues.includes(item.value) ? '' : item.value}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {result ? (
        <ResultModal result={result} onReplay={startGame} onAdjust={() => setStatus('intro')} />
      ) : null}
    </main>
  )
}
