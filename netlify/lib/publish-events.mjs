/**
 * Upsert Admin Go-live events into sheet-events.json via GitHub Contents API.
 * Shared by Netlify function and Vite dev middleware.
 */

const DEFAULT_REPO = 'puddlesmap/puddles-v2'
const EVENTS_PATH = 'src/data/sheet-events.json'
const META_PATH = 'src/data/sync-meta.json'

function getGitHubConfig(env = process.env) {
  const token = env.GITHUB_DEPLOY_TOKEN?.trim()
  const repo = env.GITHUB_REPO?.trim() || DEFAULT_REPO
  const [owner, name] = repo.split('/')

  if (!token) {
    return { ok: false, error: 'Publish is not configured. Set GITHUB_DEPLOY_TOKEN on Netlify.' }
  }
  if (!owner || !name) {
    return { ok: false, error: 'Invalid GITHUB_REPO. Use owner/repo format.' }
  }

  return { ok: true, token, owner, name }
}

function normalizeUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function findExistingIndex(events, incoming) {
  const byId = events.findIndex((event) => event.id && event.id === incoming.id)
  if (byId >= 0) return byId

  const url = normalizeUrl(incoming.eventUrl)
  const date = String(incoming.date || '').trim()
  if (!url || url === '#') return -1

  return events.findIndex((event) => {
    if (normalizeUrl(event.eventUrl) !== url) return false
    if (date && String(event.date || '').trim() !== date) return false
    return true
  })
}

function computeIsPast(date, startTime, endTime) {
  if (!date) return false
  const start = String(startTime || '00:00')
  const end = String(endTime || start)
  const endIso = `${date}T${end.length === 5 ? `${end}:00` : end}`
  const endDate = new Date(endIso)
  if (Number.isNaN(endDate.getTime())) {
    const day = new Date(`${date}T23:59:59`)
    return !Number.isNaN(day.getTime()) && day.getTime() <= Date.now()
  }
  return endDate.getTime() <= Date.now()
}

export function enrichForPublic(event) {
  const rawStatus = String(event.status || '').trim()
  const status =
    rawStatus === 'Hidden' ||
    rawStatus === 'Draft' ||
    rawStatus === 'Published' ||
    rawStatus === 'Expired' ||
    rawStatus === 'Cancelled'
      ? rawStatus
      : 'Published'
  const isPast = computeIsPast(event.date, event.startTime, event.endTime)
  const isLive = status === 'Published' && !isPast
  return {
    ...event,
    status,
    isPast,
    isLive,
  }
}

export function mergeEventsForPublish(catalogInput, events) {
  const catalog = Array.isArray(catalogInput) ? [...catalogInput] : []
  let upserted = 0
  let inserted = 0
  for (const raw of Array.isArray(events) ? events : []) {
    if (!raw || typeof raw !== 'object' || !raw.id) continue
    const event = enrichForPublic({ ...raw })
    const index = findExistingIndex(catalog, event)
    if (index >= 0) {
      catalog[index] = enrichForPublic({ ...catalog[index], ...event })
      upserted += 1
    } else {
      catalog.push(event)
      inserted += 1
    }
  }
  catalog.sort(
    (a, b) =>
      String(a.date || '').localeCompare(String(b.date || '')) ||
      String(a.startTime || '').localeCompare(String(b.startTime || '')) ||
      String(a.title || '').localeCompare(String(b.title || '')),
  )
  return { catalog, upserted, inserted }
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function githubJson(url, options, label) {
  const response = await fetch(url, options)
  if (!response.ok) {
    let detail = ''
    try {
      detail = (await response.json())?.message || ''
    } catch {
      detail = await response.text()
    }
    const error = new Error(detail || `${label} failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return response.json()
}

/** Commit several repository files in one Git commit, so Netlify sees one deploy-triggering change. */
export async function githubCommitFiles({ token, owner, name, files, message, attempts = 2 }) {
  let lastError = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const base = `https://api.github.com/repos/${owner}/${name}`
      const ref = await githubJson(
        `${base}/git/ref/heads/main`,
        { headers: githubHeaders(token) },
        'Read main ref',
      )
      const parentSha = ref.object.sha
      const commit = await githubJson(
        `${base}/git/commits/${parentSha}`,
        { headers: githubHeaders(token) },
        'Read main commit',
      )
      const treeEntries = await Promise.all(
        files.map(async (file) => {
          const blob = await githubJson(
            `${base}/git/blobs`,
            {
              method: 'POST',
              headers: githubHeaders(token),
              body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
            },
            `Create ${file.path} blob`,
          )
          return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha }
        }),
      )
      const tree = await githubJson(
        `${base}/git/trees`,
        {
          method: 'POST',
          headers: githubHeaders(token),
          body: JSON.stringify({ base_tree: commit.tree.sha, tree: treeEntries }),
        },
        'Create publish tree',
      )
      const nextCommit = await githubJson(
        `${base}/git/commits`,
        {
          method: 'POST',
          headers: githubHeaders(token),
          body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
        },
        'Create publish commit',
      )
      await githubJson(
        `${base}/git/refs/heads/main`,
        {
          method: 'PATCH',
          headers: githubHeaders(token),
          body: JSON.stringify({ sha: nextCommit.sha, force: false }),
        },
        'Update main ref',
      )
      return { sha: nextCommit.sha }
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts && (error?.status === 409 || error?.status === 422)) continue
      break
    }
  }
  throw lastError || new Error('Could not commit publish bundle')
}

async function githubGetFile({ token, owner, name, path }) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Could not read ${path} (${response.status}): ${detail.slice(0, 200)}`)
  }

  const body = await response.json()
  const content = Buffer.from(body.content.replace(/\n/g, ''), 'base64').toString('utf8')
  return { sha: body.sha, content, parsed: JSON.parse(content) }
}

async function githubPutFile({ token, owner, name, path, sha, content, message }) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
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
    throw new Error(detail || `Could not commit ${path} (${response.status})`)
  }

  return response.json()
}

/**
 * @param {{ events: unknown[], env?: NodeJS.ProcessEnv }} input
 */
export async function publishEventsToGithub({ events, env = process.env }) {
  const config = getGitHubConfig(env)
  if (!config.ok) {
    return { ok: false, status: 503, error: config.error }
  }

  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, status: 400, error: 'No events to publish.' }
  }

  const incoming = events
    .filter((event) => event && typeof event === 'object' && event.id)
    .map((event) => enrichForPublic({ ...event }))

  if (incoming.length === 0) {
    return { ok: false, status: 400, error: 'Events must include an id.' }
  }

  const { token, owner, name } = config

  try {
    const eventsFile = await githubGetFile({ token, owner, name, path: EVENTS_PATH })
    const metaFile = await githubGetFile({ token, owner, name, path: META_PATH })

    const catalog = Array.isArray(eventsFile.parsed) ? [...eventsFile.parsed] : []
    let upserted = 0
    let inserted = 0

    for (const event of incoming) {
      const index = findExistingIndex(catalog, event)
      if (index >= 0) {
        catalog[index] = enrichForPublic({ ...catalog[index], ...event })
        upserted += 1
      } else {
        catalog.push(event)
        inserted += 1
      }
    }

    catalog.sort(
      (a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.startTime || '').localeCompare(String(b.startTime || '')) ||
        String(a.title || '').localeCompare(String(b.title || '')),
    )

    const liveCount = catalog.filter((event) => event.isLive).length
    const nextMeta = {
      ...(metaFile.parsed && typeof metaFile.parsed === 'object' ? metaFile.parsed : {}),
      syncedAt: new Date().toISOString(),
      eventCount: catalog.length,
      liveCount,
    }

    const countLabel = incoming.length === 1 ? '1 activity' : `${incoming.length} activities`
    const message = `chore: update ${countLabel} from Admin`

    await githubPutFile({
      token,
      owner,
      name,
      path: EVENTS_PATH,
      sha: eventsFile.sha,
      content: `${JSON.stringify(catalog, null, 2)}\n`,
      message,
    })

    // Re-read meta sha in case race; usually fine to use original.
    const metaFresh = await githubGetFile({ token, owner, name, path: META_PATH })
    await githubPutFile({
      token,
      owner,
      name,
      path: META_PATH,
      sha: metaFresh.sha,
      content: `${JSON.stringify(nextMeta, null, 2)}\n`,
      message: `chore: sync-meta after go live (${countLabel})`,
    })

    return {
      ok: true,
      status: 200,
      message: `Updated ${incoming.length} activit${incoming.length === 1 ? 'y' : 'ies'} (${inserted} new, ${upserted} updated). Public site usually updates in 2–4 minutes.`,
      upserted,
      inserted,
      eventCount: catalog.length,
      liveCount,
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not publish events to GitHub',
    }
  }
}

export { getGitHubConfig, githubGetFile, githubPutFile }
