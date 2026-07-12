import { pickUniqueNumbers } from '@/utils/random'

export type ChimpItem = {
  value: number
  x: number
  y: number
  cell: number
}

const CHIMP_GRID_COLUMNS = 5
const CHIMP_GRID_ROWS = 4
const CHIMP_GRID_CELLS = CHIMP_GRID_COLUMNS * CHIMP_GRID_ROWS

export function levelToChimpCount(level: number) {
  return level + 3
}

export function generateChimpItems(count: number): ChimpItem[] {
  const cells = pickUniqueNumbers(count, CHIMP_GRID_CELLS)

  return cells.map((cell, index) => {
    const column = cell % CHIMP_GRID_COLUMNS
    const row = Math.floor(cell / CHIMP_GRID_COLUMNS)

    return {
      value: index + 1,
      cell,
      x: ((column + 0.5) / CHIMP_GRID_COLUMNS) * 100,
      y: ((row + 0.5) / CHIMP_GRID_ROWS) * 100,
    }
  })
}
