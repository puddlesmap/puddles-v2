/**
 * Discovery Inbox storage. GitHub Contents API is the MVP store.
 * Callers use readInbox / updateInbox and do not talk to GitHub themselves.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { getGitHubConfig } from './publish-events.mjs'
import { applyAgentPost, applyDecision, emptyInbox, enqueueUrl } from '../../src/utils/discoveryInboxCore.mjs'

const INBOX_PATH = 'data/discovery/agent-inbox.json'

class InboxWriteSkipped extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function githubGetFile({ token, owner, name, path }) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=main`,
    { headers: githubHeaders(token) },
  )
  if (response.status === 404) return { sha: null, parsed: emptyInbox() }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Could not read ${path} (${response.status}): ${detail.slice(0, 200)}`)
  }
  const body = await response.json()
  const content = Buffer.from(String(body.content || '').replace(/\n/g, ''), 'base64').toString('utf8')
  return { sha: body.sha, parsed: JSON.parse(content) }
}

async function githubPutFile({ token, owner, name, path, sha, content, message }) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
    method: 'PUT',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha: sha || undefined,
      branch: 'main',
    }),
  })
  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.message || ''
    } catch {
      detail = await response.text()
    }
    const error = new Error(detail || `Could not commit ${path} (${response.status})`)
    error.status = response.status
    throw error
  }
  return response.json()
}

export function loadCatalogEvents() {
  const paths = [
    path.join(process.cwd(), 'src/data/sheet-events.json'),
    path.join(process.cwd(), 'data/sheet-events.json'),
    '/var/task/src/data/sheet-events.json',
  ]
  for (const filePath of paths) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // Date prune still runs when the catalog is not packaged with the function.
    }
  }
  return []
}

async function updateInbox({ env, mutate, message }) {
  const config = getGitHubConfig(env)
  if (!config.ok) return { ok: false, status: 503, error: config.error }
  let lastError = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const file = await githubGetFile({
        token: config.token,
        owner: config.owner,
        name: config.name,
        path: INBOX_PATH,
      })
      const current = { ...emptyInbox(), ...file.parsed }
      let next
      try {
        next = mutate(current)
      } catch (error) {
        if (error instanceof InboxWriteSkipped) {
          return { ok: false, status: error.status, error: error.message }
        }
        throw error
      }
      await githubPutFile({
        token: config.token,
        owner: config.owner,
        name: config.name,
        path: INBOX_PATH,
        sha: file.sha,
        content: `${JSON.stringify(next, null, 2)}\n`,
        message,
      })
      return { ok: true, status: 200, inbox: next }
    } catch (error) {
      lastError = error
      const conflict = error?.status === 409 || /sha|conflict/i.test(String(error?.message || ''))
      if (attempt === 0 && conflict) continue
      break
    }
  }
  return {
    ok: false,
    status: 502,
    error: lastError instanceof Error ? lastError.message : 'Could not save the inbox',
  }
}

export async function readInbox({ env = process.env } = {}) {
  const config = getGitHubConfig(env)
  if (!config.ok) return { ok: false, status: 503, error: config.error, inbox: emptyInbox() }
  try {
    const file = await githubGetFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: INBOX_PATH,
    })
    return { ok: true, status: 200, inbox: { ...emptyInbox(), ...file.parsed } }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not read the inbox',
      inbox: emptyInbox(),
    }
  }
}

export async function postAgentInbox({ body, env = process.env }) {
  const config = getGitHubConfig(env)
  if (!config.ok) return { ok: false, status: 503, error: config.error }
  const catalog = loadCatalogEvents()
  const stats = { received: 0, upserted: 0, dropped: 0, errors: [] }
  const saved = await updateInbox({
    env,
    message: 'chore: discovery inbox update',
    mutate(current) {
      const result = applyAgentPost(current, body || {}, catalog)
      stats.received = result.received
      stats.upserted = result.upserted
      stats.dropped = result.dropped
      stats.errors = result.errors
      if (result.errors.length > 0 && result.upserted === 0) {
        throw new InboxWriteSkipped(result.errors[0])
      }
      return result.inbox
    },
  })
  if (!saved.ok) return { ...saved, errors: stats.errors }
  return {
    ok: true,
    status: 200,
    received: stats.received,
    upserted: stats.upserted,
    dropped: stats.dropped,
    errors: stats.errors,
    pendingUrls: saved.inbox.pendingUrls || [],
    inbox: saved.inbox,
  }
}

export async function enqueueInboxUrl({ sourceUrl, env = process.env }) {
  const saved = await updateInbox({
    env,
    message: 'chore: queue a discovery inbox link',
    mutate(current) {
      const queued = enqueueUrl(current, sourceUrl)
      if (!queued.ok || !queued.inbox) {
        throw new InboxWriteSkipped(queued.error || 'Could not queue that link.')
      }
      return queued.inbox
    },
  })
  return saved
}

export async function decideInboxCandidate({ input, env = process.env }) {
  let decidedCandidate = null
  const saved = await updateInbox({
    env,
    message: `chore: discovery inbox ${input?.decision || 'edit'} ${input?.id || ''}`.trim(),
    mutate(current) {
      const decided = applyDecision(current, input)
      if (!decided.ok || !decided.inbox) {
        throw new InboxWriteSkipped(decided.error || 'That candidate is not in the inbox.', 404)
      }
      decidedCandidate = decided.candidate
      return decided.inbox
    },
  })
  if (!saved.ok) return saved
  return { ok: true, status: 200, candidate: decidedCandidate, inbox: saved.inbox }
}
