import { useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Hud } from '../components/Hud'
import { Modal } from '../components/Modal'
import { NEW_WORDS_PER_DAY_OPTIONS } from '../config/session'
import { createInitialSave } from '../engine/save'
import { exportSaveText, importSaveText, summarizeSave } from '../storage/exportImport'
import type { SaveData } from '../types/save'
import { todayStamp } from '../utils/date'
import { useAppStore } from '../store/store'

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SettingsScreen() {
  const save = useAppStore((state) => state.save)
  const goTo = useAppStore((state) => state.goTo)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const replaceSave = useAppStore((state) => state.replaceSave)
  const resetSave = useAppStore((state) => state.resetSave)
  const markBackedUp = useAppStore((state) => state.markBackedUp)
  const showToast = useAppStore((state) => state.showToast)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<SaveData | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    downloadText(`word-pop-backup-${todayStamp()}.json`, exportSaveText(save))
    markBackedUp()
    showToast('备份已导出，请妥善保存这个文件')
  }

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    const result = importSaveText(text)
    if (!result.ok) {
      showToast(`导入失败：${result.error}`)
      return
    }
    setPendingImport(result.value)
  }

  return (
    <div className="flex h-full flex-col">
      <Hud onBack={() => goTo({ name: 'home' })} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-10">
        <h1 className="mb-6 mt-4 text-3xl font-extrabold">⚙️ 设置</h1>

        <section className="panel mb-5 p-6">
          <h2 className="mb-1 text-lg font-extrabold">📆 每日新词量</h2>
          <p className="mb-4 text-xs text-[var(--ink-dim)]">
            每天 20 个约 3 个半月学完 2100 词；复习量会随进度自动增加，量力而行
          </p>
          <div className="flex gap-3">
            {NEW_WORDS_PER_DAY_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={save.settings.newWordsPerDay === option ? 'primary' : 'ghost'}
                size="md"
                onClick={() => updateSettings({ newWordsPerDay: option })}
              >
                {option} 词
              </Button>
            ))}
          </div>
        </section>

        <section className="panel mb-5 p-6">
          <h2 className="mb-4 text-lg font-extrabold">🔊 发音</h2>
          <Button
            variant={save.settings.ttsEnabled ? 'primary' : 'ghost'}
            size="md"
            onClick={() => updateSettings({ ttsEnabled: !save.settings.ttsEnabled })}
          >
            {save.settings.ttsEnabled ? '已开启（自动朗读单词）' : '已关闭'}
          </Button>
        </section>

        <section className="panel mb-5 p-6">
          <h2 className="mb-1 text-lg font-extrabold">💾 学习进度备份</h2>
          <p className="mb-4 text-xs text-[var(--ink-dim)]">
            进度保存在本机浏览器里。建议每周导出一次备份文件，换电脑或清理浏览器后可导入恢复。
            {save.lastBackupDay && `上次备份：${save.lastBackupDay}`}
          </p>
          <div className="flex gap-3">
            <Button variant="gold" size="md" onClick={handleExport}>
              ⬇️ 导出备份
            </Button>
            <Button variant="ghost" size="md" onClick={() => fileInputRef.current?.click()}>
              ⬆️ 导入备份
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleImportFile(file)
                event.target.value = ''
              }}
            />
          </div>
        </section>

        <section className="panel border-[var(--hp-red)]/40 p-6">
          <h2 className="mb-1 text-lg font-extrabold text-[var(--hp-red)]">⚠️ 危险区</h2>
          <p className="mb-4 text-xs text-[var(--ink-dim)]">清空全部学习进度，从零开始新的冒险</p>
          <Button variant="danger" size="md" onClick={() => setConfirmReset(true)}>
            重置全部进度
          </Button>
        </section>
      </main>

      {pendingImport && (
        <Modal
          title="确认导入这个备份？"
          actions={
            <>
              <Button variant="ghost" size="md" onClick={() => setPendingImport(null)}>
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  replaceSave(pendingImport)
                  setPendingImport(null)
                  showToast('导入成功，欢迎回来！')
                }}
              >
                确认导入（覆盖当前进度）
              </Button>
            </>
          }
        >
          {(() => {
            const summary = summarizeSave(pendingImport)
            return (
              <ul className="list-inside list-disc space-y-1">
                <li>已接触单词：{summary.introducedWords} 个</li>
                <li>已学会单词：{summary.learnedWords} 个</li>
                <li>最后活跃日：{summary.lastActiveDay ?? '（无记录）'}</li>
                <li className="text-[var(--hp-red)]">当前进度会被覆盖（已自动存入今日备份位）</li>
              </ul>
            )
          })()}
        </Modal>
      )}

      {confirmReset && (
        <Modal
          title="真的要重置全部进度吗？"
          actions={
            <>
              <Button variant="ghost" size="md" onClick={() => setConfirmReset(false)}>
                我再想想
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  resetSave(createInitialSave(todayStamp(), new Date().toISOString()))
                  setConfirmReset(false)
                  showToast('已重置，开始新的冒险吧')
                }}
              >
                确认重置
              </Button>
            </>
          }
        >
          所有已学单词、星级、金币都会清空。建议先「导出备份」再重置，以防后悔。
        </Modal>
      )}
    </div>
  )
}
