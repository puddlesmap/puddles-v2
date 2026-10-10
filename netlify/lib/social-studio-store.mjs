import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { folderExportEnabled, writeApprovedItem } from './social-studio-export.mjs'
import {
  calendarPairKey,
  isCalendarItem,
  notionEnabled,
  stampNotionPage,
  syncCalendarGroup,
} from './social-studio-notion.mjs'
import {
  addAlert,
  approveItem,
  approvePack,
  cancelItem,
  dueItems,
  editItem,
  emptyState,
  eventChangeError,
  markFailed,
  markNeedsReapproval,
  markPublished,
  publicState,
  syncReminders,
} from '../../src/utils/socialStudioCore.mjs'

function blobsEnabled() {
  return process.env.SOCIAL_STUDIO_STORE === 'blobs' || process.env.NETLIFY === 'true'
}

let blobStorePromise
function blobs() {
  if (!blobStorePromise) {
    blobStorePromise = import('@netlify/blobs').then(({ getStore }) =>
      getStore({ name: 'social-studio', consistency: 'strong' }),
    )
  }
  return blobStorePromise
}

function rootDir() {
  return process.env.SOCIAL_STUDIO_DIR || path.join(process.cwd(), 'data/social-studio')
}

function statePath() {
  return path.join(rootDir(), 'state.json')
}

function lockPath(itemId) {
  return path.join(rootDir(), 'locks', `${itemId}.lock`)
}

function ensureRoot() {
  fs.mkdirSync(path.join(rootDir(), 'locks'), { recursive: true })
  fs.mkdirSync(path.join(rootDir(), 'assets'), { recursive: true })
}

function fileReadState() {
  ensureRoot()
  try {
    return { ...emptyState(), ...JSON.parse(fs.readFileSync(statePath(), 'utf8')) }
  } catch {
    return emptyState()
  }
}

function fileWriteState(state) {
  ensureRoot()
  const file = statePath()
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`)
  fs.renameSync(temp, file)
}

function fileClaimLock(itemId, token) {
  ensureRoot()
  try {
    const fd = fs.openSync(lockPath(itemId), 'wx')
    fs.writeFileSync(fd, token)
    fs.closeSync(fd)
    return { ok: true, token }
  } catch (error) {
    if (error && error.code === 'EEXIST') return { ok: false, token: null }
    throw error
  }
}

function fileReleaseLock(itemId, token) {
  try {
    const current = fs.readFileSync(lockPath(itemId), 'utf8')
    if (current !== token) return false
    fs.unlinkSync(lockPath(itemId))
    return true
  } catch {
    return false
  }
}

function fileSaveAsset(bytes, extension) {
  ensureRoot()
  const token = crypto.randomBytes(16).toString('hex')
  const filename = `${token}.${extension}`
  fs.writeFileSync(path.join(rootDir(), 'assets', filename), bytes)
  return { token, filename }
}

function fileReadAsset(token) {
  ensureRoot()
  const matches = fs.readdirSync(path.join(rootDir(), 'assets')).filter((name) => name.startsWith(`${token}.`))
  if (matches.length !== 1) return null
  const filename = matches[0]
  return { filename, bytes: fs.readFileSync(path.join(rootDir(), 'assets', filename)) }
}

export async function readState() {
  if (!blobsEnabled()) return fileReadState()
  const store = await blobs()
  const saved = await store.get('state', { type: 'json' })
  return { ...emptyState(), ...(saved || {}) }
}

export async function writeState(state) {
  if (!blobsEnabled()) {
    fileWriteState(state)
    return
  }
  const store = await blobs()
  await store.setJSON('state', state)
}

/** Exclusive create. A second caller gets false until the winner releases. */
export async function claimLock(itemId, token = crypto.randomUUID()) {
  if (!blobsEnabled()) return fileClaimLock(itemId, token)
  const store = await blobs()
  const result = await store.set(`locks/${itemId}`, token, { onlyIfNew: true })
  return result.modified ? { ok: true, token } : { ok: false, token: null }
}

export async function releaseLock(itemId, token) {
  if (!blobsEnabled()) return fileReleaseLock(itemId, token)
  const store = await blobs()
  const current = await store.get(`locks/${itemId}`, { type: 'text' })
  if (current !== token) return false
  await store.delete(`locks/${itemId}`)
  return true
}

export async function saveAsset(bytes, extension = 'png') {
  if (!blobsEnabled()) return fileSaveAsset(bytes, extension)
  const store = await blobs()
  const token = crypto.randomBytes(16).toString('hex')
  const filename = `${token}.${extension}`
  await store.set(`assets/${filename}`, bytes)
  return { token, filename }
}

export async function readAsset(token) {
  if (!/^[a-f0-9]{32}$/.test(token || '')) return null
  if (!blobsEnabled()) return fileReadAsset(token)
  const store = await blobs()
  try {
    const data = await store.get(`assets/${token}.png`, { type: 'arrayBuffer' })
    if (!data) return null
    return { filename: `${token}.png`, bytes: Buffer.from(data) }
  } catch {
    return null
  }
}

export async function viewState() {
  return { ...publicState(await readState()), folderExport: folderExportEnabled() }
}

export async function applyEdit(itemId, patch) {
  await writeState(editItem(await readState(), itemId, patch))
  return viewState()
}

export async function applyCancel(itemId) {
  await writeState(cancelItem(await readState(), itemId))
  return viewState()
}

function approveLead(savedTo) {
  return savedTo.length ? 'Saved to the weekly folder.' : 'Approved here.'
}

function approveMessage(savedTo, notionError) {
  if (notionError) return `${approveLead(savedTo)} ${notionError}`
  if (savedTo.length && notionEnabled()) return 'Saved to the weekly folder and the content calendar.'
  if (savedTo.length) return 'Saved to the weekly folder.'
  if (notionEnabled()) return 'Saved to the content calendar. The weekly folder updates when you approve on this Mac.'
  return 'Approved. The weekly folder updates when you approve on this Mac.'
}

async function syncNotion(items, state) {
  if (!notionEnabled()) return null
  const keys = []
  for (const item of items) {
    if (!isCalendarItem(item)) continue
    const key = calendarPairKey(item)
    if (!keys.includes(key)) keys.push(key)
  }
  const errors = []
  for (const key of keys) {
    try {
      const synced = await syncCalendarGroup(state, key)
      if (synced.pageId) stampNotionPage(state, key, synced.pageId)
    } catch (error) {
      errors.push(error.message || 'Notion update failed.')
    }
  }
  if (!errors.length) return null
  return errors.join(' ')
}

async function saveApproved(items, state) {
  const savedTo = []
  if (folderExportEnabled()) {
    for (const item of items) {
      if (!item) continue
      savedTo.push(await writeApprovedItem(item, { readAsset }))
    }
  }
  const notionError = await syncNotion(items, state)
  return { savedTo, notionError, message: approveMessage(savedTo, notionError) }
}

export async function applyApproveItem(itemId) {
  const result = approveItem(await readState(), itemId)
  if (result.error) return { ...(await viewState()), error: result.error, savedTo: [] }
  const saved = await saveApproved([result.item], result.state)
  await writeState(result.state)
  return { ...(await viewState()), error: saved.notionError ? saved.message : null, message: saved.message, savedTo: saved.savedTo }
}

export async function applyApprovePack(packId) {
  const result = approvePack(await readState(), packId)
  const saved = await saveApproved(result.items || [], result.state)
  await writeState(result.state)
  return { ...(await viewState()), errors: result.errors, error: saved.notionError ? saved.message : null, message: saved.message, savedTo: saved.savedTo }
}

export async function applyPause(paused) {
  const state = await readState()
  state.pausePublishing = Boolean(paused)
  await writeState(state)
  return viewState()
}

export async function applyReminders(now = new Date()) {
  await writeState(syncReminders(await readState(), now))
  return viewState()
}

export function loadCatalog() {
  try {
    const file = path.join(process.cwd(), 'src/data/sheet-events.json')
    const events = JSON.parse(fs.readFileSync(file, 'utf8'))
    return new Map(events.map((event) => [event.id, event]))
  } catch {
    return new Map()
  }
}

/**
 * Publish due scheduled items. Manual stories are excluded.
 * The lock is claimed before the status write.
 */
export async function publishDue(now = new Date(), { forceItemId, catalog, failIds, livePublish } = {}) {
  const state = await readState()
  const lookup = catalog || loadCatalog()
  const targets = dueItems(state, now, { forceItemId })
  const published = []
  const skipped = []
  for (const target of targets) {
    const claim = await claimLock(target.id)
    if (!claim.ok) {
      skipped.push({ id: target.id, reason: 'locked' })
      continue
    }
    try {
      const fresh = await readState()
      const current = fresh.items.find((item) => item.id === target.id)
      if (!current || current.status !== 'scheduled' || !current.approved) {
        skipped.push({ id: target.id, reason: 'not-scheduled' })
        continue
      }
      if (current.format === 'story' && current.storyMode === 'manual') {
        skipped.push({ id: target.id, reason: 'manual' })
        continue
      }
      const change = eventChangeError(current, lookup)
      if (change) {
        const blocked = markNeedsReapproval(current, change)
        await writeState(addAlert({
          ...fresh,
          items: fresh.items.map((item) => (item.id === current.id ? blocked : item)),
        }, blocked, 'event_change', change))
        skipped.push({ id: target.id, reason: 'event-change' })
        continue
      }
      if (failIds?.includes(current.id)) {
        const failed = markFailed(current, 'Mock failure')
        await writeState(addAlert({
          ...fresh,
          items: fresh.items.map((item) => (item.id === current.id ? failed : item)),
        }, failed, 'failed', failed.lastError))
        skipped.push({ id: target.id, reason: 'failed' })
        continue
      }
      let mediaId = null
      if (livePublish) {
        try {
          mediaId = await livePublish(current)
        } catch (error) {
          const failed = markFailed(current, error.message || 'Instagram publish failed.')
          await writeState(addAlert({
            ...fresh,
            items: fresh.items.map((item) => (item.id === current.id ? failed : item)),
          }, failed, 'failed', failed.lastError))
          skipped.push({ id: target.id, reason: 'failed' })
          continue
        }
      }
      const items = fresh.items.map((item) => (item.id === current.id ? markPublished(item, mediaId) : item))
      await writeState({ ...fresh, items })
      published.push(current.id)
    } finally {
      await releaseLock(target.id, claim.token)
    }
  }
  return { ...(await viewState()), published, skipped }
}

export async function runTick(now = new Date(), options = {}) {
  await applyReminders(now)
  return publishDue(now, options)
}
