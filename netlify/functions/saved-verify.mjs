import { jsonResponse } from '../lib/admin-session.mjs'
import { applyConsumeLoginToken, bindAudienceRequest } from '../lib/audience-store.mjs'
import {
  createParentSessionToken,
  parentSessionCookieHeader,
  requestHost,
  requestOrigin,
} from '../lib/parent-session.mjs'

function redirect(location, cookie, event) {
  return {
    statusCode: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
    },
    body: '',
  }
}

export async function handler(event) {
  bindAudienceRequest(event)
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'Use GET.' })
  }

  const params = event.queryStringParameters || {}
  const token = typeof params.token === 'string' ? params.token : ''
  const origin = requestOrigin(event)
  const host = requestHost(event)

  if (!token) {
    return redirect(`${origin}/saved?verify=missing`, null, event)
  }

  try {
    const result = await applyConsumeLoginToken({ token })
    if (!result?.ok || !result.parent?.userId) {
      return redirect(`${origin}/saved?verify=failed`, null, event)
    }
    const cookie = parentSessionCookieHeader(createParentSessionToken(result.parent.userId), host)
    return redirect(`${origin}/saved?verify=ok`, cookie, event)
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Verify failed.',
    })
  }
}
