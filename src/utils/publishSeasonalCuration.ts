export const PUBLISH_SEASONAL_CURATION_PATH = '/api/publish-seasonal-curation'

export async function publishSeasonalCurationToSite(input: {
  themeSlug: string
  collectionEventIds: string[]
  driveEventIds: string[]
}): Promise<string> {
  const response = await fetch(PUBLISH_SEASONAL_CURATION_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  let data: {
    ok?: boolean
    message?: string
    error?: string
  }
  try {
    data = (await response.json()) as { ok?: boolean; message?: string; error?: string }
  } catch {
    throw new Error('Publish curation request returned an invalid response')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Publish curation failed (${response.status})`)
  }

  return data.message || 'Curation published. The public site usually updates in 2–4 minutes.'
}
