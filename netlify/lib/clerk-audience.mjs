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
  return (
    String(cookieHeader)
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('__session='))
      ?.slice('__session='.length) || ''
  )
}

/**
 * Verify Clerk session and return userId + primary email.
 * Distinguishes missing server config so clients aren't told "Not signed in"
 * when the function simply lacks CLERK_SECRET_KEY.
 *
 * @param {unknown} eventOrRequest
 * @param {{ bearerToken?: string } | undefined} options
 *   Optional body-delivered session JWT (Netlify rewrites sometimes drop Authorization).
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
    return { ok: false, error: 'Not signed in.', status: 401 }
  }

  try {
    const payload = await verifyToken(token, { secretKey: secret })
    const userId = typeof payload?.sub === 'string' ? payload.sub : ''
    if (!userId) {
      return { ok: false, error: 'Not signed in.', status: 401 }
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
    return { ok: false, error: 'Not signed in.', status: 401 }
  }
}
