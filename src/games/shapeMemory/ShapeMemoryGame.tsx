import { useEffect, useMemo, useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GameModeSelector from '@/components/GameModeSelector'
import PracticeAccuracyBoard from '@/components/PracticeAccuracyBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameMode, GameResult, GameStatus } from '@/types/game'
import { generateShapeRound, getShapeLabel, getShapeLevelConfig } from './logic'
import ShapeTile from './ShapeTile'
import type { ShapeItem, ShapeLevelConfig } from './types'

const game = getGameConfig('shape-memory')
const DEFAULT_PRACTICE_TOTAL = 10
const MIN_PRACTICE_TOTAL = 5
const MAX_PRACTICE_TOTAL = 50

export default function ShapeMemoryGame() {
  const { bestScores, saveBestScore, savePracticeAccuracy } = useBestScores()
  const [mode, setMode] = useState<GameMode>('challenge')
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [bestPassed, setBestPassed] = useState(0)
  const [practiceTotal, setPracticeTotal] = useState(DEFAULT_PRACTICE_TOTAL)
  const [practiceQuestion, setPracticeQuestion] = useState(1)
  const [practiceCorrect, setPracticeCorrect] = useState(0)
  const [targets, setTargets] = useState<ShapeItem[]>([])
  const [candidates, setCandidates] = useState<ShapeItem[]>([])
  const [levelConfig, setLevelConfig] = useState<ShapeLevelConfig>(() => getShapeLevelConfig(startLevel))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [status, setStatus] = useState<GameStatus>('intro')
  const [result, setResult] = useState<GameResult | null>(null)

  const targetIds = useMemo(() => new Set(targets.map((target) => target.id)), [targets])
  const practiceScores =
    bestScores[game.id]?.practiceBestAccuracyByQuestionCount?.[practiceTotal] ??
    (practiceTotal === DEFAULT_PRACTICE_TOTAL ? bestScores[game.id]?.practiceBestAccuracyByLevel : undefined)
  const currentPracticeBest = Math.round(practiceScores?.[startLevel] ?? 0)

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
    window.setTimeout(() => startRound(startLevel), 750)
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
    if (mode === 'practice') {
      completePracticeQuestion(false)
      return
    }

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
    if (mode === 'practice') {
      completePracticeQuestion(true)
      return
    }

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
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">记住图形，再找出它们</h2>
              <p className="mt-4 leading-7 text-slate-500">
                系统会短暂展示一组颜色、形状和纹理组合。隐藏后，请从候选项中选出所有出现过的图形，点到干扰项会立即失败。
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
                {mode === 'practice' ? `开始 ${practiceTotal} 题练习` : '开始记忆'}
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
                  : `本关 ${getShapeLevelConfig(startLevel).targetCount} 个目标，${getShapeLevelConfig(startLevel).candidateCount} 个候选。`
              }
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
              {status === 'success' ? (
                <p className="status-pill success">{mode === 'practice' ? '本题正确，进入下一题' : '全部正确，进入下一关'}</p>
              ) : null}
              {status === 'failed' ? <p className="status-pill">本题错误，进入下一题</p> : null}
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
