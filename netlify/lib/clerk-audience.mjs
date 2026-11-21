import { createClerkClient, verifyToken } from '@clerk/backend'

function readHeader(eventOrRequest, name) {
  if (typeof eventOrRequest?.headers?.get === 'function') {
    return eventOrRequest.headers.get(name) || ''
  }
  const headers = eventOrRequest?.headers || {}
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return Array.isArray(value) ? value[0] : value || ''
  }
  return ''
}

function extractBearer(eventOrRequest) {
  const authHeader = readHeader(eventOrRequest, 'authorization')
  return String(authHeader).match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || ''
}

function extractSessionCookie(eventOrRequest) {
  const cookieHeader = readHeader(eventOrRequest, 'cookie')
  if (!cookieHeader) return ''
  // Clerk may use __session or __client_uat + session variants; prefer __session JWT.
  const parts = String(cookieHeader).split(';').map((part) => part.trim())
  for (const name of ['__session', '__session_', '__client']) {
    const hit = parts.find((part) => part.startsWith(`${name}=`))
    if (hit) {
      const value = hit.slice(name.length + 1)
      if (value && value.split('.').length >= 3) return value
    }
  }
  return ''
}

function secretKeyKind(secret) {
  if (secret.startsWith('sk_live_')) return 'live'
  if (secret.startsWith('sk_test_')) return 'test'
  return 'other'
}

function publishableKeyKind(publishable) {
  if (publishable.startsWith('pk_live_')) return 'live'
  if (publishable.startsWith('pk_test_')) return 'test'
  return 'other'
}

/** Decode Clerk Frontend API host from publishable key (public, not secret). */
export function publishableInstanceHost(publishable) {
  const raw = String(publishable || '').split('_').slice(2).join('_')
  if (!raw) return null
  try {
    const pad = '='.repeat((4 - (raw.length % 4)) % 4)
    const decoded = Buffer.from(raw + pad, 'base64').toString('utf8').replace(/\$$/, '')
    return decoded || null
  } catch {
    return null
  }
}

/**
 * Safe status for ops — never returns key material.
 * Optionally probes Clerk Backend with the configured secret.
 */
export async function clerkSecretStatus() {
  const secret = process.env.CLERK_SECRET_KEY?.trim() || ''
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || ''
  const clerkSecretKind = secret ? secretKeyKind(secret) : null
  const clerkPublishableKind = publishable ? publishableKeyKind(publishable) : null
  const status = {
    clerkSecretConfigured: Boolean(secret),
    clerkSecretKind,
    clerkPublishableKind,
    kindsMatch:
      Boolean(clerkSecretKind && clerkPublishableKind) && clerkSecretKind === clerkPublishableKind,
    publishableInstance: publishableInstanceHost(publishable),
    secretWorks: null,
    secretProbeError: null,
  }

  if (!secret) return status

  try {
    const clerk = createClerkClient({ secretKey: secret })
    // Lightweight auth check: secret must be accepted by Clerk Backend API.
    await clerk.users.getUserList({ limit: 1 })
    status.secretWorks = true
  } catch (error) {
    status.secretWorks = false
    status.secretProbeError =
      error instanceof Error ? error.message.slice(0, 160) : 'Clerk secret probe failed.'
  }
  return status
}

function verifyFailureMessage(error) {
  const message = error instanceof Error ? error.message : String(error || '')
  const reason = error?.reason || error?.code || ''
  const combined = `${reason} ${message}`.toLowerCase()
  if (/expired|token-expired|jwtexpired/i.test(combined)) {
    return 'Clerk session expired — sign out and sign in again on this device.'
  }
  if (/jwk|secret|invalid secret|unauthorized/i.test(combined)) {
    return 'Clerk secret key does not match this site’s publishable key (check Netlify Production CLERK_SECRET_KEY).'
  }
  if (/authorized.?part|azp|origin/i.test(combined)) {
    return 'Clerk session origin was rejected.'
  }
  if (message) return `Clerk session could not be verified (${message.slice(0, 120)}).`
  return 'Clerk session could not be verified.'
}

/**
 * Verify Clerk session and return userId + primary email.
 *
 * @param {unknown} eventOrRequest
 * @param {{ bearerToken?: string } | undefined} options
 * @returns {Promise<
 *   | { ok: true, userId: string, email: string }
 *   | { ok: false, error: string, status: number }
 * >}
 */
export async function readClerkAudienceUser(eventOrRequest, options = {}) {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) {
    console.error('[audience] CLERK_SECRET_KEY is not set on this function')
    return { ok: false, error: 'Server missing Clerk secret.', status: 503 }
  }

  const fromBody =
    typeof options?.bearerToken === 'string' && options.bearerToken.trim()
      ? options.bearerToken.trim()
      : ''
  const token =
    fromBody || extractBearer(eventOrRequest) || extractSessionCookie(eventOrRequest)
  if (!token) {
    return { ok: false, error: 'No Clerk session token received by the server.', status: 401 }
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: secret,
      clockSkewInMs: 15_000,
    })
    const userId = typeof payload?.sub === 'string' ? payload.sub : ''
    if (!userId) {
      return { ok: false, error: 'Clerk session token missing user id.', status: 401 }
    }

    let email =
      (typeof payload?.email === 'string' && payload.email) ||
      (typeof payload?.primary_email_address === 'string' && payload.primary_email_address) ||
      ''

    if (!email) {
      const clerk = createClerkClient({ secretKey: secret })
      const user = await clerk.users.getUser(userId)
      email =
        user.emailAddresses?.find((row) => row.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        ''
    }

    if (!email) {
      return { ok: false, error: 'Clerk account has no email.', status: 400 }
    }
    return { ok: true, userId, email }
  } catch (error) {
    console.error('[audience] Clerk token verify failed', error)
    return { ok: false, error: verifyFailureMessage(error), status: 401 }
  }
}
