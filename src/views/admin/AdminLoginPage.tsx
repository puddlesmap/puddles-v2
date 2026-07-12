import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loginAdmin } from '../../utils/adminAuth'

interface AdminLoginPageProps {
  onSuccess: () => void
}

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await loginAdmin(password)
      onSuccess()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <p className="admin-auth-eyebrow">Puddles Admin</p>
        <h1 className="admin-auth-title">Sign in</h1>
        <p className="admin-auth-body">Enter the admin password to open the operations dashboard.</p>

        <form className="admin-auth-form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="share-field-label mb-2 block" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="input-field"
          />

          {error ? (
            <p className="admin-auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary admin-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="admin-auth-back">
          Back to site
        </Link>
      </div>
    </div>
  )
}
