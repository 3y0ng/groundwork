// ---------------------------------------------------------------------------
// Top-level error boundary. Catches any render/runtime error below it and shows
// a calm recovery screen instead of a blank page. Offers two escape hatches:
// reload, and a "reset local data" for the rare case that corrupt persisted
// state is the cause.
// ---------------------------------------------------------------------------

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface for debugging; a real deployment would forward this to a logger.
    console.error('[groundwork] unhandled error:', error, info.componentStack)
  }

  handleReset = () => {
    try {
      localStorage.removeItem('groundwork-store-v1')
    } catch {
      /* ignore */
    }
    location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-6 text-center">
          <div className="w-11 h-11 rounded-xl bg-contra-bg text-contra-fg grid place-items-center mx-auto mb-3 text-xl">!</div>
          <h1 className="font-semibold text-ink">Something went wrong</h1>
          <p className="text-sm text-ink-soft mt-1">
            The app hit an unexpected error. Your saved work is stored locally and is usually fine, 
            reloading normally fixes it.
          </p>
          <pre className="text-[11px] text-ink-faint bg-black/[0.03] border border-line rounded-lg p-2 mt-3 text-left overflow-x-auto">
            {this.state.error.message}
          </pre>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button className="btn-primary flex-1" onClick={() => location.reload()}>Reload</button>
            <button
              className="btn-outline flex-1"
              onClick={() => {
                if (confirm('Reset local data? This clears projects saved in this browser. Export first if you want a backup.')) this.handleReset()
              }}
            >Reset local data</button>
          </div>
        </div>
      </div>
    )
  }
}
