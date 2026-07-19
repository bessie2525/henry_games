import type { PointCategoryId } from '@/types/points'

export type PointCategory = {
  id: PointCategoryId
  name: string
  description: string
  suggestedRange: string
}

export const pointCategories: PointCategory[] = [
  {
    id: 'math',
    name: '数学',
    description: '计算小超市，每天最少 1 页，最多 3 页。所有题目全对积 1 颗星。',
    suggestedRange: '建议 0-3 颗星',
  },
  {
    id: 'english',
    name: '英语',
    description: '每天读英语 30 分钟，抄写 10 个不会的单词，积 1 颗星；背诵 10 个不会的单词，积 2 颗星。',
    suggestedRange: '建议 0-3 颗星',
  },
  {
    id: 'english_challenge',
    name: '英语闯关',
    description: '完成管理员发布的每日英语单词闯关任务，自动积 2 颗星。',
    suggestedRange: '系统自动 2 颗星',
  },
  {
    id: 'reading',
    name: '读书',
    description: '每天读书 45 分钟，写一句读后感，积 1 颗星；每多读 30 分钟，多积 1 颗星。',
    suggestedRange: '建议 0-10 颗星',
  },
  {
    id: 'writing',
    name: '作文',
    description: '每写 1 篇作文，积 10 颗星。',
    suggestedRange: '建议 10 的倍数',
  },
  {
    id: 'housework',
    name: '家务',
    description: '洗内裤 1 颗星、洗袜子 1 颗星、洗碗 1 颗星，其他由爷爷奶奶姥姥姥爷酌情发星。',
    suggestedRange: '建议 0-10 颗星',
  },
  {
    id: 'other',
    name: '其他',
    description: '由学生填写具体内容。',
    suggestedRange: '建议 0-100 颗星',
  },
]

export const pointCategoryMap = Object.fromEntries(pointCategories.map((category) => [category.id, category])) as Record<
  PointCategoryId,
  PointCategory
>
