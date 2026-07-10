import { Component, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
}

interface State {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error('[word-pop] 界面崩溃:', error)
  }

  render(): ReactNode {
    if (this.state.error === null) return this.props.children
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="panel max-w-md p-8 text-center">
          <div className="mb-4 text-5xl">🛸</div>
          <h1 className="mb-2 text-xl font-extrabold">飞船遇到了故障</h1>
          <p className="mb-6 text-sm leading-relaxed text-[var(--ink-dim)]">
            页面出现了意外错误，你的学习进度已自动保存在本机。刷新后即可继续冒险。
          </p>
          <button className="btn btn-primary btn-md" onClick={() => window.location.reload()}>
            重新启动飞船
          </button>
        </div>
      </div>
    )
  }
}
