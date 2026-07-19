export type WordChallengeWord = {
  word: string
  phonetic: string
  meaning: string
  example: string
}

export type WordChallengeTask = {
  id: number
  taskDate: string
  title: string
  words: WordChallengeWord[]
  createdByUserId: number
  createdAt: string
  updatedAt: string
  isCompleted: boolean
  completionCount: number
  totalStudentCount: number
  completions: {
    studentUserId: number
    studentUsername: string
    completedAt: string
  }[]
}
