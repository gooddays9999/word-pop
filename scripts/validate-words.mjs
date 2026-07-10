/**
 * 词库校验器：npm run words:validate
 * 校验 data/words/batch-*.json 的结构、唯一性与内容规则，输出统计报表。
 * 有任何错误则以非零状态退出（CI 闸门）。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateWordEntry } from './word-schema.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WORDS_DIR = join(ROOT, 'data', 'words')
const REGIONS_FILE = join(ROOT, 'data', 'regions.json')

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (cause) {
    throw new Error(`无法读取或解析 JSON: ${path}\n  ${cause.message}`)
  }
}

export function loadRegions() {
  const parsed = loadJson(REGIONS_FILE)
  if (!Array.isArray(parsed.regions) || parsed.regions.length === 0) {
    throw new Error('regions.json 必须包含非空 regions 数组')
  }
  for (const region of parsed.regions) {
    for (const field of ['id', 'name', 'emoji', 'description']) {
      if (typeof region[field] !== 'string' || region[field] === '') {
        throw new Error(`regions.json 中区域缺少字段 ${field}: ${JSON.stringify(region)}`)
      }
    }
  }
  return parsed.regions
}

export function loadBatches() {
  const files = readdirSync(WORDS_DIR)
    .filter((name) => /^batch-\d{3}\.json$/.test(name))
    .sort()
  if (files.length === 0) {
    throw new Error(`未在 ${WORDS_DIR} 找到任何 batch-NNN.json 词库文件`)
  }
  return files.map((file) => {
    const parsed = loadJson(join(WORDS_DIR, file))
    const expected = Number.parseInt(file.slice(6, 9), 10)
    if (parsed.batch !== expected) {
      throw new Error(`${file} 的 batch 字段 (${parsed.batch}) 与文件名不一致 (${expected})`)
    }
    if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
      throw new Error(`${file} 必须包含非空 words 数组`)
    }
    return { file, words: parsed.words }
  })
}

export function validateAll(regions, batches) {
  const regionIds = new Set(regions.map((r) => r.id))
  const errors = []
  const seenIds = new Map()

  for (const { file, words } of batches) {
    words.forEach((entry, index) => {
      const where = `${file}[${index}]`
      for (const message of validateWordEntry(entry, regionIds)) {
        errors.push(`${where}: ${message}`)
      }
      if (typeof entry.id === 'string') {
        const firstSeen = seenIds.get(entry.id)
        if (firstSeen) {
          errors.push(`${where}: id "${entry.id}" 与 ${firstSeen} 重复`)
        } else {
          seenIds.set(entry.id, where)
        }
      }
    })
  }
  return errors
}

export function buildReport(regions, batches) {
  const all = batches.flatMap((b) => b.words)
  const byTheme = new Map(regions.map((r) => [r.id, 0]))
  let missingExample = 0
  let missingPhonetic = 0
  for (const entry of all) {
    byTheme.set(entry.theme, (byTheme.get(entry.theme) ?? 0) + 1)
    if (entry.example === undefined) missingExample += 1
    if (entry.phonetic === undefined) missingPhonetic += 1
  }
  const lines = ['📊 词库统计']
  for (const region of regions) {
    lines.push(`  ${region.emoji} ${region.name} (${region.id}): ${byTheme.get(region.id)} 词`)
  }
  lines.push(`  合计: ${all.length} 词 | 缺例句: ${missingExample} | 缺音标: ${missingPhonetic}`)
  return lines.join('\n')
}

function main() {
  const regions = loadRegions()
  const batches = loadBatches()
  const errors = validateAll(regions, batches)

  console.log(buildReport(regions, batches))
  if (errors.length > 0) {
    console.error(`\n❌ 词库校验失败，共 ${errors.length} 处：`)
    for (const message of errors) console.error(`  - ${message}`)
    process.exit(1)
  }
  console.log('\n✅ 词库校验通过')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
