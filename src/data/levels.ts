import { z } from 'zod'
import compiledLevels from './levels.compiled.json'
import type { LevelDef, RegionDef } from '../types/word'

const levelSchema = z.object({
  id: z.string().min(1),
  regionId: z.string().min(1),
  index: z.number().int().min(1),
  wordIds: z.array(z.string().min(1)).min(1),
})

const regionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().min(1),
  description: z.string().min(1),
  levelIds: z.array(z.string()),
})

const fileSchema = z.object({
  regions: z.array(regionSchema).min(1),
  levels: z.array(levelSchema),
})

function loadLevels(): { regions: readonly RegionDef[]; levels: readonly LevelDef[] } {
  const parsed = fileSchema.safeParse(compiledLevels)
  if (!parsed.success) {
    throw new Error(`关卡数据损坏，请重新运行 npm run words:build（${parsed.error.issues[0]?.message}）`)
  }
  return parsed.data
}

const loaded = loadLevels()

export const REGIONS: readonly RegionDef[] = loaded.regions
export const LEVELS: readonly LevelDef[] = loaded.levels
export const LEVEL_BY_ID: ReadonlyMap<string, LevelDef> = new Map(
  loaded.levels.map((level) => [level.id, level]),
)
