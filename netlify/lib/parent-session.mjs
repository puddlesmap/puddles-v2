import crypto from 'node:crypto'
import { parseCookies } from './admin-session.mjs'

export const PARENT_SESSION_COOKIE = 'puddles_parent_session'
const SESSION_MS = 30 * 24 * 60 * 60 * 1000

function getParentSessionSecret() {
  return (
    process.env.PARENT_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    'puddles-parent-dev-secret'
  )
}

function isProductionHost(host = '') {
  return !host.includes('localhost') && !host.includes('127.0.0.1')
}

export function createParentSessionToken(userId) {
  const exp = Date.now() + SESSION_MS
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', getParentSessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyParentSessionToken(token) {
  if (!token) return null
  const [payload, signature] = String(token).split('.')
  if (!payload || !signature) return null

  const expected = crypto.createHmac('sha256', getParentSessionSecret()).update(payload).digest('base64url')
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return null
  if (!crypto.timingSafeEqual(left, right)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof parsed.userId !== 'string' || !parsed.userId) return null
    if (typeof parsed.exp !== 'number' || Date.now() >= parsed.exp) return null
    return { userId: parsed.userId, exp: parsed.exp }
  } catch {
    return null
  }
}

export function readParentSession(eventOrRequest) {
  const cookieHeader =
    eventOrRequest?.headers?.cookie ||
    eventOrRequest?.headers?.Cookie ||
    (typeof eventOrRequest?.headers?.get === 'function' ? eventOrRequest.headers.get('cookie') : '') ||
    ''
  const cookies = parseCookies(cookieHeader)
  return verifyParentSessionToken(cookies[PARENT_SESSION_COOKIE])
}

export function parentSessionCookieHeader(token, host = '') {
  const parts = [
    `${PARENT_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  ]
  if (isProductionHost(host)) parts.push('Secure')
  return parts.join('; ')
}

export function requestHost(eventOrRequest) {
  if (typeof eventOrRequest?.headers?.get === 'function') {
    return eventOrRequest.headers.get('host') || ''
  }
  return eventOrRequest?.headers?.host || eventOrRequest?.headers?.Host || ''
}

export function requestOrigin(eventOrRequest) {
  const fromEnv = process.env.SITE_URL?.trim() || process.env.URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = requestHost(eventOrRequest)
  if (!host) return 'http://127.0.0.1:3456'
  const proto =
    (typeof eventOrRequest?.headers?.get === 'function'
      ? eventOrRequest.headers.get('x-forwarded-proto')
      : eventOrRequest?.headers?.['x-forwarded-proto']) ||
    (isProductionHost(host) ? 'https' : 'http')
  return `${proto}://${host}`
}
