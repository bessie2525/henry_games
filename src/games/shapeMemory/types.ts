export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon'
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'
export type ShapePattern = 'solid' | 'outline' | 'striped' | 'dotted'

export type ShapeItem = {
  id: string
  shape: ShapeType
  color: ShapeColor
  pattern: ShapePattern
}

export type ShapeLevelConfig = {
  targetCount: number
  candidateCount: number
  previewDuration: number
  shapePoolSize: number
  colorPoolSize: number
  usePattern: boolean
}
