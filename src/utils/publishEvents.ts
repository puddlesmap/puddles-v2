import type { Event } from '../types/event'

export const PUBLISH_EVENTS_PATH = '/api/publish-events'

export async function publishEventsToSite(events: Event[]): Promise<string> {
  const response = await fetch(PUBLISH_EVENTS_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  })

  let data: {
    ok?: boolean
    message?: string
    error?: string
  }
  try {
    data = (await response.json()) as { ok?: boolean; message?: string; error?: string }
  } catch {
    throw new Error('Publish request returned an invalid response')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Publish failed (${response.status})`)
  }

  return data.message || 'Published. The public site usually updates in 2–4 minutes.'
}
