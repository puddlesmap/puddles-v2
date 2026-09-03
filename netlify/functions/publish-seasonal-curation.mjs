import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import { publishSeasonalCurationToGithub } from '../lib/publish-seasonal-curation.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' })
  }

  if (!isAdminAuthEnabled() || !hasAdminSession(event)) {
    return unauthorizedResponse()
  }

  let body = {}
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })
  }

  const result = await publishSeasonalCurationToGithub({
    themeSlug: body.themeSlug,
    collectionEventIds: body.collectionEventIds || [],
    driveEventIds: body.driveEventIds || [],
  })

  return jsonResponse(result.status || (result.ok ? 200 : 502), {
    ok: result.ok,
    message: result.message,
    error: result.error,
    themeSlug: result.themeSlug,
    closeCount: result.closeCount,
    driveCount: result.driveCount,
  })
}
