import { useEffect, useMemo, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameResult, GameStatus } from '@/types/game'
import { generateShapeRound, getShapeLabel, getShapeLevelConfig } from './logic'
import ShapeTile from './ShapeTile'
import type { ShapeItem, ShapeLevelConfig } from './types'

const game = getGameConfig('shape-memory')

export default function ShapeMemoryGame() {
  const { bestScores, saveBestScore } = useBestScores()
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [bestPassed, setBestPassed] = useState(0)
  const [targets, setTargets] = useState<ShapeItem[]>([])
  const [candidates, setCandidates] = useState<ShapeItem[]>([])
  const [levelConfig, setLevelConfig] = useState<ShapeLevelConfig>(() => getShapeLevelConfig(startLevel))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)

  const targetIds = useMemo(() => new Set(targets.map((target) => target.id)), [targets])

  const startRound = (level: number, resetScore = false) => {
    const round = generateShapeRound(level)
    setCurrentLevel(level)
    setTargets(round.targets)
    setCandidates(round.candidates)
    setLevelConfig(round.config)
    setSelectedIds([])
    setResult(null)
    setStatus('showing')

    if (resetScore) {
      setBestPassed(0)
    }
  }

  const startGame = () => {
    startRound(startLevel, true)
  }

  const saveResult = (level: number, score: number) => {
    return saveBestScore({
      gameId: game.id,
      bestLevel: level,
      bestScore: score,
      updatedAt: Date.now(),
    })
  }

  const failRound = (detail: string, wrongItem?: ShapeItem) => {
    const score = bestPassed > 0 ? getShapeLevelConfig(bestPassed).targetCount : 0
    const isNewBest = bestPassed > 0 ? saveResult(bestPassed, score) : false
    const correctShapes = targets.map(getShapeLabel).join('、')

    setResult({
      gameId: game.id,
      title: '图形识别失败',
      bestLevel: bestPassed,
      score,
      detail,
      answer: correctShapes,
      userAnswer: wrongItem ? getShapeLabel(wrongItem) : undefined,
      isNewBest,
    })
    setStatus('result')
  }

  const passRound = () => {
    const nextBest = Math.max(bestPassed, currentLevel)
    setBestPassed(nextBest)

    if (currentLevel >= game.maxStartLevel) {
      const isNewBest = saveResult(nextBest, levelConfig.targetCount)
      setResult({
        gameId: game.id,
        title: '你完成了图形记忆最高难度',
        bestLevel: nextBest,
        score: levelConfig.targetCount,
        detail: '已经到达图形记忆的最高可选关卡。',
        isNewBest,
      })
      setStatus('result')
      return
    }

    setStatus('success')
    window.setTimeout(() => startRound(currentLevel + 1), 750)
  }

  const handleCandidateClick = (item: ShapeItem) => {
    if (status !== 'input' || selectedIds.includes(item.id)) {
      return
    }

    if (!targetIds.has(item.id)) {
      failRound('你选中了一个没有出现过的干扰图形。', item)
      return
    }

    const nextSelected = [...selectedIds, item.id]
    setSelectedIds(nextSelected)

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
              <h2 className="section-title">记住图形，再找出它们</h2>
              <p className="mt-4 leading-7 text-slate-500">
                系统会短暂展示一组颜色、形状和纹理组合。隐藏后，请从候选项中选出所有出现过的图形，点到干扰项会立即失败。
              </p>
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                开始记忆
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLevel}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="关"
              description={`本关 ${getShapeLevelConfig(startLevel).targetCount} 个目标，${getShapeLevelConfig(startLevel).candidateCount} 个候选。`}
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="panel mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-slate-600">
                {status === 'showing'
                  ? `观察 ${targets.length} 个目标图形`
                  : `已选中：${selectedIds.length}/${targets.length}`}
              </p>
              {status === 'success' ? <p className="status-pill success">全部正确，进入下一关</p> : null}
            </div>

            {status === 'showing' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {targets.map((item) => (
                  <ShapeTile key={item.id} item={item} disabled />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map((item) => (
                  <ShapeTile
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    disabled={status !== 'input' || selectedIds.includes(item.id)}
                    onClick={() => handleCandidateClick(item)}
                  />
                ))}
              </div>
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
