import posthog from 'posthog-js'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isProductionAnalyticsHost } from '../utils/analytics'

interface Props {
  children: ReactNode
  title?: string
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
    console.error(error, info.componentStack)
    if (isProductionAnalyticsHost()) {
      posthog.captureException(error)
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="admin-error-shell">
          <h1>{this.props.title ?? 'Something went wrong'}</h1>
          <p className="admin-error-message">{this.state.error.message}</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
