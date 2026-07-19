import { Link } from 'react-router-dom'
import { Activity, BookOpen, LibraryBig, Sparkles, Star } from 'lucide-react'
import AccountMenu from '@/components/AccountMenu'

export default function Home() {
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
              首页先分成四个入口：认知训练小游戏、英语单词闯关、英语阅读小达人和学生积分系统。进入对应模块后再处理具体任务。
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link className="group rounded-[32px] border border-cyan-100 bg-white/90 p-5 shadow-sm shadow-cyan-100 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-100" to="/cognitive-games">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">认知训练小游戏</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">数字记忆、序列复现、空间定位、视觉搜索等训练项目。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-700">进入训练</span>
            </Link>
            <Link className="group rounded-[32px] border border-blue-100 bg-white/90 p-5 shadow-sm shadow-blue-100 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100" to="/word-challenge">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <BookOpen size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">单词闯关</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">查看每日单词任务，完成五个环节后领取英语闯关星星。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-700">进入单词闯关</span>
            </Link>
            <Link className="group rounded-[32px] border border-orange-100 bg-white/90 p-5 shadow-sm shadow-orange-100 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100" to="/english-reading">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-100">
                <LibraryBig size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-950">英语阅读小达人</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">每天一篇小短文，读故事、点读生词、完成阅读理解闯关。</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-orange-700">进入阅读</span>
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
      </div>
    </main>
  )
}
