import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Eye, Keyboard, Square, TimerOff, XCircle } from 'lucide-react'
import DifficultySelector from '@/components/DifficultySelector'
import GameHeader from '@/components/GameHeader'
import GridBoard from '@/components/GridBoard'
import ResultModal from '@/components/ResultModal'
import { getGameConfig } from '@/data/games'
import { useBestScores } from '@/hooks/useBestScores'
import type { GameResult, GameStatus } from '@/types/game'
import {
  calculateNBackResult,
  generateNBackTrials,
  getNBackLevelConfig,
  getPassThreshold,
  judgeTrial,
} from './logic'
import type { NBackLevelConfig, NBackResponse, NBackTrial } from './types'

const game = getGameConfig('n-back')
type RoundPhase = 'stimulus' | 'interval'
type PassPrompt = {
  accuracy: number
  nextLevel: number
  nextNLevel: number
}

export default function NBackGame() {
  const { bestScores, saveBestScore } = useBestScores()
  const [startLevel, setStartLevel] = useState(game.defaultStartLevel)
  const [currentLevel, setCurrentLevel] = useState(startLevel)
  const [config, setConfig] = useState<NBackLevelConfig>(() => getNBackLevelConfig(startLevel))
  const [trials, setTrials] = useState<NBackTrial[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [status, setStatus] = useState<GameStatus>('intro')
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('stimulus')
  const [roundNote, setRoundNote] = useState('准备开始')
  const [passPrompt, setPassPrompt] = useState<PassPrompt | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const responseLockedRef = useRef(false)
  const trialStartedAtRef = useRef(0)
  const trialsRef = useRef<NBackTrial[]>([])

  const currentTrial = trials[currentIndex]
  const currentTrialIndex = currentTrial?.index
  const currentTrialIsScored = currentTrial?.isScored
  const activeCell = status === 'showing' && roundPhase === 'stimulus' && currentTrial ? currentTrial.position : null
  const isScoredRound = Boolean(currentTrial?.isScored)
  const canRespond = status === 'showing' && isScoredRound && !currentTrial?.response
  const progressText = trials.length ? `${Math.min(currentIndex + 1, trials.length)}/${trials.length}` : '尚未开始'
  const progressPercent = trials.length ? ((currentIndex + 1) / trials.length) * 100 : 0

  useEffect(() => {
    trialsRef.current = trials
  }, [trials])

  const commitResult = useCallback(
    (nextTrials: NBackTrial[], level: number, levelConfig: NBackLevelConfig, advanceOnPass = true) => {
      const nBackResult = calculateNBackResult(level, levelConfig, nextTrials)
      const threshold = getPassThreshold()
      const passed = nBackResult.accuracy >= threshold
      const isNewBest = saveBestScore({
        gameId: game.id,
        bestLevel: levelConfig.nLevel,
        bestScore: nBackResult.score,
        bestAccuracy: Math.round(nBackResult.accuracy * 100),
        updatedAt: Date.now(),
      })

      if (advanceOnPass && passed && level < game.maxStartLevel) {
        const nextLevel = level + 1
        const nextConfig = getNBackLevelConfig(nextLevel)
        setPassPrompt({
          accuracy: nBackResult.accuracy * 100,
          nextLevel,
          nextNLevel: nextConfig.nLevel,
        })
        setRoundNote(`正确率 ${Math.round(nBackResult.accuracy * 100)}%，达成 80%，可以进入第 ${nextLevel} 关。`)
        setStatus('success')
        return
      }

      setResult({
        gameId: game.id,
        title: passed ? '训练完成，已达到 80% 通关标准' : '训练完成，继续巩固',
        bestLevel: levelConfig.nLevel,
        score: nBackResult.score,
        accuracy: nBackResult.accuracy * 100,
        detail: `${levelConfig.nLevel}-back，本局 ${nBackResult.validRoundCount} 个有效判断。80% 正确率可进入下一关。命中率 ${Math.round(nBackResult.hitRate * 100)}%，误报率 ${Math.round(
          nBackResult.falseAlarmRate * 100,
        )}%，漏报 ${nBackResult.missCount} 次，未作答 ${nBackResult.noResponseCount} 次，其中不匹配未确认 ${nBackResult.nonMatchNoResponseCount} 次，正确 ${nBackResult.correctCount}/${nBackResult.validRoundCount}。`,
        isNewBest,
      })
      setStatus('result')
    },
    [saveBestScore],
  )

  const continueNextLevel = () => {
    if (!passPrompt) {
      return
    }

    const nextConfig = getNBackLevelConfig(passPrompt.nextLevel)
    setCurrentLevel(passPrompt.nextLevel)
    setConfig(nextConfig)
    setTrials(generateNBackTrials(nextConfig))
    setCurrentIndex(0)
    setResult(null)
    setPassPrompt(null)
    setRoundPhase('stimulus')
    setRoundNote(`进入第 ${passPrompt.nextLevel} 关：${nextConfig.nLevel}-back。`)
    responseLockedRef.current = false
    trialStartedAtRef.current = Date.now()
    setStatus('showing')
  }

  const finishGame = useCallback(
    (nextTrials = trials) => {
      commitResult(nextTrials, currentLevel, config, false)
    },
    [commitResult, config, currentLevel, trials],
  )

  const startGame = () => {
    const nextConfig = getNBackLevelConfig(startLevel)
    setCurrentLevel(startLevel)
    setConfig(nextConfig)
    setTrials(generateNBackTrials(nextConfig))
    setCurrentIndex(0)
    setResult(null)
    setPassPrompt(null)
    setRoundPhase('stimulus')
    setRoundNote('前几轮先观察，建立记忆缓冲。')
    responseLockedRef.current = false
    trialStartedAtRef.current = Date.now()
    setStatus('showing')
  }

  const answerCurrentTrial = useCallback(
    (response: NBackResponse) => {
      if (status !== 'showing' || !currentTrial || responseLockedRef.current) {
        return
      }

      if (!currentTrial.isScored) {
        setRoundNote(`观察中：前 ${config.nLevel} 轮不计分。`)
        return
      }

      responseLockedRef.current = true
      const reactionTime = Date.now() - trialStartedAtRef.current
      setRoundNote(response === 'match' ? '已记录：匹配' : '已记录：不匹配')
      setTrials((items) =>
        items.map((trial, index) => (index === currentIndex ? judgeTrial(trial, response, reactionTime) : trial)),
      )
    },
    [config.nLevel, currentIndex, currentTrial, status],
  )

  useEffect(() => {
    if (status !== 'showing' || currentTrialIndex === undefined) {
      return undefined
    }

    if (roundPhase === 'stimulus') {
      responseLockedRef.current = false
      trialStartedAtRef.current = Date.now()
      setRoundNote(currentTrialIsScored ? `判断是否与前 ${config.nLevel} 轮相同。` : `观察中：前 ${config.nLevel} 轮不计分。`)

      const stimulusTimer = window.setTimeout(() => {
        setTrials((items) => {
          const alreadyAnswered = items[currentIndex]?.response !== null
          return items[currentIndex]?.isScored && !alreadyAnswered
            ? items.map((trial, index) => (index === currentIndex ? judgeTrial(trial, null) : trial))
            : items
        })
        setRoundNote(currentTrialIsScored ? '高亮结束，若还没作答可在空白间隔内补答。' : '观察结束，准备下一轮。')
        setRoundPhase('interval')
      }, config.stimulusDuration)

      return () => window.clearTimeout(stimulusTimer)
    }

    const intervalTimer = window.setTimeout(() => {
      if (currentIndex >= trialsRef.current.length - 1) {
        commitResult(trialsRef.current, currentLevel, config)
        return
      }

      setCurrentIndex((index) => index + 1)
      setRoundPhase('stimulus')
    }, config.intervalDuration)

    return () => window.clearTimeout(intervalTimer)
  }, [commitResult, config, currentIndex, currentLevel, currentTrialIndex, currentTrialIsScored, roundPhase, status])

  useEffect(() => {
    if (status !== 'showing') {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        answerCurrentTrial('match')
      }

      if (event.code === 'ArrowRight' || event.key.toLowerCase() === 'n') {
        answerCurrentTrial('non-match')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerCurrentTrial, status])

  const responseState = useMemo(() => {
    if (!currentTrial?.isScored) {
      return '前几轮用于建立记忆缓冲，不计分。'
    }

    if (currentTrial.response === 'match') return '已选择：匹配'
    if (currentTrial.response === 'non-match') return '已选择：不匹配'
    return `相同点匹配，不同点不匹配。`
  }, [config.nLevel, currentTrial])

  return (
    <main className="min-h-screen px-4 py-4 md:py-5">
      <div className="mx-auto max-w-5xl">
        <GameHeader
          game={game}
          currentLabel={status === 'intro' ? '尚未开始' : `${config.nLevel}-back · ${progressText}`}
          bestScore={bestScores[game.id]}
        />

        {status === 'intro' ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="panel">
              <p className="eyebrow">Rules</p>
              <h2 className="section-title">判断当前刺激是否回到前 N 轮</h2>
              <p className="mt-4 leading-7 text-slate-500">
                观察 3×3 网格中连续出现的高亮格子。从第 N+1 轮开始，判断当前格子是否与前 N 轮的位置相同。
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Eye className="text-cyan-600" size={20} />
                  <p className="mt-2 text-sm font-black text-slate-800">先观察</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">前 N 轮只建立记忆缓冲，不计分。</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <p className="mt-2 text-sm font-black text-slate-800">匹配</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">当前格子等于前 N 轮格子时，点击匹配。</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <XCircle className="text-rose-600" size={20} />
                  <p className="mt-2 text-sm font-black text-slate-800">不匹配</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">当前格子和前 N 轮不同，必须点击不匹配。</p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900">
                <Keyboard className="mt-0.5 shrink-0" size={18} />
                <span>每关固定 10 个有效判断，正确率达到 80% 会弹出晋级提示。Space 点击匹配；N / 右方向键点击不匹配。</span>
              </div>
              <button className="btn-primary mt-6" type="button" onClick={startGame}>
                开始 N-back
              </button>
            </div>
            <DifficultySelector
              label={game.startLabel}
              value={startLevel}
              min={game.minStartLevel}
              max={game.maxStartLevel}
              suffix="关"
              description={`对应 ${getNBackLevelConfig(startLevel).nLevel}-back，固定 10 个有效判断，80% 正确率弹出晋级提示。`}
              onChange={setStartLevel}
            />
          </section>
        ) : (
          <section className="mt-4 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-sm shadow-slate-200/70 backdrop-blur md:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-cyan-200">
                    {config.nLevel}-back
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                    {roundPhase === 'stimulus' ? '刺激出现' : '轮间空白'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                    {isScoredRound ? '本轮计分' : '观察中'}
                  </span>
                </div>
                <p className="mt-2 text-base font-black text-slate-900">{roundNote}</p>
                <p className="mt-1 text-sm text-slate-400">
                  当前轮：{progressText}，有效判断从第 {config.nLevel + 1} 轮开始。
                </p>
              </div>
              <button className="btn-secondary" type="button" onClick={() => finishGame()}>
                <TimerOff size={18} />
                提前结束
              </button>
            </div>

            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mb-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-400">比较目标</p>
                <p className="mt-1 text-base font-black text-slate-900">
                  {isScoredRound ? `第 ${currentIndex + 1} 轮 vs 第 ${currentIndex + 1 - config.nLevel} 轮` : '先观察'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-400">作答状态</p>
                <p className="mt-1 text-base font-black text-slate-900">{responseState}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-400">节奏</p>
                <p className="mt-1 text-base font-black text-slate-900">
                  {config.stimulusDuration / 1000}s / {config.intervalDuration / 1000}s
                </p>
              </div>
            </div>

            <GridBoard
              cells={9}
              columns={3}
              activeCells={activeCell === null ? [] : [activeCell]}
              disabled
              labels={activeCell === null ? {} : { [activeCell]: '●' }}
              className="max-w-[min(60vh,465px)] gap-2"
              cellClassName="rounded-xl text-base"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                className="btn-primary min-h-11"
                type="button"
                disabled={!canRespond}
                onClick={() => answerCurrentTrial('match')}
              >
                <Square size={18} />
                匹配
              </button>
              <button
                className="btn-secondary min-h-11 justify-center"
                type="button"
                disabled={!canRespond}
                onClick={() => answerCurrentTrial('non-match')}
              >
                不匹配
              </button>
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">
              {canRespond ? '相同点匹配，不同点不匹配；高亮消失后的短暂空白内仍可补答。' : '当前不可作答，请等待下一次刺激。'}
            </p>
          </section>
        )}
      </div>

      {passPrompt ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-[34px] border border-white/80 bg-white p-6 text-center shadow-2xl shadow-slate-900/20">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={28} />
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-emerald-600">Level clear</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">本关通过</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-400">本次正确率</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{Math.round(passPrompt.accuracy)}%</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-4">
                <p className="text-xs font-semibold text-cyan-700">下一关</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{passPrompt.nextNLevel}-back</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              已达到 80% 通关标准。下一关是第 {passPrompt.nextLevel} 关，难度为 {passPrompt.nextNLevel}-back。
            </p>
            <button className="btn-primary mx-auto mt-6" type="button" onClick={continueNextLevel}>
              进入下一关
            </button>
          </section>
        </div>
      ) : null}

      {result ? (
        <ResultModal result={result} onReplay={startGame} onAdjust={() => setStatus('intro')} />
      ) : null}
    </main>
  )
}
