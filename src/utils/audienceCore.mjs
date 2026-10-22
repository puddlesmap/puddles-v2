/** Three connected audience collections — no event catalog copies, no emails in git. */

export const NEWSLETTER_CONSENT_VERSION = 'v1'

export const NEWSLETTER_SOURCES = [
  'puddles_picks',
  'puddles_picks_card',
  'puddles_picks_pill',
  'puddles_picks_popup',
  'homepage',
  'guide',
  'footer',
  'admin',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000
export const LOGIN_SEND_COOLDOWN_MS = 60 * 1000

export function emptyAudience() {
  return { parents: [], savedEvents: [], newsletter: [], loginTokens: [] }
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isValidEmail(value) {
  return EMAIL_RE.test(normalizeEmail(value))
}

export function createUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `saved_${crypto.randomUUID()}`
  }
  return `saved_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function isActiveSave(row) {
  if (!row || !row.eventId) return false
  if (!row.removedAt) return true
  const saved = Date.parse(row.savedAt || '')
  const removed = Date.parse(row.removedAt)
  if (Number.isNaN(saved) || Number.isNaN(removed)) return !row.removedAt
  return saved > removed
}

function laterIso(a, b) {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

function earlierIso(a, b) {
  if (!a) return b
  if (!b) return a
  return a < b ? a : b
}

function asSaveInput(value, userId) {
  if (!value || typeof value !== 'object') return null
  const eventId = String(value.eventId || '').trim()
  if (!eventId) return null
  const savedAt = typeof value.savedAt === 'string' && value.savedAt ? value.savedAt : new Date().toISOString()
  const removedAt =
    typeof value.removedAt === 'string' && value.removedAt ? value.removedAt : undefined
  return {
    userId,
    eventId,
    savedAt,
    ...(removedAt ? { removedAt } : {}),
  }
}

export function mergeSaveRow(existing, incoming) {
  if (!existing) {
    const next = {
      userId: incoming.userId,
      eventId: incoming.eventId,
      savedAt: incoming.savedAt,
    }
    if (incoming.removedAt) next.removedAt = incoming.removedAt
    return next
  }

  const savedAt = earlierIso(existing.savedAt, incoming.savedAt) || incoming.savedAt
  const reSaved = !incoming.removedAt
  if (reSaved) {
    return { userId: existing.userId, eventId: existing.eventId, savedAt }
  }
  const removedAt = laterIso(existing.removedAt, incoming.removedAt)
  const next = { userId: existing.userId, eventId: existing.eventId, savedAt }
  if (removedAt) next.removedAt = removedAt
  return next
}

export function upsertSaves(state, userId, saves) {
  if (!userId) return state
  const incoming = Array.isArray(saves) ? saves : []
  const byKey = new Map()
  for (const row of state.savedEvents || []) {
    if (row?.userId && row?.eventId) byKey.set(`${row.userId}::${row.eventId}`, { ...row })
  }
  for (const raw of incoming) {
    const parsed = asSaveInput(raw, userId)
    if (!parsed) continue
    const key = `${userId}::${parsed.eventId}`
    byKey.set(key, mergeSaveRow(byKey.get(key), parsed))
  }
  return { ...state, savedEvents: [...byKey.values()] }
}

function findParentByEmail(state, email) {
  return (state.parents || []).find((row) => row.email === email) || null
}

function findParentById(state, userId) {
  return (state.parents || []).find((row) => row.userId === userId) || null
}

function replaceParent(state, parent) {
  const others = (state.parents || []).filter((row) => row.userId !== parent.userId)
  return { ...state, parents: [...others, parent] }
}

export function linkNewsletterToParent(state, parent) {
  if (!parent?.email || !parent.emailVerifiedAt) return state
  let changed = false
  const newsletter = (state.newsletter || []).map((row) => {
    if (row.email !== parent.email) return row
    if (row.userId === parent.userId) return row
    changed = true
    return { ...row, userId: parent.userId }
  })
  return changed ? { ...state, newsletter } : state
}

export function continueWithEmail(state, input, now = new Date().toISOString()) {
  const email = normalizeEmail(input?.email)
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.', status: 400 }
  }

  let parent = findParentByEmail(state, email)
  if (!parent) {
    const userId =
      typeof input?.userId === 'string' && input.userId.trim()
        ? input.userId.trim()
        : createUserId()
    parent = {
      userId,
      email,
      emailVerifiedAt: null,
      createdAt: now,
      lastSeenAt: now,
    }
  } else {
    parent = { ...parent, lastSeenAt: now }
  }

  let next = replaceParent(state, parent)
  next = upsertSaves(next, parent.userId, input?.saves)
  const verified = Boolean(parent.emailVerifiedAt)
  if (verified) next = linkNewsletterToParent(next, parent)

  const activeSaves = verified
    ? (next.savedEvents || []).filter((row) => row.userId === parent.userId && isActiveSave(row))
    : []

  return {
    ok: true,
    state: next,
    userId: parent.userId,
    email,
    emailVerified: verified,
    saves: activeSaves.map((row) => ({
      eventId: row.eventId,
      savedAt: row.savedAt,
    })),
  }
}

export function syncSaves(state, input, now = new Date().toISOString()) {
  const userId = typeof input?.userId === 'string' ? input.userId.trim() : ''
  if (!userId) return { ok: false, error: 'Missing userId.', status: 400 }
  const parent = findParentById(state, userId)
  if (!parent) return { ok: false, error: 'Unknown parent.', status: 404 }

  let next = replaceParent(state, { ...parent, lastSeenAt: now })
  next = upsertSaves(next, userId, input?.saves)
  return { ok: true, state: next, userId }
}

export function subscribeNewsletter(state, input, now = new Date().toISOString()) {
  const email = normalizeEmail(input?.email)
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.', status: 400 }
  }
  const source = NEWSLETTER_SOURCES.includes(input?.signupSource)
    ? input.signupSource
    : 'puddles_picks'

  const existing = (state.newsletter || []).find((row) => row.email === email)
  const verifiedParent = findParentByEmail(state, email)
  const userId =
    verifiedParent?.emailVerifiedAt ? verifiedParent.userId : existing?.userId || null

  const row = existing
    ? {
        ...existing,
        status: 'subscribed',
        subscribedAt: existing.subscribedAt || now,
        unsubscribedAt: undefined,
        signupSource: existing.signupSource || source,
        consentVersion: existing.consentVersion || NEWSLETTER_CONSENT_VERSION,
        userId,
      }
    : {
        email,
        userId,
        status: 'subscribed',
        subscribedAt: now,
        signupSource: source,
        consentVersion: NEWSLETTER_CONSENT_VERSION,
      }
  if (!row.unsubscribedAt) delete row.unsubscribedAt

  const newsletter = (state.newsletter || []).filter((item) => item.email !== email)
  newsletter.push(row)
  return { ok: true, state: { ...state, newsletter }, email, alreadySubscribed: Boolean(existing && existing.status === 'subscribed') }
}

export function setNewsletterProviderContactId(state, email, providerContactId) {
  const normalized = normalizeEmail(email)
  if (!normalized || !providerContactId) return state
  let changed = false
  const newsletter = (state.newsletter || []).map((row) => {
    if (row.email !== normalized) return row
    if (row.providerContactId === providerContactId) return row
    changed = true
    return { ...row, providerContactId }
  })
  return changed ? { ...state, newsletter } : state
}

function hashesMatch(left, right) {
  if (!left || !right || left.length !== right.length) return false
  let mismatch = 0
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return mismatch === 0
}

export function pruneLoginTokens(state, now = new Date().toISOString()) {
  const cutoff = Date.parse(now)
  const loginTokens = (state.loginTokens || []).filter((row) => {
    if (!row?.tokenHash) return false
    if (row.consumedAt) return Date.parse(row.consumedAt) > cutoff - LOGIN_TOKEN_TTL_MS
    const expires = Date.parse(row.expiresAt || '')
    return !Number.isNaN(expires) && expires > cutoff
  })
  return { ...state, loginTokens }
}

export function issueLoginToken(state, input, now = new Date().toISOString()) {
  const email = normalizeEmail(input?.email)
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.', status: 400 }
  }
  const tokenHash = typeof input?.tokenHash === 'string' ? input.tokenHash : ''
  if (!tokenHash) return { ok: false, error: 'Missing login token.', status: 500 }

  const parent = findParentByEmail(state, email) || findParentById(state, input?.userId)
  if (!parent) return { ok: false, error: 'Unknown parent.', status: 404 }

  const lastSent = Date.parse(parent.lastLoginSentAt || '')
  const nowMs = Date.parse(now)
  if (!Number.isNaN(lastSent) && nowMs - lastSent < LOGIN_SEND_COOLDOWN_MS) {
    return { ok: true, state, userId: parent.userId, email, throttled: true }
  }

  const expiresAt = new Date(nowMs + LOGIN_TOKEN_TTL_MS).toISOString()
  const nextParent = { ...parent, lastLoginSentAt: now, lastSeenAt: now }
  let next = replaceParent(state, nextParent)
  next = pruneLoginTokens(next, now)
  next = {
    ...next,
    loginTokens: [
      ...(next.loginTokens || []),
      {
        tokenHash,
        userId: parent.userId,
        email,
        expiresAt,
        createdAt: now,
      },
    ],
  }
  return { ok: true, state: next, userId: parent.userId, email, throttled: false }
}

export function consumeLoginToken(state, input, now = new Date().toISOString()) {
  const tokenHash = typeof input?.tokenHash === 'string' ? input.tokenHash : ''
  if (!tokenHash) return { ok: false, error: 'Missing login token.', status: 400 }

  const nowMs = Date.parse(now)
  const tokens = state.loginTokens || []
  const match = tokens.find((row) => hashesMatch(row.tokenHash, tokenHash))
  if (!match) return { ok: false, error: 'That sign-in link is invalid or expired.', status: 400 }
  if (match.consumedAt) return { ok: false, error: 'That sign-in link was already used.', status: 400 }
  const expires = Date.parse(match.expiresAt || '')
  if (Number.isNaN(expires) || expires <= nowMs) {
    return { ok: false, error: 'That sign-in link is invalid or expired.', status: 400 }
  }

  const loginTokens = tokens.map((row) =>
    hashesMatch(row.tokenHash, tokenHash) ? { ...row, consumedAt: now } : row,
  )
  const verified = verifyParentEmail({ ...state, loginTokens }, { userId: match.userId }, now)
  if (!verified.ok) return verified
  return {
    ok: true,
    state: pruneLoginTokens(verified.state, now),
    parent: verified.parent,
    email: match.email,
  }
}

export function verifyParentEmail(state, input, now = new Date().toISOString()) {
  const userId = typeof input?.userId === 'string' ? input.userId.trim() : ''
  if (!userId) return { ok: false, error: 'Missing userId.', status: 400 }
  const parent = findParentById(state, userId)
  if (!parent) return { ok: false, error: 'Unknown parent.', status: 404 }
  const nextParent = {
    ...parent,
    emailVerifiedAt: parent.emailVerifiedAt || now,
    lastSeenAt: now,
  }
  let next = replaceParent(state, nextParent)
  next = linkNewsletterToParent(next, nextParent)
  return { ok: true, state: next, parent: nextParent }
}

export function unsubscribeNewsletter(state, input, now = new Date().toISOString()) {
  const email = normalizeEmail(input?.email)
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.', status: 400 }
  }
  const existing = (state.newsletter || []).find((row) => row.email === email)
  if (!existing) return { ok: false, error: 'Unknown subscriber.', status: 404 }
  const row = {
    ...existing,
    status: 'unsubscribed',
    unsubscribedAt: now,
  }
  const newsletter = (state.newsletter || []).filter((item) => item.email !== email)
  newsletter.push(row)
  return { ok: true, state: { ...state, newsletter } }
}

export function buildAudienceRows(state) {
  const parentsByEmail = new Map()
  for (const parent of state.parents || []) {
    if (parent?.email) parentsByEmail.set(parent.email, parent)
  }
  const newsByEmail = new Map()
  for (const row of state.newsletter || []) {
    if (row?.email) newsByEmail.set(row.email, row)
  }
  const savesByUser = new Map()
  for (const save of state.savedEvents || []) {
    if (!save?.userId) continue
    const list = savesByUser.get(save.userId) || []
    list.push(save)
    savesByUser.set(save.userId, list)
  }

  const emails = new Set([...parentsByEmail.keys(), ...newsByEmail.keys()])
  const rows = []
  for (const email of emails) {
    const parent = parentsByEmail.get(email) || null
    const newsletter = newsByEmail.get(email) || null
    const saves = parent ? savesByUser.get(parent.userId) || [] : []
    const active = saves.filter(isActiveSave)
    rows.push({
      email,
      userId: parent?.userId || newsletter?.userId || null,
      hasAccount: Boolean(parent),
      emailVerifiedAt: parent?.emailVerifiedAt || null,
      createdAt: parent?.createdAt || null,
      lastSeenAt: parent?.lastSeenAt || null,
      lastLoginSentAt: parent?.lastLoginSentAt || null,
      newsletterStatus: newsletter?.status || 'none',
      subscribedAt: newsletter?.subscribedAt || null,
      unsubscribedAt: newsletter?.unsubscribedAt || null,
      signupSource: newsletter?.signupSource || null,
      consentVersion: newsletter?.consentVersion || null,
      savedCount: parent ? active.length : null,
      saves: parent
        ? active.map((row) => ({ eventId: row.eventId, savedAt: row.savedAt }))
        : [],
    })
  }

  rows.sort((a, b) => {
    const left = b.lastSeenAt || b.subscribedAt || ''
    const right = a.lastSeenAt || a.subscribedAt || ''
    return left.localeCompare(right)
  })
  return rows
}

export function summarizeAudience(rows) {
  const list = Array.isArray(rows) ? rows : []
  return {
    total: list.length,
    parents: list.filter((row) => row.hasAccount).length,
    verified: list.filter((row) => Boolean(row.emailVerifiedAt)).length,
    newsletterOnly: list.filter((row) => !row.hasAccount && row.newsletterStatus === 'subscribed').length,
    overlap: list.filter((row) => row.newsletterStatus === 'subscribed' && (row.savedCount || 0) > 0).length,
    subscribed: list.filter((row) => row.newsletterStatus === 'subscribed').length,
  }
}
