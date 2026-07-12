import { Link } from 'react-router-dom'
import { ArrowUpRight, Brain, Gem, Grid3X3, Hash, MousePointer2, Repeat2 } from 'lucide-react'
import type { BestScore, GameConfig } from '@/types/game'
import { formatBestScore } from '@/utils/storage'

type GameCardProps = {
  game: GameConfig
  bestScore?: BestScore
}

const iconMap = {
  'chimp-test': MousePointer2,
  'number-memory': Hash,
  'sequential-memory': Grid3X3,
  'visual-memory': Brain,
  'shape-memory': Gem,
  'n-back': Repeat2,
}

export default function GameCard({ game, bestScore }: GameCardProps) {
  const Icon = iconMap[game.id]

  return (
    <Link
      className="group relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100"
      to={game.route}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-100 opacity-0 blur-2xl transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-cyan-200 shadow-lg shadow-slate-200">
          <Icon size={26} />
        </div>
        <ArrowUpRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-500" />
      </div>
      <div className="relative mt-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600">{game.shortName}</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{game.name}</h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{game.description}</p>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2">
        {game.abilityTags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {tag}
          </span>
        ))}
      </div>
      <div className="relative mt-6 rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold text-slate-400">{game.bestScoreLabel}</p>
        <p className="mt-1 text-lg font-black text-slate-900">{formatBestScore(game.id, bestScore)}</p>
      </div>
    </Link>
  )
}
