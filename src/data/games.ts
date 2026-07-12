import type { GameConfig, GameId } from '@/types/game'

export const games: GameConfig[] = [
  {
    id: 'chimp-test',
    name: '黑猩猩测试',
    shortName: 'Chimp Test',
    route: '/games/chimp-test',
    description: '记住散落数字的位置，并按从小到大的顺序点击。',
    abilityTags: ['视觉搜索', '空间记忆', '顺序回忆'],
    defaultStartLevel: 1,
    minStartLevel: 1,
    maxStartLevel: 17,
    startLabel: '起始关卡',
    bestScoreLabel: '最高关卡',
  },
  {
    id: 'number-memory',
    name: '数字记忆',
    shortName: 'Number Memory',
    route: '/games/number-memory',
    description: '短暂记住一串越来越长的数字，然后完整输入。',
    abilityTags: ['短时记忆', '注意力', '数字编码'],
    defaultStartLevel: 3,
    minStartLevel: 3,
    maxStartLevel: 20,
    startLabel: '起始位数',
    bestScoreLabel: '最佳位数',
  },
  {
    id: 'sequential-memory',
    name: '序列记忆',
    shortName: 'Sequence',
    route: '/games/sequential-memory',
    description: '观察九宫格亮灯顺序，再按完全相同的顺序复现。',
    abilityTags: ['序列记忆', '工作记忆', '反应控制'],
    defaultStartLevel: 1,
    minStartLevel: 1,
    maxStartLevel: 30,
    startLabel: '起始长度',
    bestScoreLabel: '最长序列',
  },
  {
    id: 'visual-memory',
    name: '视觉记忆',
    shortName: 'Visual Memory',
    route: '/games/visual-memory',
    description: '记住短暂出现的目标格子，隐藏后找回全部目标。',
    abilityTags: ['视觉记忆', '空间定位', '模式识别'],
    defaultStartLevel: 1,
    minStartLevel: 1,
    maxStartLevel: 20,
    startLabel: '起始关卡',
    bestScoreLabel: '最高关卡',
  },
  {
    id: 'shape-memory',
    name: '图形记忆',
    shortName: 'Shape Memory',
    route: '/games/shape-memory',
    description: '记住短暂出现的图形，并从候选项中找出它们。',
    abilityTags: ['视觉记忆', '图形识别', '短时记忆'],
    defaultStartLevel: 1,
    minStartLevel: 1,
    maxStartLevel: 20,
    startLabel: '起始关卡',
    bestScoreLabel: '最高关卡',
  },
  {
    id: 'n-back',
    name: 'N-back 测试',
    shortName: 'N-back',
    route: '/games/n-back',
    description: '判断当前刺激是否与前 N 轮相同，训练工作记忆。',
    abilityTags: ['工作记忆', '持续注意力', '信息更新'],
    defaultStartLevel: 1,
    minStartLevel: 1,
    maxStartLevel: 10,
    startLabel: '起始关卡',
    bestScoreLabel: '最高关卡',
  },
]

export function getGameConfig(gameId: GameId) {
  const config = games.find((game) => game.id === gameId)

  if (!config) {
    throw new Error(`Unknown game: ${gameId}`)
  }

  return config
}
