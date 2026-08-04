import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import { publishEventsToGithub } from '../lib/publish-events.mjs'

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

  const result = await publishEventsToGithub({ events: body.events || [] })
  return jsonResponse(result.status || (result.ok ? 200 : 502), {
    ok: result.ok,
    message: result.message,
    error: result.error,
    upserted: result.upserted,
    inserted: result.inserted,
    eventCount: result.eventCount,
    liveCount: result.liveCount,
  })
}
