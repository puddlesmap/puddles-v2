/** Shared contact / privacy-request intake — validation + inbox email (server only). */

export const CONTACT_TOPICS = [
  'general',
  'privacy',
  'event',
  'other',
]

export const CONTACT_TOPIC_LABELS = {
  general: 'General question',
  privacy: 'Privacy or data request',
  event: 'Event or content question',
  other: 'Other',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function topicLabel(topic) {
  return CONTACT_TOPIC_LABELS[topic] || 'Other'
}

/**
 * @returns {{ ok: true, data: object } | { ok: false, error: string, status: number }}
 */
export function validateContactPayload(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Invalid request.', status: 400 }
  }

  // Honeypot — bots fill hidden fields; treat as success without storing.
  if (typeof input.company === 'string' && input.company.trim()) {
    return { ok: true, data: { spam: true } }
  }

  const topic = String(input.topic || '').trim()
  if (!CONTACT_TOPICS.includes(topic)) {
    return { ok: false, error: 'Choose a topic.', status: 400 }
  }

  const email = normalizeEmail(input.email)
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { ok: false, error: 'Enter a valid email address.', status: 400 }
  }

  const message = String(input.message || '').trim()
  if (message.length < 5) {
    return { ok: false, error: 'Please include a short message.', status: 400 }
  }
  if (message.length > 4000) {
    return { ok: false, error: 'Message is too long.', status: 400 }
  }

  return {
    ok: true,
    data: {
      spam: false,
      topic,
      email,
      message,
      submittedAt: new Date().toISOString(),
    },
  }
}

export function contactSubmissionPayload(data) {
  const label = topicLabel(data.topic)
  return {
    submissionType: 'Contact',
    eventName: `Contact · ${label}`,
    additionalInfo: data.message,
    submittedByEmail: data.email,
    submittedAt: data.submittedAt,
    sourceContext: data.topic === 'privacy' ? 'privacy_request' : `contact_${data.topic}`,
    types: label,
    internalNotes:
      data.topic === 'privacy'
        ? 'Privacy / data request — verify identity before access or deletion. Check Clerk, Saved (audience blob), Loops newsletter, and related submissions.'
        : '',
  }
}

export async function sendContactInboxEmail(data, env = process.env) {
  const to = String(env.CONTACT_INBOX_EMAIL || env.SOCIAL_ALERT_EMAIL || '').trim()
  const key = String(env.RESEND_API_KEY || '').trim()
  if (!to || !key) {
    return { ok: false, skipped: true, error: 'Inbox email is not configured.' }
  }

  const label = topicLabel(data.topic)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || env.SOCIAL_ALERT_FROM || 'Puddles <alerts@puddlesmap.com>',
      to: [to],
      reply_to: data.email,
      subject: `[Puddles contact] ${label}`,
      text: [
        `Topic: ${label}`,
        `From: ${data.email}`,
        `Submitted: ${data.submittedAt}`,
        '',
        data.message,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return {
      ok: false,
      skipped: false,
      error: `Could not deliver message (${response.status}): ${detail.slice(0, 160)}`,
    }
  }

  return { ok: true, skipped: false }
}

/**
 * Process a contact form POST body.
 * Always emails when configured; also stores a Contact row in Admin submissions when GitHub is available.
 */
export async function processContactRequest(body, { appendSubmission, env = process.env } = {}) {
  const validated = validateContactPayload(body)
  if (!validated.ok) return validated

  if (validated.data.spam) {
    return { ok: true, status: 200 }
  }

  const data = validated.data
  const emailed = await sendContactInboxEmail(data, env)

  let stored = { ok: false, skipped: true }
  if (typeof appendSubmission === 'function') {
    try {
      const result = await appendSubmission({ payload: contactSubmissionPayload(data), env })
      stored = {
        ok: Boolean(result?.ok),
        skipped: false,
        id: result?.submission?.id,
        error: result?.error,
      }
    } catch (error) {
      stored = {
        ok: false,
        skipped: false,
        error: error instanceof Error ? error.message : 'Could not store message',
      }
    }
  }

  // Prefer successful inbox delivery; allow store-only when email is unset (local).
  if (emailed.ok) {
    return { ok: true, status: 200 }
  }

  if (emailed.skipped && stored.ok) {
    return { ok: true, status: 200 }
  }

  if (emailed.skipped && !stored.ok) {
    return {
      ok: false,
      status: 503,
      error: 'Contact form is not configured yet. Please try again later.',
    }
  }

  // Email failed but we stored — still succeed so parents are not stuck; admin has the row.
  if (stored.ok) {
    return { ok: true, status: 200 }
  }

  return {
    ok: false,
    status: 502,
    error: 'Could not send your message. Please try again.',
  }
}
