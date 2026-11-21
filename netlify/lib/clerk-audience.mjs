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
 * @returns {Promise<{ userId: string, email: string } | null>}
 */
export async function readClerkAudienceUser(eventOrRequest) {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) return null

  const token = extractBearer(eventOrRequest) || extractSessionCookie(eventOrRequest)
  if (!token) return null

  try {
    const payload = await verifyToken(token, { secretKey: secret })
    const userId = typeof payload?.sub === 'string' ? payload.sub : ''
    if (!userId) return null

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

    if (!email) return null
    return { userId, email }
  } catch (error) {
    console.error('[audience] Clerk token verify failed', error)
    return null
  }
}
