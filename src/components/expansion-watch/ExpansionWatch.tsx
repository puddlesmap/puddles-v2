import { useEffect, useId, useState, type ReactNode } from 'react'
import { CommunityCtaCard } from '../brand/CommunityCtaCard'
import type { BrowseFilters } from '../../utils/filters'
import type { ExpansionWatchSourceContext } from '../../types/expansionWatch'
import { submitExpansionWatch } from '../../utils/expansionWatch'
import { trackExpansionWatchSubmitted } from '../../utils/analytics'

interface ExpansionWatchProps {
  sourceContext: ExpansionWatchSourceContext
  defaultLocation?: string
  selectedCity?: string
  selectedFilters?: Partial<BrowseFilters>
  className?: string
  /** Called after a successful submission (before success UI renders). */
  onSuccess?: (details: { requestedLocation: string }) => void
  /** Called when submit fails after validation. */
  onError?: () => void
  /** Extra content under the success card body (e.g. a primary CTA). */
  successActions?: ReactNode
  /** Welcome surfaces show City/ZIP before Email. */
  fieldOrder?: 'email-first' | 'location-first'
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
  onSuccess,
  onError,
  successActions,
  fieldOrder = 'email-first',
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

    if (!trimmedLocation) {
      setError('Please enter your city or ZIP code.')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
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
      trackExpansionWatchSubmitted({
        requestedLocation: trimmedLocation,
        sourceContext,
      })
      setIsSuccess(true)
      onSuccess?.({ requestedLocation: trimmedLocation })
    } catch (submitError) {
      onError?.()
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not save your request. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const rootClass = [
    'expansion-watch',
    isSuccess ? 'expansion-watch--success' : '',
    isSuccess && successActions ? 'expansion-watch--success-with-actions' : '',
    className,
  ]
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
        {successActions}
      </CommunityCtaCard>
    )
  }

  const locationField = (
    <div className="expansion-watch-field" key="location">
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
  )

  const emailField = (
    <div className="expansion-watch-field" key="email">
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
  )

  return (
    <CommunityCtaCard
      title="Want Puddles nearby?"
      body="Drop your city or ZIP code, and we'll email you when we launch nearby."
      className={rootClass}
    >
      <form className="expansion-watch-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="expansion-watch-fields">
          {fieldOrder === 'location-first' ? (
            <>
              {locationField}
              {emailField}
            </>
          ) : (
            <>
              {emailField}
              {locationField}
            </>
          )}
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
