export const TRIGGER_SYNC_PATH = '/api/trigger-sync'

export async function triggerPublishToSite(): Promise<string> {
  const response = await fetch(TRIGGER_SYNC_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })

  let data: { ok?: boolean; message?: string; error?: string }
  try {
    data = (await response.json()) as { ok?: boolean; message?: string; error?: string }
  } catch {
    throw new Error('Publish request returned an invalid response')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Publish failed (${response.status})`)
  }

  return data.message || 'Sync started. The public site usually updates in 2–4 minutes.'
}
