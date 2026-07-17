import { useEffect, useState } from 'react'
import { markBrowserAsInternalOwner } from '../../utils/analytics'

const MARKED_KEY = 'puddles-admin-posthog-internal'

type Status = 'idle' | 'working' | 'done' | 'error'

export function AdminMarkInternalAnalytics() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(MARKED_KEY) === '1') {
        setStatus('done')
        setMessage('This browser is marked internal.')
      }
    } catch {
      // Ignore storage errors (private mode, etc.).
    }
  }, [])

  async function handleClick() {
    setStatus('working')
    setMessage(null)
    try {
      await markBrowserAsInternalOwner()
      try {
        window.localStorage.setItem(MARKED_KEY, '1')
      } catch {
        // Identify succeeded; persistence is optional UI only.
      }
      setStatus('done')
      setMessage('Marked this browser as internal.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not mark this browser.')
    }
  }

  return (
    <div className="admin-mark-internal">
      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        onClick={() => void handleClick()}
        disabled={status === 'working'}
      >
        {status === 'working' ? 'Marking…' : 'Mark this browser as internal'}
      </button>
      {message ? (
        <p
          className={`admin-mark-internal-msg ${status === 'error' ? 'admin-mark-internal-msg-error' : ''}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
