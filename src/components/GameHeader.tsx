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
    <header className="flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/75 p-3 shadow-sm shadow-slate-200/70 backdrop-blur sm:rounded-[30px] sm:p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Link
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-white transition hover:-translate-y-0.5 hover:bg-cyan-600 sm:h-11 sm:w-11"
          to="/"
          aria-label="返回首页"
        >
          <Home size={18} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600 sm:text-xs sm:tracking-[0.28em]">
            {game.shortName}
          </p>
          <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{game.name}</h1>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:min-w-80">
        <div className="rounded-2xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-xs font-semibold text-slate-400">当前进度</p>
          <p className="mt-1 text-sm font-black text-slate-900 sm:text-base">{currentLabel}</p>
        </div>
        <div className="rounded-2xl bg-cyan-50 px-3 py-2 sm:px-4 sm:py-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-cyan-700">
            <Trophy size={14} />
            {game.bestScoreLabel}
          </p>
          <p className="mt-1 text-sm font-black text-slate-900 sm:text-base">{formatBestScore(game.id, bestScore)}</p>
        </div>
      </div>
    </header>
  )
}
