import { LEVEL_XP_UNIT } from '../../config/economy'

/** 升到第 level 级所需累计 XP */
export function xpForLevel(level: number): number {
  return LEVEL_XP_UNIT * level * (level - 1)
}

/** 由累计 XP 反推玩家等级 */
export function levelForXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) {
    level += 1
  }
  return level
}
