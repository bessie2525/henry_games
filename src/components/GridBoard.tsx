import { cn } from '@/lib/utils'

type GridBoardProps = {
  cells: number
  columns: number
  activeCells?: number[]
  selectedCells?: number[]
  disabled?: boolean
  labels?: Record<number, string>
  hiddenLabels?: boolean
  className?: string
  cellClassName?: string
  onCellClick?: (cell: number) => void
}

export default function GridBoard({
  cells,
  columns,
  activeCells = [],
  selectedCells = [],
  disabled = false,
  labels = {},
  hiddenLabels = false,
  className,
  cellClassName,
  onCellClick,
}: GridBoardProps) {
  return (
    <div
      className={cn('mx-auto grid w-full max-w-[min(82vh,620px)] gap-3', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }, (_, cell) => {
        const isActive = activeCells.includes(cell)
        const isSelected = selectedCells.includes(cell)
        const label = labels[cell]

        return (
          <button
            key={cell}
            className={cn(
              'aspect-square min-h-11 rounded-2xl border text-lg font-black transition duration-150',
              'focus:outline-none focus:ring-4 focus:ring-cyan-100',
              isActive
                ? 'scale-[1.03] border-cyan-300 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-100'
                : 'border-slate-200 bg-white text-slate-900',
              isSelected ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : '',
              disabled ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5 hover:border-cyan-300',
              cellClassName,
            )}
            type="button"
            disabled={disabled}
            onClick={() => onCellClick?.(cell)}
            aria-label={label ? `格子 ${label}` : `格子 ${cell + 1}`}
          >
            {label && !hiddenLabels ? label : ''}
          </button>
        )
      })}
    </div>
  )
}
