'use client'

/** Presentational Remind me row — matches event detail rail styling. */
export function SavedReminderToggleRow({
  on,
  disabled = false,
  hint = 'Email me one day before this activity.',
  onToggle,
}: {
  on: boolean
  disabled?: boolean
  hint?: string
  onToggle?: () => void
}) {
  return (
    <div className="saved-reminder-toggle">
      <div className="saved-reminder-toggle__copy">
        <span className="saved-reminder-toggle__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a5 5 0 0 0-5 5v2.5c0 .9-.3 1.8-.8 2.5L5 15.5h14l-1.2-2.5c-.5-.7-.8-1.6-.8-2.5V8a5 5 0 0 0-5-5Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="saved-reminder-toggle__title">Remind me</p>
          <p className="saved-reminder-toggle__hint">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        className={`saved-reminder-toggle__switch${on ? ' saved-reminder-toggle__switch--on' : ''}`}
        role="switch"
        aria-checked={on}
        aria-label={on ? 'Turn off day-before email reminder' : 'Turn on day-before email reminder'}
        disabled={disabled}
        onClick={onToggle}
      />
    </div>
  )
}
