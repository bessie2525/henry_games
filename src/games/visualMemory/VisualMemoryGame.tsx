import { useEffect, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GridBoard from '@/components/GridBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameResult, GameStatus } from '@/types/game'
import { generateVisualTargets, getVisualLevelConfig, type VisualLevelConfig } from './logic'

const game = getGameConfig('visual-memory')

export default function VisualMemoryGame() {
  const { bestScores, saveBestScore } = useBestScores()
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [bestPassed, setBestPassed] = useState(0)
  const [levelConfig, setLevelConfig] = useState<VisualLevelConfig>(() => getVisualLevelConfig(startLevel))
  const [targets, setTargets] = useState<number[]>([])
  const [selectedCells, setSelectedCells] = useState<number[]>([])
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)

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
    }
  }

  const startGame = () => {
    startRound(startLevel, true)
  }

  const finishGame = (detail: string) => {
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
    <main className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={status === 'intro' ? '尚未开始' : `第 ${currentLevel} 关`}
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">记住亮起的目标格子</h2>
              <p className="mt-4 leading-7 text-slate-500">
                目标格子会短暂高亮，隐藏后请找回所有目标。只要点击非目标格子，本轮就会结束。
              </p>
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                开始观察
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLevel}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="关"
              description={`本关约 ${getVisualLevelConfig(startLevel).rows}x${getVisualLevelConfig(startLevel).cols} 网格。`}
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="panel mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-slate-600">
                {status === 'showing'
                  ? `观察 ${targets.length} 个目标格子`
                  : `已找回：${selectedCells.length}/${targets.length}`}
              </p>
              {status === 'success' ? <p className="status-pill success">全部找回，进入下一关</p> : null}
            </div>
            <GridBoard
              cells={levelConfig.rows * levelConfig.cols}
              columns={levelConfig.cols}
              activeCells={status === 'showing' ? targets : []}
              selectedCells={selectedCells}
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
