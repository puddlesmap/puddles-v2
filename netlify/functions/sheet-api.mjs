const PUBLIC_ACTIONS = new Set(['appendSubmission'])

import { hasAdminSession, isAdminAuthEnabled } from '../lib/admin-session.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) }
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL
  if (!scriptUrl) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Sheet API not configured. Set GOOGLE_APPS_SCRIPT_URL in Netlify.',
      }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    }
  }

  const secret = process.env.PUDDLES_API_SECRET
  const clientKey = event.headers['x-puddles-api-key'] || event.headers['X-Puddles-Api-Key']
  const isPublicAction = PUBLIC_ACTIONS.has(body.action)

  if (!isPublicAction && isAdminAuthEnabled() && !hasAdminSession(event)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Unauthorized' }),
    }
  }

  if (!isPublicAction && secret && clientKey !== secret) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Unauthorized' }),
    }
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    })
    const text = await response.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { ok: false, error: text || 'Invalid response from Google Apps Script' }
    }

    return {
      statusCode: response.ok && parsed.ok !== false ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    }
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Sheet API proxy failed',
      }),
    }
  }
}
