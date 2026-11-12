export const CONTACT_API_PATH = '/api/contact'

export type ContactTopic = 'general' | 'privacy' | 'event' | 'other'

export const CONTACT_TOPIC_OPTIONS: Array<{ value: ContactTopic; label: string }> = [
  { value: 'general', label: 'General question' },
  { value: 'privacy', label: 'Privacy or data request' },
  { value: 'event', label: 'Event or content question' },
  { value: 'other', label: 'Other' },
]

export async function submitContactMessage(input: {
  topic: ContactTopic
  email: string
  message: string
  /** Honeypot — leave empty. */
  company?: string
}): Promise<void> {
  const response = await fetch(CONTACT_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      topic: input.topic,
      email: input.email.trim(),
      message: input.message.trim(),
      company: input.company ?? '',
    }),
  })

  let data: { ok?: boolean; error?: string } = {}
  try {
    data = (await response.json()) as typeof data
  } catch {
    throw new Error('Could not send your message. Please try again.')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Could not send your message. Please try again.')
  }
}
