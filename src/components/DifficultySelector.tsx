import { Minus, Plus } from 'lucide-react'
import { clamp } from '@/utils/random'

type DifficultySelectorProps = {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  description?: string
  onChange: (value: number) => void
}

export default function DifficultySelector({
  label,
  value,
  min,
  max,
  suffix = '级',
  description,
  onChange,
}: DifficultySelectorProps) {
  const updateValue = (nextValue: number) => {
    onChange(clamp(nextValue, min, max))
  }

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/70 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {value}
            <span className="ml-1 text-base font-bold text-slate-500">{suffix}</span>
          </p>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
            type="button"
            aria-label="降低难度"
            onClick={() => updateValue(value - 1)}
          >
            <Minus size={18} />
          </button>
          <input
            className="h-11 w-20 rounded-full border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(event) => updateValue(Number(event.target.value))}
            onBlur={() => updateValue(value)}
          />
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
            type="button"
            aria-label="提高难度"
            onClick={() => updateValue(value + 1)}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      <input
        className="mt-5 w-full accent-cyan-500"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => updateValue(Number(event.target.value))}
        aria-label={label}
      />
      <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </section>
  )
}
