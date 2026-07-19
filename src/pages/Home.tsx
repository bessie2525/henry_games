import { Link } from 'react-router-dom'
import { Activity, ArrowDown, BookOpen, Sparkles, Star, Trophy } from 'lucide-react'
import AccountMenu from '@/components/AccountMenu'
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
          <div className="flex flex-wrap gap-2">
            <AccountMenu />
            <a className="btn-secondary justify-center" href="#games">
              查看游戏
              <ArrowDown size={17} />
            </a>
          </div>
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

        <section
          id="scores"
          className="rounded-[30px] border border-cyan-100/90 bg-cyan-50/80 p-4 shadow-sm shadow-cyan-100/70 backdrop-blur sm:p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Best Records</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">排行榜</h2>
            </div>
            <p className="text-xs font-semibold text-slate-400">云端同步最高记录</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {games.map((game) => (
              <div key={game.id} className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2.5 shadow-sm shadow-cyan-100/40">
                <p className="truncate text-xs font-bold text-slate-500">{game.name}</p>
                <p className="mt-1 truncate text-base font-black text-slate-950">{formatBestScore(game.id, bestScores[game.id])}</p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-cyan-700">
                  用户：{bestScores[game.id] ? bestScores[game.id]?.username || '匿名' : '暂无用户'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[34px] border border-amber-100 bg-amber-50/85 p-4 shadow-sm shadow-amber-100/80 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
                <Star size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Student Points</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">学生积分系统</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-amber-900">
                  每日登记数学、英语、读书、作文和家务星星，学生和管理员都可以单独查看积分明细与累计总数。
                </p>
              </div>
            </div>
            <Link className="btn-primary shrink-0 bg-amber-600 shadow-amber-200 hover:bg-amber-700" to="/points">
              <Star size={18} />
              进入积分系统
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[34px] border border-blue-100 bg-blue-50/85 p-4 shadow-sm shadow-blue-100/80 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Word Challenge</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">英语单词闯关</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-blue-900">
                  学新词、选意思、字母填空、字母归位和例句填空，完成管理员发布的每日任务后自动获得英语闯关星星。
                </p>
              </div>
            </div>
            <Link className="btn-primary shrink-0 bg-blue-600 shadow-blue-200 hover:bg-blue-700" to="/word-challenge">
              <BookOpen size={18} />
              进入单词闯关
            </Link>
          </div>
        </section>

        <section id="games" className="mt-10 rounded-[34px] bg-slate-100/70 p-3 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="eyebrow">Training Games</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">选择训练项目</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {games.map((game) => (
              <GameCard key={game.id} game={game} bestScore={bestScores[game.id]} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
