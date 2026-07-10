/**
 * 词库编译器：npm run words:build
 * 将 data/words/batch-*.json 按主题（regions.json 顺序）汇总，
 * 每 LEVEL_SIZE 词切一关，产出：
 *   - src/data/words.compiled.json  全量词条
 *   - src/data/levels.compiled.json 区域 → 关卡 → 词 id 结构
 * 产物提交入库，运行时零解析成本。
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LEVEL_SIZE } from './word-schema.mjs'
import { loadRegions, loadBatches, validateAll } from './validate-words.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'src', 'data')

export function compile(regions, batches) {
  // 按批次文件顺序展开（批内顺序即人工编排顺序），再按主题分桶
  const allWords = batches.flatMap((b) => b.words)
  const byTheme = new Map(regions.map((r) => [r.id, []]))
  for (const entry of allWords) {
    byTheme.get(entry.theme).push(entry)
  }

  const words = []
  const levels = []
  const regionSummaries = []

  for (const region of regions) {
    const themeWords = byTheme.get(region.id)
    const levelIds = []
    for (let start = 0; start < themeWords.length; start += LEVEL_SIZE) {
      const chunk = themeWords.slice(start, start + LEVEL_SIZE)
      const index = start / LEVEL_SIZE + 1
      const levelId = `${region.id}-${index}`
      levelIds.push(levelId)
      levels.push({
        id: levelId,
        regionId: region.id,
        index,
        wordIds: chunk.map((w) => w.id),
      })
    }
    words.push(...themeWords)
    regionSummaries.push({
      id: region.id,
      name: region.name,
      emoji: region.emoji,
      description: region.description,
      levelIds,
    })
  }

  return {
    words,
    levelData: { regions: regionSummaries, levels },
  }
}

function main() {
  const regions = loadRegions()
  const batches = loadBatches()
  const errors = validateAll(regions, batches)
  if (errors.length > 0) {
    console.error(`❌ 词库存在 ${errors.length} 处错误，请先运行 npm run words:validate`)
    process.exit(1)
  }

  const { words, levelData } = compile(regions, batches)
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'words.compiled.json'), JSON.stringify(words, null, 2) + '\n')
  writeFileSync(join(OUT_DIR, 'levels.compiled.json'), JSON.stringify(levelData, null, 2) + '\n')

  const levelCount = levelData.levels.length
  console.log(`✅ 已编译 ${words.length} 词 → ${levelCount} 关（每关 ≤${LEVEL_SIZE} 词）`)
  console.log(`   输出: src/data/words.compiled.json, src/data/levels.compiled.json`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
