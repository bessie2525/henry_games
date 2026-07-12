import type { GameMode } from '@/types/game'
import { cn } from '@/lib/utils'

type GameModeSelectorProps = {
  mode: GameMode
  onChange: (mode: GameMode) => void
}

const modeOptions: Array<{ mode: GameMode; title: string; description: string }> = [
  {
    mode: 'challenge',
    title: '闯关模式',
    description: '从所选难度开始，答对后继续挑战下一关，失败后结算最高成绩。',
  },
  {
    mode: 'practice',
    title: '固定难度练习',
    description: '选择一个固定难度和题数，完成后按正确率结算。',
  },
]

export default function GameModeSelector({ mode, onChange }: GameModeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {modeOptions.map((option) => (
        <button
          key={option.mode}
          className={cn(
            'rounded-3xl border p-4 text-left transition hover:-translate-y-0.5',
            mode === option.mode
              ? 'border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100'
              : 'border-slate-200 bg-white hover:border-cyan-200',
          )}
          type="button"
          onClick={() => onChange(option.mode)}
        >
          <p className="text-sm font-black text-slate-950">{option.title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{option.description}</p>
        </button>
      ))}
    </div>
  )
}
