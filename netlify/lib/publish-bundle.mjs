import {
  getGitHubConfig,
  githubCommitFiles,
  githubGetFile,
  mergeEventsForPublish,
} from './publish-events.mjs'
import { emptyInbox } from '../../src/utils/discoveryInboxCore.mjs'

const EVENTS_PATH = 'src/data/sheet-events.json'
const META_PATH = 'src/data/sync-meta.json'
const OVERRIDES_PATH = 'src/data/seasonal-curation-overrides.json'
const SUBMISSIONS_PATH = 'src/data/sheet-submissions.json'
const INBOX_PATH = 'data/discovery/agent-inbox.json'
const CORE_CITIES = new Set(['Palo Alto', 'Mountain View', 'Los Altos', 'Los Altos Hills', 'Sunnyvale'])

function jsonFile(path, value) {
  return { path, content: `${JSON.stringify(value, null, 2)}\n` }
}

function eventForPublish(event) {
  if (event?.status !== 'Draft') return event
  return {
    ...event,
    status: CORE_CITIES.has(String(event.city || '')) ? 'Published' : 'Hidden',
  }
}

function updateSubmissions(rows, items) {
  const byId = new Map(
    items
      .filter((item) => item.source === 'submissions')
      .map((item) => [String(item.sourceId), item.event]),
  )
  return rows.map((row) => {
    const event = byId.get(String(row.id))
    return event
      ? { ...row, status: 'Added to sheet', convertedEventId: event.id }
      : row
  })
}

function updateInbox(inboxInput, items) {
  const ids = new Set(
    items
      .filter((item) => item.source === 'discovery')
      .map((item) => String(item.sourceId)),
  )
  const inbox = { ...emptyInbox(), ...(inboxInput || {}) }
  return {
    ...inbox,
    candidates: (inbox.candidates || []).map((row) =>
      ids.has(String(row.id)) || ids.has(String(row.identityKey))
        ? { ...row, decision: 'live' }
        : row,
    ),
  }
}

export async function publishAdminBundle({ items = [], seasonal = null, env = process.env }) {
  const config = getGitHubConfig(env)
  if (!config.ok) return { ok: false, status: 503, error: config.error }
  if ((!Array.isArray(items) || items.length === 0) && !seasonal) {
    return { ok: false, status: 400, error: 'No approved Admin changes to publish.' }
  }

  const { token, owner, name } = config
  try {
    const [eventsFile, metaFile, overridesFile, submissionsFile, inboxFile] = await Promise.all([
      githubGetFile({ token, owner, name, path: EVENTS_PATH }),
      githubGetFile({ token, owner, name, path: META_PATH }),
      githubGetFile({ token, owner, name, path: OVERRIDES_PATH }),
      githubGetFile({ token, owner, name, path: SUBMISSIONS_PATH }),
      githubGetFile({ token, owner, name, path: INBOX_PATH }),
    ])

    const prepared = items.map((item) => ({ ...item, event: eventForPublish(item.event) }))
    const merged = mergeEventsForPublish(
      eventsFile.parsed,
      prepared.map((item) => item.event),
    )
    const now = new Date().toISOString()
    const nextMeta = {
      ...(metaFile.parsed && typeof metaFile.parsed === 'object' ? metaFile.parsed : {}),
      syncedAt: now,
      eventCount: merged.catalog.length,
      liveCount: merged.catalog.filter((event) => event.status === 'Published' && !event.isPast).length,
    }
    const nextSubmissions = updateSubmissions(
      Array.isArray(submissionsFile.parsed) ? submissionsFile.parsed : [],
      prepared,
    )
    const nextInbox = updateInbox(inboxFile.parsed, prepared)
    const overrides =
      overridesFile.parsed && typeof overridesFile.parsed === 'object' && !Array.isArray(overridesFile.parsed)
        ? { ...overridesFile.parsed }
        : {}
    if (seasonal?.themeSlug) {
      overrides[seasonal.themeSlug] = {
        collectionEventIds: seasonal.collectionEventIds || [],
        driveEventIds: seasonal.driveEventIds || [],
        updatedAt: now,
      }
    }

    const files = [
      jsonFile(EVENTS_PATH, merged.catalog),
      jsonFile(META_PATH, nextMeta),
      jsonFile(SUBMISSIONS_PATH, nextSubmissions),
      jsonFile(INBOX_PATH, nextInbox),
    ]
    if (seasonal?.themeSlug) files.push(jsonFile(OVERRIDES_PATH, overrides))

    const commit = await githubCommitFiles({
      token,
      owner,
      name,
      files,
      message: `chore: publish ${prepared.length} approved Admin change${prepared.length === 1 ? '' : 's'}`,
    })
    return {
      ok: true,
      status: 200,
      message: `Published ${prepared.length} approved event change${prepared.length === 1 ? '' : 's'} in one site update.`,
      commitSha: commit.sha,
      published: prepared.length,
      inserted: merged.inserted,
      upserted: merged.upserted,
      seasonalPublished: Boolean(seasonal?.themeSlug),
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not publish Admin changes',
    }
  }
}
