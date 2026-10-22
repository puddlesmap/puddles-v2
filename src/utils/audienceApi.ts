import type {
  AudienceAdminView,
  AudienceContinueResponse,
  AudienceSavePayload,
  NewsletterSignupSource,
} from '../types/audience'

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

function asContinue(body: Record<string, unknown>, ok: boolean): AudienceContinueResponse {
  return {
    ok,
    error: typeof body.error === 'string' ? body.error : ok ? undefined : 'Request failed.',
    userId: typeof body.userId === 'string' ? body.userId : undefined,
    email: typeof body.email === 'string' ? body.email : undefined,
    emailVerified: Boolean(body.emailVerified),
    saves: Array.isArray(body.saves)
      ? body.saves.filter(
          (row): row is { eventId: string; savedAt: string } =>
            Boolean(row && typeof row === 'object' && typeof (row as { eventId?: unknown }).eventId === 'string'),
        )
      : [],
  }
}

export async function continueAudience(input: {
  email: string
  userId?: string
  saves: AudienceSavePayload[]
}): Promise<AudienceContinueResponse> {
  const response = await fetch('/api/audience', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'continue',
      email: input.email,
      userId: input.userId,
      saves: input.saves,
    }),
  })
  const body = await readJson(response)
  return asContinue(body, response.ok && body.ok !== false)
}

export async function requestAudienceLogin(input: {
  email: string
  userId?: string
  saves: AudienceSavePayload[]
}): Promise<AudienceContinueResponse & { sent?: boolean; throttled?: boolean }> {
  const response = await fetch('/api/audience', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'request_login',
      email: input.email,
      userId: input.userId,
      saves: input.saves,
    }),
  })
  const body = await readJson(response)
  return {
    ...asContinue(body, response.ok && body.ok !== false),
    sent: Boolean(body.sent),
    throttled: Boolean(body.throttled),
  }
}

export async function fetchSavedSession(): Promise<AudienceContinueResponse> {
  const response = await fetch('/api/audience', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session' }),
  })
  const body = await readJson(response)
  return {
    ...asContinue(body, response.ok && body.ok !== false),
    email: typeof body.email === 'string' ? body.email : undefined,
  }
}

export async function syncAudienceSaves(input: {
  userId: string
  saves: AudienceSavePayload[]
}): Promise<AudienceContinueResponse> {
  const response = await fetch('/api/audience', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sync_saves',
      userId: input.userId,
      saves: input.saves,
    }),
  })
  const body = await readJson(response)
  return asContinue(body, response.ok && body.ok !== false)
}

export async function subscribeNewsletter(input: {
  email: string
  signupSource: NewsletterSignupSource
}): Promise<{ ok: boolean; error?: string; alreadySubscribed?: boolean }> {
  const response = await fetch('/api/audience', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'subscribe_newsletter',
      email: input.email,
      signupSource: input.signupSource,
    }),
  })
  const body = await readJson(response)
  return {
    ok: response.ok && body.ok !== false,
    error: typeof body.error === 'string' ? body.error : undefined,
    alreadySubscribed: Boolean(body.alreadySubscribed),
  }
}

export async function fetchAudienceAdmin(): Promise<AudienceAdminView> {
  const response = await fetch('/api/audience', { method: 'GET', credentials: 'same-origin' })
  const body = await readJson(response)
  if (!response.ok || body.ok === false) {
    return {
      ok: false,
      error: typeof body.error === 'string' ? body.error : 'Could not load audience.',
      rows: [],
      summary: { total: 0, parents: 0, verified: 0, newsletterOnly: 0, overlap: 0, subscribed: 0 },
    }
  }
  return {
    ok: true,
    rows: Array.isArray(body.rows) ? (body.rows as AudienceAdminView['rows']) : [],
    summary:
      body.summary && typeof body.summary === 'object'
        ? (body.summary as AudienceAdminView['summary'])
        : { total: 0, parents: 0, verified: 0, newsletterOnly: 0, overlap: 0, subscribed: 0 },
  }
}

export async function patchAudienceAdmin(input: {
  action: 'verify' | 'unsubscribe'
  userId?: string
  email?: string
}): Promise<AudienceAdminView> {
  const response = await fetch('/api/audience', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = await readJson(response)
  if (!response.ok || body.ok === false) {
    return {
      ok: false,
      error: typeof body.error === 'string' ? body.error : 'Could not update audience.',
      rows: [],
      summary: { total: 0, parents: 0, verified: 0, newsletterOnly: 0, overlap: 0, subscribed: 0 },
    }
  }
  return {
    ok: true,
    rows: Array.isArray(body.rows) ? (body.rows as AudienceAdminView['rows']) : [],
    summary:
      body.summary && typeof body.summary === 'object'
        ? (body.summary as AudienceAdminView['summary'])
        : { total: 0, parents: 0, verified: 0, newsletterOnly: 0, overlap: 0, subscribed: 0 },
  }
}
