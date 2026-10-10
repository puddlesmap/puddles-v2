import { jsonResponse } from '../lib/admin-session.mjs'
import { hasAdminSession, isAdminAuthEnabled } from '../lib/admin-session.mjs'
import { authorizeUrl, exchangeCode } from '../lib/instagram-publish.mjs'
import { readState, writeState } from '../lib/social-studio-store.mjs'

function adminOk(event) {
  if (!isAdminAuthEnabled()) return true
  return hasAdminSession(event)
}

export async function handler(event) {
  if (!adminOk(event)) return jsonResponse(401, { ok: false, error: 'Unauthorized' })
  const params = event.queryStringParameters || {}
  const host = event.headers?.host || event.headers?.['x-forwarded-host']
  const proto = event.headers?.['x-forwarded-proto'] || 'https'
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${proto}://${host}/.netlify/functions/instagram-oauth`

  if (params.code) {
    try {
      const token = await exchangeCode(params.code, redirectUri)
      const state = await readState()
      state.instagram = token
      await writeState(state)
      return {
        statusCode: 302,
        headers: { Location: '/admin/social' },
        body: '',
      }
    } catch (error) {
      return jsonResponse(502, { ok: false, error: error.message })
    }
  }

  const url = authorizeUrl(redirectUri)
  if (!url) {
    return jsonResponse(200, {
      ok: false,
      mode: 'mock',
      error: 'Instagram app is not configured. Publishing stays in mock mode.',
    })
  }
  return {
    statusCode: 302,
    headers: { Location: url },
    body: '',
  }
}
