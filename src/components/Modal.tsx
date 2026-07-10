import type { ReactNode } from 'react'

interface ModalProps {
  readonly title: string
  readonly children: ReactNode
  readonly actions: ReactNode
}

export function Modal({ title, children, actions }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="panel anim-slide-up w-full max-w-md p-6" role="dialog" aria-modal="true">
        <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
        <div className="mb-6 text-[15px] leading-relaxed text-[var(--ink-dim)]">{children}</div>
        <div className="flex justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}
