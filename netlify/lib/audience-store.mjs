import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { connectLambda, getStore } from '@netlify/blobs'
function onNetlifyRuntime() {
  const cwd = process.cwd()
  if (cwd === '/var/task' || cwd.startsWith('/var/task/')) return true
  const env = process.env
  return env.NETLIFY === 'true' || Boolean(env.AWS_LAMBDA_FUNCTION_NAME) || Boolean(env.LAMBDA_TASK_ROOT)
}
import { sendMagicLinkEmail, setLoopsContactUserId, upsertNewsletterContact } from './loops.mjs'
import {
  buildAudienceRows,
  consumeLoginToken,
  continueWithEmail,
  emptyAudience,
  isActiveSave,
  issueLoginToken,
  setNewsletterProviderContactId,
  subscribeNewsletter,
  summarizeAudience,
  syncSaves,
  unsubscribeNewsletter,
  verifyParentEmail,
} from '../../src/utils/audienceCore.mjs'

/**
 * @typedef {object} AudienceMutation
 * @property {boolean} ok
 * @property {string} [error]
 * @property {number} [status]
 * @property {string} [userId]
 * @property {boolean} [emailVerified]
 * @property {unknown} [saves]
 * @property {boolean} [alreadySubscribed]
 * @property {object} [state]
 */

/** Call at the start of each Netlify function so Blobs works in Lambda compatibility mode. */
export function bindAudienceRequest(event) {
  if (!event || typeof event.blobs !== 'string' || !event.blobs) return
  try {
    connectLambda(event)
  } catch (error) {
    console.error('[audience] Could not connect blob storage', error)
  }
}

function useFileStore() {
  if (process.env.AUDIENCE_STORE === 'file') return true
  if (process.env.AUDIENCE_STORE === 'blobs') return false
  return !onNetlifyRuntime()
}

function openBlobStore() {
  try {
    return getStore({ name: 'audience', consistency: 'strong' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audience storage is not connected.'
    throw new Error(message)
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Audience storage timed out')), ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function rootDir() {
  if (process.env.AUDIENCE_DIR) return process.env.AUDIENCE_DIR
  if (onNetlifyRuntime()) return '/tmp/audience'
  return path.join(process.cwd(), 'data')
}

function statePath() {
  if (process.env.AUDIENCE_PATH) return process.env.AUDIENCE_PATH
  return path.join(rootDir(), 'audience.local.json')
}

function fileReadState() {
  try {
    return { ...emptyAudience(), ...JSON.parse(fs.readFileSync(statePath(), 'utf8')) }
  } catch {
    return emptyAudience()
  }
}

function fileWriteState(state) {
  const file = statePath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`)
  fs.renameSync(temp, file)
}

function audiencePayload(state) {
  return {
    parents: state.parents || [],
    savedEvents: state.savedEvents || [],
    newsletter: state.newsletter || [],
    loginTokens: state.loginTokens || [],
  }
}

async function readState() {
  if (useFileStore()) {
    return { state: fileReadState(), etag: null, backend: 'file', store: null }
  }
  const store = openBlobStore()
  const saved = await withTimeout(
    store.getWithMetadata('state', { type: 'json', consistency: 'strong' }),
    8000,
  )
  if (!saved) return { state: emptyAudience(), etag: null, backend: 'blobs', store }
  return {
    state: { ...emptyAudience(), ...(saved.data || {}) },
    etag: saved.etag || null,
    backend: 'blobs',
    store,
  }
}

async function writeState(loaded, state) {
  const payload = audiencePayload(state)
  if (loaded.backend !== 'blobs') {
    fileWriteState(payload)
    return true
  }
  const options = loaded.etag ? { onlyIfMatch: loaded.etag } : { onlyIfNew: true }
  const result = await withTimeout(loaded.store.setJSON('state', payload, options), 8000)
  return Boolean(result?.modified)
}

let writeChain = Promise.resolve()
function withWriteLock(fn) {
  const run = writeChain.then(fn, fn)
  writeChain = run.then(
    () => {},
    () => {},
  )
  return run
}

/** @param {(state: ReturnType<typeof emptyAudience>) => AudienceMutation} apply */
async function mutate(apply) {
  return withWriteLock(async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const loaded = await readState()
      const result = apply(loaded.state)
      if (!result?.ok) return result
      if (!result.state) return result
      const modified = await writeState(loaded, result.state)
      if (modified) return result
    }
    return {
      ok: false,
      error: 'Audience list was updated at the same time. Try again.',
      status: 503,
    }
  })
}

/** @returns {Promise<AudienceMutation>} */
export async function applyContinue(input) {
  return mutate((state) => continueWithEmail(state, input))
}

/** @returns {Promise<AudienceMutation>} */
export async function applySyncSaves(input) {
  return mutate((state) => syncSaves(state, input))
}

function hashLoginToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function createLoginTokenSecret() {
  return crypto.randomBytes(32).toString('base64url')
}

/** @returns {Promise<AudienceMutation>} */
export async function applySubscribeNewsletter(input) {
  const result = await mutate((state) => subscribeNewsletter(state, input))
  if (!result?.ok) return result
  const parent = (result.state?.parents || []).find((row) => row.email === result.email)
  const loops = await upsertNewsletterContact({
    email: result.email,
    userId: parent?.emailVerifiedAt ? parent.userId : undefined,
    subscribed: true,
    source: input?.signupSource || 'puddles_picks',
  })
  if (loops.id) {
    await mutate((state) => ({
      ok: true,
      state: setNewsletterProviderContactId(state, result.email, loops.id),
    }))
  }
  return result
}

/** @returns {Promise<AudienceMutation>} */
export async function applyVerifyParent(input) {
  return mutate((state) => verifyParentEmail(state, input))
}

/** @returns {Promise<AudienceMutation>} */
export async function applyUnsubscribeNewsletter(input) {
  const result = await mutate((state) => unsubscribeNewsletter(state, input))
  if (result?.ok) {
    await upsertNewsletterContact({
      email: input?.email,
      subscribed: false,
      source: 'admin',
    })
  }
  return result
}

/** @returns {Promise<AudienceMutation>} */
export async function applyRequestLogin(input, { origin } = {}) {
  const secret = createLoginTokenSecret()
  const tokenHash = hashLoginToken(secret)
  const issued = await mutate((state) =>
    issueLoginToken(state, { email: input?.email, userId: input?.userId, tokenHash }),
  )
  if (!issued?.ok) return issued
  if (issued.throttled) return { ...issued, sent: true, throttled: true }

  const loginUrl = `${String(origin || '').replace(/\/$/, '')}/saved/verify?token=${encodeURIComponent(secret)}`
  const sent = await sendMagicLinkEmail({ email: issued.email, loginUrl })
  if (!sent.ok) {
    return { ok: false, error: 'Could not send the sign-in email.', status: 502 }
  }
  return { ok: true, sent: true, skipped: Boolean(sent.skipped), userId: issued.userId, email: issued.email }
}

/** @returns {Promise<AudienceMutation>} */
export async function applyConsumeLoginToken(input) {
  const tokenHash = hashLoginToken(String(input?.token || ''))
  const result = await mutate((state) => consumeLoginToken(state, { tokenHash }))
  if (result?.ok && result.parent?.email) {
    await setLoopsContactUserId({ email: result.parent.email, userId: result.parent.userId })
  }
  return result
}

export async function readParentSessionView(userId) {
  const { state } = await readState()
  const parent = (state.parents || []).find((row) => row.userId === userId)
  if (!parent?.emailVerifiedAt) return { ok: false, error: 'Not signed in.', status: 401 }
  const saves = (state.savedEvents || [])
    .filter((row) => row.userId === userId && isActiveSave(row))
    .map((row) => ({ eventId: row.eventId, savedAt: row.savedAt }))
  return {
    ok: true,
    userId: parent.userId,
    email: parent.email,
    emailVerified: true,
    saves,
  }
}

export async function readAudienceView() {
  const { state } = await readState()
  const rows = buildAudienceRows(state)
  return {
    ok: true,
    rows,
    summary: summarizeAudience(rows),
  }
}
