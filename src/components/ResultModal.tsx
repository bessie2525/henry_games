import { Link } from 'react-router-dom'
import { RotateCcw, Settings, Sparkles } from 'lucide-react'
import type { GameResult } from '@/types/game'

type ResultModalProps = {
  result: GameResult
  onReplay: () => void
  onAdjust: () => void
}

export default function ResultModal({ result, onReplay, onAdjust }: ResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[36px] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-cyan-200">
          <Sparkles size={26} />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-cyan-600">
          {result.isNewBest ? 'New personal best' : 'Round finished'}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{result.title}</h2>
        {result.detail ? <p className="mt-3 text-sm leading-6 text-slate-500">{result.detail}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-400">最高关卡</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{result.bestLevel}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-400">得分</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{result.score}</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-4">
            <p className="text-xs font-semibold text-cyan-700">正确率</p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {result.accuracy !== undefined ? `${Math.round(result.accuracy)}%` : '100%'}
            </p>
          </div>
        </div>

        {result.answer ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-bold text-amber-900">正确答案：{result.answer}</p>
            <p className="mt-1 text-amber-800">你的输入：{result.userAnswer || '未输入'}</p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button className="btn-primary" type="button" onClick={onReplay}>
            <RotateCcw size={18} />
            再玩一次
          </button>
          <button className="btn-secondary" type="button" onClick={onAdjust}>
            <Settings size={18} />
            调整难度
          </button>
          <Link className="btn-secondary justify-center" to="/">
            返回首页
          </Link>
        </div>
      </section>
    </div>
  )
}
