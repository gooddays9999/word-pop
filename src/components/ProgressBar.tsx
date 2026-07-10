interface ProgressBarProps {
  /** 0–1 */
  readonly ratio: number
  readonly color?: string
  readonly heightClass?: string
}

export function ProgressBar({
  ratio,
  color = 'var(--nova)',
  heightClass = 'h-3',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, ratio))
  return (
    <div
      className={`${heightClass} w-full overflow-hidden rounded-full border border-[var(--space-line)] bg-black/40`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped * 100}%`, background: color }}
      />
    </div>
  )
}
