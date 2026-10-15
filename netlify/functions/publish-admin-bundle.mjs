import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import { publishAdminBundle } from '../lib/publish-bundle.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { ok: false, error: 'Method not allowed' })
  if (isAdminAuthEnabled() && !hasAdminSession(event)) return unauthorizedResponse()

  let body = {}
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })
  }
  const result = await publishAdminBundle({
    items: body.items || [],
    seasonal: body.seasonal || null,
  })
  return jsonResponse(result.status || (result.ok ? 200 : 502), result)
}
