export type PointCategoryId = 'math' | 'english' | 'english_challenge' | 'reading' | 'writing' | 'housework' | 'other'

export type PointRecord = {
  id: number
  studentUserId: number
  studentUsername: string
  category: PointCategoryId
  stars: number
  recordDate: string
  detail: string
  note: string
  createdByUserId: number
  updatedByUserId?: number | null
  createdAt: string
  updatedAt: string
}

export type PointDailySummary = {
  recordDate: string
  byCategory: Record<PointCategoryId, number>
  totalStars: number
}

export type PointSummary = {
  dailySummaries: PointDailySummary[]
  totalStars: number
}

export type StudentOption = {
  id: number
  username: string
}
