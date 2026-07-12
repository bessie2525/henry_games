import { pickUniqueNumbers } from '@/utils/random'
import type { ShapeColor, ShapeItem, ShapeLevelConfig, ShapePattern, ShapeType } from './types'

export const shapeTypes: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon']
export const shapeColors: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
export const shapePatterns: ShapePattern[] = ['solid', 'outline', 'striped', 'dotted']

export function getShapeLevelConfig(level: number): ShapeLevelConfig {
  if (level <= 3) {
    return { targetCount: 2, candidateCount: 4, shapePoolSize: 3, colorPoolSize: 3, usePattern: false, previewDuration: 2000 }
  }

  if (level <= 6) {
    return { targetCount: 3, candidateCount: 6, shapePoolSize: 4, colorPoolSize: 4, usePattern: false, previewDuration: 2000 }
  }

  if (level <= 10) {
    return { targetCount: 4, candidateCount: 8, shapePoolSize: 5, colorPoolSize: 5, usePattern: false, previewDuration: 2000 }
  }

  if (level <= 15) {
    return { targetCount: 5, candidateCount: 10, shapePoolSize: 6, colorPoolSize: 6, usePattern: true, previewDuration: 2000 }
  }

  return { targetCount: 6, candidateCount: 12, shapePoolSize: 6, colorPoolSize: 6, usePattern: true, previewDuration: 2000 }
}

function makeShapeId(shape: ShapeType, color: ShapeColor, pattern: ShapePattern) {
  return `${shape}-${color}-${pattern}`
}

function buildShapePool(config: ShapeLevelConfig): ShapeItem[] {
  const patterns = config.usePattern ? shapePatterns : (['solid'] as ShapePattern[])

  return shapeTypes.slice(0, config.shapePoolSize).flatMap((shape) =>
    shapeColors.slice(0, config.colorPoolSize).flatMap((color) =>
      patterns.map((pattern) => ({
        id: makeShapeId(shape, color, pattern),
        shape,
        color,
        pattern,
      })),
    ),
  )
}

function shuffleItems<T>(items: T[]) {
  const indexes = pickUniqueNumbers(items.length, items.length)
  return indexes.map((index) => items[index])
}

export function generateShapeRound(level: number) {
  const config = getShapeLevelConfig(level)
  const pool = buildShapePool(config)
  const targetIndexes = pickUniqueNumbers(config.targetCount, pool.length)
  const targets = targetIndexes.map((index) => pool[index])
  const targetIds = new Set(targets.map((target) => target.id))
  const distractorPool = pool.filter((item) => !targetIds.has(item.id))
  const distractors = pickUniqueNumbers(config.candidateCount - config.targetCount, distractorPool.length).map(
    (index) => distractorPool[index],
  )

  return {
    config,
    targets,
    candidates: shuffleItems([...targets, ...distractors]),
  }
}

export function getShapeLabel(item: ShapeItem) {
  const shapeLabel: Record<ShapeType, string> = {
    circle: '圆形',
    square: '方形',
    triangle: '三角形',
    star: '星形',
    diamond: '菱形',
    hexagon: '六边形',
  }
  const colorLabel: Record<ShapeColor, string> = {
    red: '红色',
    blue: '蓝色',
    green: '绿色',
    yellow: '黄色',
    purple: '紫色',
    orange: '橙色',
  }
  const patternLabel: Record<ShapePattern, string> = {
    solid: '纯色',
    outline: '空心',
    striped: '条纹',
    dotted: '点状',
  }

  return `${colorLabel[item.color]}${patternLabel[item.pattern]}${shapeLabel[item.shape]}`
}
