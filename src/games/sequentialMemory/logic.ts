import { randomInt } from '@/utils/random'

export function generateSequence(length: number, cells = 9) {
  return Array.from({ length }, () => randomInt(0, cells - 1))
}

export const SEQUENCE_HIGHLIGHT_DURATION = 500
export const SEQUENCE_HIGHLIGHT_GAP = 180
