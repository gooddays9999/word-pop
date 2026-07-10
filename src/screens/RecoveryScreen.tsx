import { useRef } from 'react'
import { Button } from '../components/Button'
import { createInitialSave } from '../engine/save'
import { importSaveText } from '../storage/exportImport'
import { todayStamp } from '../utils/date'
import { useAppStore } from '../store/store'

/** 主存档与自动备份都损坏时的兜底界面：绝不静默清档 */
export function RecoveryScreen() {
  const replaceSave = useAppStore((state) => state.replaceSave)
  const resetSave = useAppStore((state) => state.resetSave)
  const showToast = useAppStore((state) => state.showToast)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    const result = importSaveText(text)
    if (!result.ok) {
      showToast(`导入失败：${result.error}`)
      return
    }
    replaceSave(result.value)
    showToast('恢复成功，欢迎回来！')
  }

  return (
    <div className="grid h-full place-items-center px-6">
      <div className="panel max-w-lg p-8 text-center">
        <div className="mb-4 text-6xl">🆘</div>
        <h1 className="mb-2 text-2xl font-extrabold">存档数据损坏</h1>
        <p className="mb-6 text-sm leading-relaxed text-[var(--ink-dim)]">
          本机的学习进度数据无法读取，自动备份也不可用。 如果你之前导出过备份文件，现在导入即可完整恢复；
          否则只能重新开始冒险。
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => fileInputRef.current?.click()}>
            ⬆️ 导入备份文件恢复
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              resetSave(createInitialSave(todayStamp(), new Date().toISOString()))
              showToast('已重新开始，加油！')
            }}
          >
            重新开始
          </Button>
        </div>
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
    </div>
  )
}
