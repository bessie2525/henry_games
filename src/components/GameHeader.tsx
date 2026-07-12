import { Link } from 'react-router-dom'
import { Home, Trophy } from 'lucide-react'
import type { BestScore, GameConfig } from '@/types/game'
import { formatBestScore } from '@/utils/storage'

type GameHeaderProps = {
  game: GameConfig
  currentLabel: string
  bestScore?: BestScore
}

export default function GameHeader({ game, currentLabel, bestScore }: GameHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-sm shadow-slate-200/70 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Link
          className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white transition hover:-translate-y-0.5 hover:bg-cyan-600"
          to="/"
          aria-label="返回首页"
        >
          <Home size={18} />
        </Link>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-600">{game.shortName}</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">{game.name}</h1>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:min-w-80">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-400">当前进度</p>
          <p className="mt-1 font-black text-slate-900">{currentLabel}</p>
        </div>
        <div className="rounded-2xl bg-cyan-50 px-4 py-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-cyan-700">
            <Trophy size={14} />
            {game.bestScoreLabel}
          </p>
          <p className="mt-1 font-black text-slate-900">{formatBestScore(game.id, bestScore)}</p>
        </div>
      </div>
    </header>
  )
}
