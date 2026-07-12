type PracticeAccuracyBoardProps = {
  min: number
  max: number
  suffix: string
  questionCount: number
  scores?: Record<number, number>
}

export default function PracticeAccuracyBoard({ min, max, suffix, questionCount, scores = {} }: PracticeAccuracyBoardProps) {
  const levels = Array.from({ length: max - min + 1 }, (_, index) => min + index)

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-4">
      <p className="text-sm font-black text-slate-950">固定难度高分榜</p>
      <p className="mt-1 text-xs text-slate-500">当前展示 {questionCount} 题模式下，每个难度的最高正确率。</p>
      <div className="mt-4 grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {levels.map((level) => (
          <div key={level} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
            <span className="font-bold text-slate-500">
              {level}
              {suffix}
            </span>
            <span className="font-black text-slate-950">{Math.round(scores[level] ?? 0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
