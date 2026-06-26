import { useState, type FormEvent } from 'react'
import type { Event } from '../types/event'
import { OUTDATED_REPORT_OPTIONS, type OutdatedReportType } from '../types/report'
import { submitOutdatedReport } from '../utils/intake'
import { eventAnalyticsProps, track } from '../utils/analytics'

interface ReportOutdatedFormProps {
  event: Event
  onCancel: () => void
  onSuccess: () => void
}

export function ReportOutdatedForm({ event, onCancel, onSuccess }: ReportOutdatedFormProps) {
  const [reportType, setReportType] = useState<OutdatedReportType | null>(null)
  const [userNote, setUserNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(eventForm: FormEvent) {
    eventForm.preventDefault()
    if (!reportType || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await submitOutdatedReport({
        eventId: event.id,
        eventName: event.title,
        reportType,
        userNote: userNote.trim(),
        submittedAt: new Date().toISOString(),
      })
      track('report_outdated_submit', eventAnalyticsProps(event, { report_type: reportType }))
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="report-outdated-form" onSubmit={handleSubmit}>
      <fieldset className="report-outdated-options">
        <legend className="report-outdated-legend">What seems off?</legend>
        <div className="report-outdated-option-list">
          {OUTDATED_REPORT_OPTIONS.map((option) => (
            <label key={option.value} className="report-outdated-option">
              <input
                type="radio"
                name="reportType"
                value={option.value}
                checked={reportType === option.value}
                onChange={() => setReportType(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="report-outdated-note-label" htmlFor={`report-note-${event.id}`}>
        Tell us what changed <span className="text-muted">(optional)</span>
      </label>
      <textarea
        id={`report-note-${event.id}`}
        value={userNote}
        onChange={(e) => setUserNote(e.target.value)}
        rows={3}
        placeholder="Anything else we should know?"
        className="input-field report-outdated-note"
      />

      {error && (
        <p className="report-outdated-error" role="alert">
          {error}
        </p>
      )}

      <div className="report-outdated-actions">
        <button
          type="submit"
          disabled={!reportType || isSubmitting}
          className="btn-primary report-outdated-submit disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Sending…' : 'Submit report'}
        </button>
        <button type="button" onClick={onCancel} className="report-outdated-cancel">
          Cancel
        </button>
      </div>
    </form>
  )
}
