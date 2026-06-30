import { useEffect, useId, useState } from 'react'
import { CommunityCtaCard } from '../brand/CommunityCtaCard'
import type { BrowseFilters } from '../../utils/filters'
import type { ExpansionWatchSourceContext } from '../../types/expansionWatch'
import { submitExpansionWatch } from '../../utils/expansionWatch'
import { track } from '../../utils/analytics'

interface ExpansionWatchProps {
  sourceContext: ExpansionWatchSourceContext
  defaultLocation?: string
  selectedCity?: string
  selectedFilters?: Partial<BrowseFilters>
  className?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function ExpansionWatch({
  sourceContext,
  defaultLocation = '',
  selectedCity,
  selectedFilters,
  className = '',
}: ExpansionWatchProps) {
  const formId = useId()
  const emailId = `${formId}-email`
  const locationId = `${formId}-location`

  const [email, setEmail] = useState('')
  const [location, setLocation] = useState(defaultLocation)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocation(defaultLocation)
  }, [defaultLocation])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    const trimmedLocation = location.trim()

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!trimmedLocation) {
      setError('Please enter your city or ZIP code.')
      return
    }

    setIsSubmitting(true)

    try {
      await submitExpansionWatch({
        email: trimmedEmail,
        requestedLocation: trimmedLocation,
        sourceContext,
        selectedCity,
        selectedFilters,
        submittedAt: new Date().toISOString(),
      })
      track('expansion_watch_submit', {
        source_context: sourceContext,
        ...(selectedCity ? { selected_city: selectedCity } : {}),
      })
      setIsSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not save your request. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const rootClass = ['expansion-watch', isSuccess ? 'expansion-watch--success' : '', className]
    .filter(Boolean)
    .join(' ')

  if (isSuccess) {
    return (
      <CommunityCtaCard
        title="You're on the list"
        body="Thank you! We'll let you know when we expand your way."
        className={rootClass}
      >
        <span className="sr-only" role="status">
          Sign-up received
        </span>
      </CommunityCtaCard>
    )
  }

  return (
    <CommunityCtaCard
      title="Want Puddles nearby?"
      body="Drop your city or ZIP code, and we'll email you when we launch nearby."
      className={rootClass}
    >
      <form className="expansion-watch-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="expansion-watch-fields">
          <div className="expansion-watch-field">
            <label className="share-field-label mb-2 block" htmlFor={emailId}>
              Email
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="input-field"
            />
          </div>

          <div className="expansion-watch-field">
            <label className="share-field-label mb-2 block" htmlFor={locationId}>
              City or ZIP
            </label>
            <input
              id={locationId}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Jose or 95126"
              autoComplete="postal-code"
              required
              className="input-field"
            />
          </div>
        </div>

        {error ? (
          <p className="expansion-watch-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary expansion-watch-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Keep me posted'}
        </button>
      </form>
    </CommunityCtaCard>
  )
}
