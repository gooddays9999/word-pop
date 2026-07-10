import { create } from 'zustand'
import { ttsUsable } from '../audio/tts'
import { REVIEW_DAILY_CAP } from '../config/session'
import { LEVEL_BY_ID } from '../data/levels'
import { WORD_DB } from '../data/words'
import { buildLevelSession, buildReviewSession, type BuildContext } from '../engine/session/builder'
import { computeAllowedTypes } from '../engine/session/capabilities'
import {
  advanceTeach,
  answerQuestion,
  createSessionState,
  currentItem,
} from '../engine/session/runner'
import { applyResults, type SessionSummary } from '../engine/session/results'
import { persistSave, writeSnapshotBackup } from '../storage/localStore'
import type { SaveData, SettingsState } from '../types/save'
import type { SessionState } from '../types/session'
import { todayStamp } from '../utils/date'
import { mulberry32, seedFromString } from '../utils/random'
import { bootLoad } from './boot'
import { dueCount, newWordsRemainingToday, reviewGateThreshold } from './selectors'

export type Screen =
  | { readonly name: 'title' }
  | { readonly name: 'home' }
  | { readonly name: 'map' }
  | { readonly name: 'battle' }
  | { readonly name: 'results' }
  | { readonly name: 'settings' }
  | { readonly name: 'recovery' }

export interface AppStore {
  save: SaveData
  screen: Screen
  session: SessionState | null
  lastSummary: SessionSummary | null
  toast: string | null
  recoveredFromBackup: boolean

  goTo: (screen: Screen) => void
  showToast: (message: string) => void
  clearToast: () => void
  startLevel: (levelId: string) => void
  startReview: () => void
  teachNext: () => void
  answerCurrent: (correct: boolean, responseMs: number) => void
  quitSession: () => void
  updateSettings: (patch: Partial<SettingsState>) => void
  /** 花金币（余额不足返回 false，不扣款） */
  spendCoins: (amount: number) => boolean
  replaceSave: (save: SaveData) => void
  resetSave: (save: SaveData) => void
  markBackedUp: () => void
}

function buildContext(save: SaveData): BuildContext {
  const today = todayStamp()
  return {
    db: WORD_DB,
    progress: save.wordProgress,
    today,
    rng: mulberry32(seedFromString(`${today}:${Object.keys(save.wordProgress).length}`)),
    allowedTypes: computeAllowedTypes({ ttsUsable: ttsUsable(save.settings.ttsEnabled) }),
  }
}

/** 结算并立即落盘（当次会话的成果绝不能丢） */
function settleSession(
  save: SaveData,
  session: SessionState,
): {
  save: SaveData
  summary: SessionSummary
} {
  const level = session.levelId ? (LEVEL_BY_ID.get(session.levelId) ?? null) : null
  const outcome = applyResults(save, session, { today: todayStamp(), level })
  const persisted = persistSave(outcome.save, new Date().toISOString())
  if (!persisted.ok) {
    console.error('[word-pop] 结算落盘失败:', persisted.error)
  }
  return outcome
}

const boot = bootLoad()

export const useAppStore = create<AppStore>()((set, get) => ({
  save: boot.save,
  screen: boot.corrupt ? { name: 'recovery' } : { name: 'title' },
  session: null,
  lastSummary: null,
  toast: null,
  recoveredFromBackup: boot.recovered,

  goTo: (screen) => set({ screen }),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),

  startLevel: (levelId) => {
    const { save, showToast } = get()
    const level = LEVEL_BY_ID.get(levelId)
    if (!level) {
      showToast('关卡不存在')
      return
    }
    // 软门槛：欠账太多时先复习，防止新词越滚越多记不牢
    const due = dueCount(save)
    if (due > reviewGateThreshold(save)) {
      showToast(`待复习的单词已有 ${due} 个，先打复习副本清一清再开新关吧！`)
      return
    }
    const allowance = newWordsRemainingToday(save)
    const session = buildLevelSession(buildContext(save), level, allowance)
    if (session) {
      set({ session, screen: { name: 'battle' } })
      return
    }
    showToast(
      allowance <= 0
        ? '今日新词额度已用完，去打复习副本或明天再来吧'
        : '这一关的单词都已在学习中，先完成复习吧',
    )
  },

  startReview: () => {
    const { save, showToast } = get()
    const session = buildReviewSession(buildContext(save), REVIEW_DAILY_CAP)
    if (session) {
      set({ session, screen: { name: 'battle' } })
      return
    }
    showToast('太棒了，现在没有到期要复习的单词！')
  },

  teachNext: () => {
    const { session } = get()
    if (!session) return
    // 键盘自动重复可能在教学卡→题目切换瞬间重入，静默忽略
    if (currentItem(session)?.kind !== 'teach') return
    const next = advanceTeach(session)
    if (next.done) {
      // 理论上教学卡后必有题目；防御：直接结算
      const { save, summary } = settleSession(get().save, next)
      set({ save, session: null, lastSummary: summary, screen: { name: 'results' } })
      return
    }
    set({ session: next })
  },

  answerCurrent: (correct, responseMs) => {
    const { session } = get()
    if (!session) return
    const next = answerQuestion(session, correct, responseMs)
    if (!next.done) {
      set({ session: next })
      return
    }
    const { save, summary } = settleSession(get().save, next)
    set({ save, session: null, lastSummary: summary, screen: { name: 'results' } })
  },

  quitSession: () => set({ session: null, screen: { name: 'home' } }),

  updateSettings: (patch) => {
    const { save } = get()
    set({ save: { ...save, settings: { ...save.settings, ...patch } } })
  },

  spendCoins: (amount) => {
    const { save } = get()
    if (amount <= 0 || save.player.coins < amount) return false
    set({
      save: { ...save, player: { ...save.player, coins: save.player.coins - amount } },
    })
    return true
  },

  replaceSave: (imported) => {
    const current = get().save
    // 覆盖前无条件快照现存档（同日可覆盖），给误导入留后路
    writeSnapshotBackup(current, todayStamp())
    const persisted = persistSave(imported, new Date().toISOString())
    set({
      save: persisted.ok ? persisted.value : imported,
      session: null,
      lastSummary: null,
      screen: { name: 'home' },
    })
  },

  resetSave: (fresh) => {
    writeSnapshotBackup(get().save, todayStamp())
    const persisted = persistSave(fresh, new Date().toISOString())
    set({
      save: persisted.ok ? persisted.value : fresh,
      session: null,
      lastSummary: null,
      screen: { name: 'title' },
    })
  },

  markBackedUp: () => {
    const { save } = get()
    set({ save: { ...save, lastBackupDay: todayStamp() } })
  },
}))

/** 会话中途退出会丢弃本次进度 —— 由界面弹确认框后调用 quitSession */
export function createEmptySession(): SessionState {
  return createSessionState('review', null, [])
}
