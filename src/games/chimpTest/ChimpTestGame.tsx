import { useState } from 'react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameResult, GameStatus } from '@/types/game'
import { generateChimpItems, levelToChimpCount, type ChimpItem } from './logic'

const game = getGameConfig('chimp-test')

export default function ChimpTestGame() {
  const { bestScores, saveBestScore } = useBestScores()
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [status, setStatus] = useState<GameStatus>('intro')
  const [items, setItems] = useState<ChimpItem[]>([])
  const [nextExpected, setNextExpected] = useState(1)
  const [clickedValues, setClickedValues] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const initRound = (level: number) => {
    setCurrentLevel(level)
    setItems(generateChimpItems(levelToChimpCount(level)))
    setNextExpected(1)
    setClickedValues([])
    setHidden(false)
    setResult(null)
    setStatus('input')
  }

  const startGame = () => {
    initRound(startLevel)
  }

  const failRound = (detail: string) => {
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
              <h2 className="section-title">记住位置，按顺序点击</h2>
              <p className="mt-4 leading-7 text-slate-500">
                数字会随机落在对齐的训练格点上。点击 1 后，其余数字会被隐藏成方块，你需要依靠空间记忆继续按顺序点击。
              </p>
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                开始挑战
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLevel}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="关"
              description={`本关会出现 ${levelToChimpCount(startLevel)} 个数字。`}
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-500">
                下一步：点击 <span className="text-cyan-700">{nextExpected}</span>
              </p>
              {status === 'success' ? <p className="status-pill success">通过，进入下一关</p> : null}
            </div>
            <div className="relative h-[58vh] min-h-[420px] overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.24),transparent_30%)]" />
              <div className="absolute inset-4 rounded-[28px] border border-white/10 bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:20%_25%]" />
              {items.map((item) => (
                <button
                  key={item.value}
                  className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-cyan-200/60 bg-white text-xl font-black text-slate-950 shadow-xl shadow-cyan-950/20 transition hover:scale-105 disabled:opacity-25 sm:h-16 sm:w-16 sm:text-2xl"
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
