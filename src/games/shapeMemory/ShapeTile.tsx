import { cn } from '@/lib/utils'
import type { ShapeColor, ShapeItem } from './types'
import { getShapeLabel } from './logic'

type ShapeTileProps = {
  item: ShapeItem
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  onClick?: () => void
}

const colorMap: Record<ShapeColor, string> = {
  red: '#ef4444',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  purple: '#9333ea',
  orange: '#f97316',
}

function getClipPath(shape: ShapeItem['shape']) {
  if (shape === 'circle') return 'circle(50% at 50% 50%)'
  if (shape === 'triangle') return 'polygon(50% 5%, 96% 92%, 4% 92%)'
  if (shape === 'star') {
    return 'polygon(50% 4%, 61% 36%, 95% 36%, 68% 56%, 79% 90%, 50% 70%, 21% 90%, 32% 56%, 5% 36%, 39% 36%)'
  }
  if (shape === 'diamond') return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
  if (shape === 'hexagon') return 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)'
  return 'inset(0 round 16%)'
}

function getPatternStyle(item: ShapeItem) {
  const color = colorMap[item.color]

  if (item.pattern === 'outline') {
    return {
      background: 'transparent',
      border: `8px solid ${color}`,
    }
  }

  if (item.pattern === 'striped') {
    return {
      background: `repeating-linear-gradient(135deg, ${color} 0 10px, rgba(255,255,255,0.78) 10px 18px)`,
    }
  }

  if (item.pattern === 'dotted') {
    return {
      background: `radial-gradient(circle, rgba(255,255,255,0.85) 0 20%, transparent 21%), ${color}`,
      backgroundSize: '16px 16px',
    }
  }

  return { background: color }
}

export default function ShapeTile({ item, selected = false, disabled = false, compact = false, onClick }: ShapeTileProps) {
  const shapeStyle = {
    ...getPatternStyle(item),
    clipPath: getClipPath(item.shape),
  }

  return (
    <button
      className={cn(
        'group grid min-h-24 place-items-center rounded-2xl border bg-white p-3 shadow-sm shadow-slate-200 transition sm:min-h-28 sm:rounded-[28px] sm:p-4',
        selected ? 'border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200',
        disabled ? 'cursor-default' : 'hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100',
        compact ? 'min-h-20 sm:min-h-24' : '',
      )}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={getShapeLabel(item)}
    >
      <span
        className={cn('block h-12 w-12 transition group-hover:scale-105 sm:h-16 sm:w-16', compact ? 'h-10 w-10 sm:h-14 sm:w-14' : '')}
        style={shapeStyle}
      />
      <span className="sr-only">{getShapeLabel(item)}</span>
    </button>
  )
}
