export type ReadingVocabularyWord = {
  id: string
  word: string
  phonetic: string
  meaning: string
  example: string
}

export type ReadingDictionaryResult = ReadingVocabularyWord & {
  source: 'task' | 'youdao'
}

export type ReadingQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
  paragraphHint: string
}

export type EnglishReadingTask = {
  id: number
  taskDate: string
  title: string
  level: string
  wordCount: number
  summary: string
  vocabulary: ReadingVocabularyWord[]
  paragraphs: string[]
  questions: ReadingQuestion[]
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
