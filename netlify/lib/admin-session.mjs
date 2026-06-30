import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE = 'puddles_admin_session'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || ''
}

export function isAdminAuthEnabled() {
  return Boolean(getAdminPassword())
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPassword()
}

function isProductionEvent(event) {
  const host = event?.headers?.host || ''
  return !host.includes('localhost') && !host.includes('127.0.0.1')
}

export function parseCookies(header = '') {
  const cookies = {}
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey) continue
    cookies[rawKey] = decodeURIComponent(rest.join('='))
  }
  return cookies
}

export function createSessionToken() {
  const exp = Date.now() + SESSION_MS
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySessionToken(token) {
  if (!isAdminAuthEnabled()) return true
  if (!token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
  if (signature.length !== expected.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

export function hasAdminSession(event) {
  const cookies = parseCookies(event?.headers?.cookie || event?.headers?.Cookie || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE])
}

export function sessionCookieHeader(token, event) {
  const secure = isProductionEvent(event)
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookieHeader(event) {
  const secure = isProductionEvent(event)
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

export function unauthorizedResponse() {
  return jsonResponse(401, { ok: false, error: 'Unauthorized' })
}
