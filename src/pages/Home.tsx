import { Activity, ArrowDown, Sparkles, Trophy } from 'lucide-react'
import GameCard from '@/components/GameCard'
import { games } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import { formatBestScore } from '@/utils/storage'

export default function Home() {
  const { bestScores } = useBestScores()

  return (
    <main className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-sm shadow-slate-200/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-cyan-200">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600">Cognitive Lab</p>
              <h1 className="text-xl font-black tracking-tight text-slate-950">认知训练小游戏</h1>
            </div>
          </div>
          <a className="btn-secondary justify-center" href="#games">
            查看游戏
            <ArrowDown size={17} />
          </a>
        </nav>

        <section className="relative overflow-hidden rounded-[44px] px-6 py-14 md:px-10 md:py-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.18),transparent_26%)]" />
          <div className="max-w-3xl">
            <p className="eyebrow">1 到 3 分钟的注意力训练</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-slate-950 md:text-7xl">
              把记忆力和反应力练成手感。
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              小游戏覆盖数字记忆、序列复现、空间定位和视觉搜索。每个游戏都能选择起始难度，适合快速热身，也适合直接挑战高阶关卡。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="btn-primary" href="#games">
                <Sparkles size={18} />
                开始训练
              </a>
              <a className="btn-secondary" href="#scores">
                <Trophy size={18} />
                查看最佳
              </a>
            </div>
          </div>
        </section>

        <section id="scores" className="grid gap-3 md:grid-cols-4">
          {games.map((game) => (
            <div key={game.id} className="rounded-[26px] border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
              <p className="text-sm font-bold text-slate-500">{game.name}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{formatBestScore(game.id, bestScores[game.id])}</p>
            </div>
          ))}
        </section>

        <section id="games" className="mt-8 grid gap-5 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} bestScore={bestScores[game.id]} />
          ))}
        </section>
      </div>
    </main>
  )
}
