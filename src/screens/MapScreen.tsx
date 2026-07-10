import { Hud } from '../components/Hud'
import { LEVELS, REGIONS } from '../data/levels'
import { levelViews, type LevelView } from '../store/selectors'
import { useAppStore } from '../store/store'
import type { RegionDef } from '../types/word'

function statusBadge(view: LevelView): string {
  switch (view.status) {
    case 'completed':
      return '⭐'.repeat(Math.max(1, view.stars))
    case 'inProgress':
      return `${view.learnedWords}/${view.level.wordIds.length} 词`
    case 'available':
      return '⚔️ 可挑战'
    case 'locked':
      return '🔒'
  }
}

function LevelNode({ view }: { view: LevelView }) {
  const startLevel = useAppStore((state) => state.startLevel)
  const showToast = useAppStore((state) => state.showToast)
  const locked = view.status === 'locked'
  return (
    <button
      className={`choice-btn ${locked ? 'is-dim' : ''}`}
      data-testid={`level-${view.level.id}`}
      onClick={() => {
        if (locked) {
          showToast('先通过前面的关卡才能解锁这里')
          return
        }
        startLevel(view.level.id)
      }}
    >
      <span className="text-2xl">
        {view.status === 'completed' ? '🌕' : view.status === 'locked' ? '🌑' : '🌖'}
      </span>
      <span className="flex-1 text-left">
        第 {view.level.index} 关
        <span className="ml-2 text-sm text-[var(--ink-dim)]">
          {view.level.wordIds.length} 个单词
        </span>
      </span>
      <span className="text-sm font-bold text-[var(--star-gold)]">{statusBadge(view)}</span>
    </button>
  )
}

function RegionCard({ region }: { region: RegionDef }) {
  const save = useAppStore((state) => state.save)
  const regionLevels = LEVELS.filter((level) => level.regionId === region.id)
  const views = levelViews(save, regionLevels)
  const open = regionLevels.length > 0

  return (
    <section className={`panel p-6 ${open ? '' : 'opacity-60'}`}>
      <div className="mb-1 flex items-center gap-3">
        <span className="text-3xl">{region.emoji}</span>
        <div>
          <h2 className="text-xl font-extrabold">{region.name}</h2>
          <p className="text-xs text-[var(--ink-dim)]">{region.description}</p>
        </div>
        {open && (
          <span className="ml-auto text-sm text-[var(--ink-dim)]">
            {views.filter((view) => view.status === 'completed').length}/{regionLevels.length} 关
          </span>
        )}
      </div>
      {open ? (
        <div className="mt-4 flex flex-col gap-2">
          {views.map((view) => (
            <LevelNode key={view.level.id} view={view} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-bold text-[var(--ink-dim)]">🛸 新星域探索中，敬请期待</p>
      )}
    </section>
  )
}

export function MapScreen() {
  const goTo = useAppStore((state) => state.goTo)
  return (
    <div className="flex h-full flex-col">
      <Hud onBack={() => goTo({ name: 'home' })} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-10">
        <h1 className="mb-1 mt-4 text-3xl font-extrabold">🗺️ 单词星球地图</h1>
        <p className="mb-6 text-sm text-[var(--ink-dim)]">
          按顺序点亮每一颗星球，区域全部通关后将迎来 Boss 战（即将开放）
        </p>
        <div className="anim-slide-up flex flex-col gap-5">
          {REGIONS.map((region) => (
            <RegionCard key={region.id} region={region} />
          ))}
        </div>
      </main>
    </div>
  )
}
