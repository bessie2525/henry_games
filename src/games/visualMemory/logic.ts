import { pickUniqueNumbers } from '@/utils/random'

export type VisualLevelConfig = {
  rows: number
  cols: number
  targetCount: number
  previewDuration: number
}

export function getVisualLevelConfig(level: number): VisualLevelConfig {
  if (level <= 3) {
    return { rows: 3, cols: 3, targetCount: Math.min(4, level + 2), previewDuration: 1600 }
  }

  if (level <= 7) {
    return { rows: 4, cols: 4, targetCount: Math.min(6, level), previewDuration: 1500 }
  }

  if (level <= 12) {
    return { rows: 5, cols: 5, targetCount: Math.min(8, level - 2), previewDuration: 1400 }
  }

  return { rows: 6, cols: 6, targetCount: Math.min(12, level - 5), previewDuration: 1300 }
}

export function generateVisualTargets(level: number) {
  const config = getVisualLevelConfig(level)
  return {
    config,
    targets: pickUniqueNumbers(config.targetCount, config.rows * config.cols),
  }
}
