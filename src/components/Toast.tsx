import { useEffect } from 'react'
import { useAppStore } from '../store/store'

const TOAST_DURATION_MS = 3200

export function Toast() {
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)

  useEffect(() => {
    if (toast === null) return
    const timer = setTimeout(clearToast, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (toast === null) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
      <div className="panel anim-slide-up max-w-md px-5 py-3 text-center text-[15px] font-bold">
        {toast}
      </div>
    </div>
  )
}
