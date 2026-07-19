import { Link } from 'react-router-dom'
import { Activity, ArrowDown, BookOpen, Sparkles, Star } from 'lucide-react'
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
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600">Henry Learning</p>
              <h1 className="text-xl font-black tracking-tight text-slate-950">学习中心</h1>
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

        <section className="relative overflow-hidden rounded-[44px] px-6 py-10 md:px-10 md:py-14">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.18),transparent_26%)]" />
          <div className="max-w-3xl">
            <p className="eyebrow">Choose A Module</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              选择今天要进入的学习模块。
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              首页先分成三个入口：认知训练小游戏、英语单词闯关和学生积分系统。进入对应模块后再处理具体任务。
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a className="group rounded-[32px] border border-cyan-100 bg-white/90 p-5 shadow-sm shadow-cyan-100 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-100" href="#games">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">认知训练小游戏</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">数字记忆、序列复现、空间定位、视觉搜索等训练项目。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
                进入训练
                <ArrowDown size={16} />
              </span>
            </a>
            <Link className="group rounded-[32px] border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-100 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100" to="/word-challenge">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <BookOpen size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">单词闯关</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">查看每日单词任务，完成五个环节后领取英语闯关星星。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-700">进入单词闯关</span>
            </Link>
            <Link className="group rounded-[32px] border border-amber-100 bg-white/90 p-5 shadow-sm shadow-amber-100 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100" to="/points">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
                <Star size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">积分系统</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">登记每日星星，查看每天和累计积分，管理员可编辑记录。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-700">进入积分系统</span>
            </Link>
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
