const LOOPS_API = 'https://app.loops.so/api/v1'

export function loopsConfigured() {
  return Boolean(process.env.LOOPS_API_KEY?.trim() && process.env.LOOPS_TRANSACTIONAL_ID?.trim())
}

export function loopsContactsConfigured() {
  return Boolean(process.env.LOOPS_API_KEY?.trim())
}

async function loopsRequest(method, path, body) {
  const key = process.env.LOOPS_API_KEY?.trim()
  if (!key) return { ok: false, skipped: true }
  const response = await fetch(`${LOOPS_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  return {
    ok: response.ok && data.success !== false,
    status: response.status,
    data,
  }
}

function mailingLists(subscribed) {
  const listId = process.env.LOOPS_MAILING_LIST_ID?.trim()
  if (!listId) return undefined
  return { [listId]: Boolean(subscribed) }
}

/** Transactional magic-link send. Never addToAudience. */
export async function sendMagicLinkEmail({ email, loginUrl }) {
  const transactionalId = process.env.LOOPS_TRANSACTIONAL_ID?.trim()
  if (!loopsConfigured()) {
    console.info(`[audience] Magic link (Loops unset): ${loginUrl}`)
    return { ok: true, skipped: true }
  }

  const result = await loopsRequest('POST', '/transactional', {
    transactionalId,
    email,
    dataVariables: { loginUrl },
  })
  if (!result.ok) {
    console.error('[audience] Loops transactional send failed', result.status, result.data)
  }
  return result
}

export async function upsertNewsletterContact({ email, userId, subscribed = true, source = 'puddles_picks' }) {
  if (!loopsContactsConfigured()) return { ok: true, skipped: true }

  const payload = {
    email,
    subscribed: Boolean(subscribed),
    source,
    ...(userId ? { userId } : {}),
    ...(mailingLists(subscribed) ? { mailingLists: mailingLists(subscribed) } : {}),
  }

  const updated = await loopsRequest('PUT', '/contacts/update', payload)
  if (updated.ok) {
    return { ok: true, id: updated.data?.id }
  }

  const created = await loopsRequest('POST', '/contacts/create', payload)
  if (created.ok) {
    return { ok: true, id: created.data?.id }
  }

  console.error('[audience] Loops contact upsert failed', created.status, created.data)
  return created
}

/** Link a verified parent without creating a marketing contact. */
export async function setLoopsContactUserId({ email, userId }) {
  if (!loopsContactsConfigured() || !email || !userId) return { ok: true, skipped: true }
  const result = await loopsRequest('PUT', '/contacts/update', { email, userId })
  if (!result.ok && result.status !== 404) {
    console.error('[audience] Loops contact userId update failed', result.status, result.data)
  }
  return result
}
