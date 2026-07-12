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
import { generateVisualTargets, getVisualLevelConfig, type VisualLevelConfig } from './logic'

const game = getGameConfig('visual-memory')
const DEFAULT_PRACTICE_TOTAL = 10
const MIN_PRACTICE_TOTAL = 5
const MAX_PRACTICE_TOTAL = 50

export default function VisualMemoryGame() {
  const { bestScores, saveBestScore, savePracticeAccuracy } = useBestScores()
  const [mode, setMode] = useState<GameMode>('challenge')
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [bestPassed, setBestPassed] = useState(0)
  const [practiceTotal, setPracticeTotal] = useState(DEFAULT_PRACTICE_TOTAL)
  const [practiceQuestion, setPracticeQuestion] = useState(1)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [levelConfig, setLevelConfig] = useState<VisualLevelConfig>(() => getVisualLevelConfig(startLevel))
  const [targets, setTargets] = useState<number[]>([])
  const [selectedCells, setSelectedCells] = useState<number[]>([])
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)
  const practiceScores =
    bestScores[game.id]?.practiceBestAccuracyByQuestionCount?.[practiceTotal] ??
    (practiceTotal === DEFAULT_PRACTICE_TOTAL ? bestScores[game.id]?.practiceBestAccuracyByLevel : undefined)
  const currentPracticeBest = Math.round(practiceScores?.[startLevel] ?? 0)

  const startRound = (level: number, resetScore = false) => {
    const nextRound = generateVisualTargets(level)
    setCurrentLevel(level)
    setLevelConfig(nextRound.config)
    setTargets(nextRound.targets)
    setSelectedCells([])
    setResult(null)
    setStatus('showing')

    if (resetScore) {
      setBestPassed(0)
      setPracticeQuestion(1)
      setPracticeCorrect(0)
    }
  }

  const startGame = () => {
    startRound(startLevel, true)
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
    window.setTimeout(() => startRound(startLevel), 700)
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
      title: '目标格子选择错误',
      bestLevel: bestPassed,
      score: bestPassed,
      detail,
      accuracy: targets.length ? (selectedCells.length / targets.length) * 100 : 0,
      isNewBest,
    })
    setStatus('result')
  }

  const passRound = () => {
    if (mode === 'practice') {
      completePracticeQuestion(true)
      return
    }

    const nextBest = Math.max(bestPassed, currentLevel)
    setBestPassed(nextBest)

    if (currentLevel >= game.maxStartLevel) {
      const candidate = {
        gameId: game.id,
        bestLevel: nextBest,
        bestScore: nextBest,
        updatedAt: Date.now(),
      }
      const isNewBest = saveBestScore(candidate)
      setResult({
        gameId: game.id,
        title: '你完成了视觉记忆最高难度',
        bestLevel: nextBest,
        score: nextBest,
        detail: '已经到达视觉记忆的最高可选关卡。',
        isNewBest,
      })
      setStatus('result')
      return
    }

    setStatus('success')
    window.setTimeout(() => startRound(currentLevel + 1), 700)
  }

  const handleCellClick = (cell: number) => {
    if (status !== 'input' || selectedCells.includes(cell)) {
      return
    }

    if (!targets.includes(cell)) {
      finishGame('你点击了一个没有出现过的格子。')
      return
    }

    const nextSelected = [...selectedCells, cell]
    setSelectedCells(nextSelected)

    if (nextSelected.length === targets.length) {
      passRound()
    }
  }

  useEffect(() => {
    if (status !== 'showing') {
      return undefined
    }

    const timer = window.setTimeout(() => setStatus('input'), levelConfig.previewDuration)
    return () => window.clearTimeout(timer)
  }, [levelConfig.previewDuration, status])

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
            <div className="panel p-5 sm:p-6 md:p-8">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title text-3xl sm:text-4xl">记住亮起的目标格子</h2>
              <p className="mt-4 leading-7 text-slate-500">
                目标格子会短暂高亮，隐藏后请找回所有目标。只要点击非目标格子，本轮就会结束。
              </p>
              <div className="mt-6">
                <GameModeSelector mode={mode} onChange={setMode} />
              </div>
              {mode === 'practice' ? (
                <>
                  <div className="mt-4 sm:mt-6">
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
                {mode === 'practice' ? `开始 ${practiceTotal} 题练习` : '开始观察'}
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
                  : `本关约 ${getVisualLevelConfig(startLevel).rows}x${getVisualLevelConfig(startLevel).cols} 网格。`
              }
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="panel mt-4 p-3 sm:mt-6 sm:p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-5 sm:gap-3">
              <p className="text-sm font-bold text-slate-600 sm:text-base">
                {status === 'showing'
                  ? `观察 ${targets.length} 个目标格子`
                  : `已找回：${selectedCells.length}/${targets.length}`}
              </p>
              {status === 'success' ? (
                <p className="status-pill success">{mode === 'practice' ? '本题正确，进入下一题' : '全部找回，进入下一关'}</p>
              ) : null}
              {status === 'failed' ? <p className="status-pill">本题错误，进入下一题</p> : null}
            </div>
            <GridBoard
              cells={levelConfig.rows * levelConfig.cols}
              columns={levelConfig.cols}
              activeCells={status === 'showing' ? targets : []}
              selectedCells={selectedCells}
              disabled={status !== 'input'}
              className="max-w-[min(92vw,58vh,560px)] gap-1.5 sm:gap-2.5"
              cellClassName="min-h-0 rounded-xl text-base sm:rounded-2xl sm:text-lg"
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
