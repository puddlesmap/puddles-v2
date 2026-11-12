'use client'

import { useEffect, useState } from 'react'
import { useSavedOptional } from '../../context/SavedContext'
import { getCatalogEventById } from '../../utils/eventPages'
import { ANALYTICS_EVENTS, trackEvent } from '../../utils/analytics'
import { canOfferSavedReminder } from '../../utils/savedReminder'

const PROMPT_KEY = 'puddles_reminder_prompt'

export function stashReminderPrompt(eventId: string, eventTitle: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PROMPT_KEY, JSON.stringify({ eventId, eventTitle }))
}

function readStashedPrompt(): { eventId: string; eventTitle: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PROMPT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { eventId?: string; eventTitle?: string }
    if (!parsed?.eventId) return null
    return { eventId: parsed.eventId, eventTitle: parsed.eventTitle || 'this activity' }
  } catch {
    return null
  }
}

/** After SSO sign-in, offer day-before email for the activity that triggered sign-in. */
export function SavedReminderPromptSheet() {
  const saved = useSavedOptional()
  const [prompt, setPrompt] = useState<{ eventId: string; eventTitle: string } | null>(null)

  useEffect(() => {
    if (!saved?.signedInEmail) return
    const stashed = readStashedPrompt()
    if (!stashed) return
    const event = getCatalogEventById(stashed.eventId)
    if (!event || !canOfferSavedReminder(event) || !saved.isSaved(stashed.eventId)) {
      sessionStorage.removeItem(PROMPT_KEY)
      return
    }
    setPrompt(stashed)
  }, [saved, saved?.signedInEmail])

  if (!saved || !prompt) return null

  function dismiss(declined: boolean) {
    sessionStorage.removeItem(PROMPT_KEY)
    setPrompt(null)
    trackEvent(
      declined
        ? ANALYTICS_EVENTS.SAVED_REMINDER_PROMPT_DECLINED
        : ANALYTICS_EVENTS.SAVED_REMINDER_PROMPT_ACCEPTED,
      { event_id: prompt!.eventId },
    )
  }

  return (
    <div className="saved-signin-overlay" role="presentation">
      <button type="button" className="saved-signin-backdrop" aria-label="Close" onClick={() => dismiss(true)} />
      <div className="saved-signin-sheet saved-reminder-prompt" role="dialog" aria-modal="true">
        <h2 className="saved-signin-title">Day-before email?</h2>
        <p className="saved-signin-lede">
          Want a reminder email one day before <strong>{prompt.eventTitle}</strong>? Not the Puddles Picks
          newsletter.
        </p>
        <button
          type="button"
          className="btn-primary saved-signin-submit"
          onClick={() => {
            void saved.setReminder(prompt.eventId, true).then(() => dismiss(false))
          }}
        >
          Yes, remind me
        </button>
        <button type="button" className="saved-signin-dismiss" onClick={() => dismiss(true)}>
          Not now
        </button>
      </div>
    </div>
  )
}
