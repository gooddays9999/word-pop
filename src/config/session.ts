/** 每日复习上限 */
export const REVIEW_DAILY_CAP = 120

export const NEW_WORDS_PER_DAY_OPTIONS: readonly number[] = [10, 20, 30, 50, 100, 200]
export const DEFAULT_NEW_WORDS_PER_DAY = 20
/** 存档 schema 与设置允许的每日新词上限 */
export const MAX_NEW_WORDS_PER_DAY = 200

/** 答错/未达标时，重插到当前位置之后的间隔 */
export const REQUEUE_GAP = 4
/** 同一词最多重插次数（防死循环） */
export const MAX_REQUEUES_PER_WORD = 3

/** 关卡新词教学：每小批词数（先教后问） */
export const TEACH_BATCH_SIZE = 5

/** 干扰项排除最近出现过的词的窗口 */
export const RECENT_DISTRACTOR_WINDOW = 10
/** 选择题选项数 */
export const CHOICE_OPTION_COUNT = 4

/**
 * 待复习超过该值时，先复习才能开新关。
 * 实际阈值取 max(该值, 每日新词量)——高速档（如 200/天）下
 * 一天的正常到期量不应触发锁定，只拦截真正的积压。
 */
export const REVIEW_SOFT_GATE = 60
