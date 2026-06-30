import {
  clearSessionCookieHeader,
  createSessionToken,
  getAdminPassword,
  hasAdminSession,
  isAdminAuthEnabled,
  jsonResponse,
  sessionCookieHeader,
} from '../lib/admin-session.mjs'

export async function handler(event) {
  const method = event.httpMethod

  if (method === 'GET') {
    return jsonResponse(200, {
      ok: true,
      authRequired: isAdminAuthEnabled(),
      authenticated: hasAdminSession(event),
    })
  }

  if (method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' })
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })
  }

  if (body.action === 'logout') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearSessionCookieHeader(event),
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ ok: true }),
    }
  }

  if (!isAdminAuthEnabled()) {
    return jsonResponse(503, {
      ok: false,
      error: 'Admin password is not configured. Set ADMIN_PASSWORD on Netlify.',
    })
  }

  const password = String(body.password || '')
  if (!password || password !== getAdminPassword()) {
    return jsonResponse(401, { ok: false, error: 'Incorrect password' })
  }

  const token = createSessionToken()
  return jsonResponse(200, { ok: true }, {
    'Set-Cookie': sessionCookieHeader(token, event),
  })
}
