import { SAVE_DEBOUNCE_MS } from '../config/storage'
import { persistSave } from '../storage/localStore'
import type { SaveData } from '../types/save'
import { useAppStore } from './store'

/**
 * 存档自动落盘：save 引用变化后防抖写入；
 * 页面隐藏/关闭时立即冲刷，保证不丢最后一步。
 */
export function attachPersistence(): void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastPersisted: SaveData = useAppStore.getState().save

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    const { save } = useAppStore.getState()
    if (save === lastPersisted) return
    const result = persistSave(save, new Date().toISOString())
    if (result.ok) {
      lastPersisted = save
    } else {
      useAppStore.getState().showToast('存档写入失败，请尽快在设置中导出备份！')
    }
  }

  useAppStore.subscribe((state, previous) => {
    if (state.save === previous.save) return
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(flush, SAVE_DEBOUNCE_MS)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}
