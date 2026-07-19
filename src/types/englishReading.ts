export type ReadingVocabularyWord = {
  id: string
  word: string
  phonetic: string
  meaning: string
  example: string
}

export type ReadingStorySegment = {
  text: string
  vocabId?: string
}

export type ReadingQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
  paragraphHint: string
}

export type EnglishReadingArticle = {
  id: string
  title: string
  emoji: string
  level: string
  wordCount: number
  summary: string
  vocabulary: ReadingVocabularyWord[]
  paragraphs: ReadingStorySegment[][]
  questions: ReadingQuestion[]
}
