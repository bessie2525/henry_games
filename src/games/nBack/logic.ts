import { randomInt } from '@/utils/random'
import type { NBackLevelConfig, NBackResponse, NBackResult, NBackTrial } from './types'

export function getNBackLevelConfig(startLevel: number): NBackLevelConfig {
  if (startLevel <= 2) {
    return { nLevel: 1, roundCount: 10, stimulusDuration: 1200, intervalDuration: 600, matchRate: 0.3 }
  }

  if (startLevel <= 5) {
    return { nLevel: 2, roundCount: 10, stimulusDuration: 1100, intervalDuration: 500, matchRate: 0.3 }
  }

  if (startLevel <= 8) {
    return { nLevel: 3, roundCount: 10, stimulusDuration: 1000, intervalDuration: 400, matchRate: 0.3 }
  }

  return { nLevel: 4, roundCount: 10, stimulusDuration: 900, intervalDuration: 350, matchRate: 0.3 }
}

function getNonMatchingPosition(previousPosition: number) {
  let nextPosition = randomInt(0, 8)

  while (nextPosition === previousPosition) {
    nextPosition = randomInt(0, 8)
  }

  return nextPosition
}

export function generateNBackTrials(config: NBackLevelConfig): NBackTrial[] {
  const positions: number[] = []
  const totalRoundCount = config.roundCount + config.nLevel

  for (let index = 0; index < totalRoundCount; index += 1) {
    if (index < config.nLevel) {
      positions.push(randomInt(0, 8))
      continue
    }

    const shouldMatch = Math.random() < config.matchRate
    const comparePosition = positions[index - config.nLevel]
    positions.push(shouldMatch ? comparePosition : getNonMatchingPosition(comparePosition))
  }

  return positions.map((position, index) => ({
    index,
    position,
    isMatch: index >= config.nLevel ? position === positions[index - config.nLevel] : false,
    response: null,
    isScored: index >= config.nLevel,
  }))
}

export function judgeTrial(trial: NBackTrial, response: NBackResponse, reactionTime?: number): NBackTrial {
  if (!trial.isScored) {
    return {
      ...trial,
      response: null,
      reactionTime,
    }
  }

  const isCorrect = trial.isMatch ? response === 'match' : response === 'non-match'

  return {
    ...trial,
    response,
    isCorrect,
    reactionTime,
  }
}

export function calculateNBackResult(level: number, config: NBackLevelConfig, trials: NBackTrial[]): NBackResult {
  const validTrials = trials.filter((trial) => trial.isScored)
  const matchTrials = validTrials.filter((trial) => trial.isMatch)
  const nonMatchTrials = validTrials.filter((trial) => !trial.isMatch)
  const correctCount = validTrials.filter((trial) => trial.isCorrect).length
  const hitCount = matchTrials.filter((trial) => trial.response === 'match').length
  const falseAlarmCount = nonMatchTrials.filter((trial) => trial.response === 'match').length
  const missCount = matchTrials.filter((trial) => trial.response !== 'match').length
  const noResponseCount = validTrials.filter((trial) => trial.response === null).length
  const nonMatchNoResponseCount = nonMatchTrials.filter((trial) => trial.response === null).length
  const accuracy = validTrials.length ? correctCount / validTrials.length : 0
  const hitRate = matchTrials.length ? hitCount / matchTrials.length : 0
  const falseAlarmRate = nonMatchTrials.length ? falseAlarmCount / nonMatchTrials.length : 0
  const score = Math.round(accuracy * 1000 + config.nLevel * 100 + Math.max(0, config.roundCount - noResponseCount * 2))

  return {
    level,
    nLevel: config.nLevel,
    score,
    accuracy,
    hitRate,
    falseAlarmRate,
    missCount,
    noResponseCount,
    nonMatchNoResponseCount,
    correctCount,
    validRoundCount: validTrials.length,
  }
}

export function getPassThreshold() {
  return 0.8
}
