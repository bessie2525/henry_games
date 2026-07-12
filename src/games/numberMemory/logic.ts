import { getDisplayDuration, randomInt } from '@/utils/random'

export function generateNumberString(length: number) {
  return Array.from({ length }, () => String(randomInt(0, 9))).join('')
}

export function getNumberDisplayDuration(length: number) {
  return getDisplayDuration(length)
}
