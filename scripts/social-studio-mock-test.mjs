import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-studio-'))
process.env.SOCIAL_STUDIO_DIR = dir
process.env.SOCIAL_STUDIO_EXPORT_DIR = path.join(dir, 'export')

const store = await import('../netlify/lib/social-studio-store.mjs')
const core = await import('../src/utils/socialStudioCore.mjs')

const first = await store.claimLock('race')
const second = await store.claimLock('race')
assert.equal(first.ok, true)
assert.equal(second.ok, false)
assert.equal(await store.releaseLock('race', first.token), true)

const slide = await store.saveAsset(Buffer.from('png'), 'png')
const state = core.emptyState()
state.packs = [
  { id: 'pack', title: 'Pack', kind: 'weekly' },
]
state.items = [
  {
    id: 'carousel',
    packId: 'pack',
    title: 'Carousel',
    format: 'carousel',
    status: 'draft',
    caption: 'Approved caption',
    slides: [slide],
    scheduleLocal: { date: '2026-10-22', time: '12:00', timeZone: 'America/Los_Angeles' },
    eventRefs: [{ id: 'event-a', date: '2026-10-24', cost: 'Free' }],
  },
  {
    id: 'manual-story',
    packId: 'pack',
    title: 'Manual story',
    format: 'story',
    storyMode: 'manual',
    status: 'draft',
    caption: 'Bring a bag',
    slides: [slide],
    scheduleLocal: { date: '2026-10-23', time: '19:00', timeZone: 'America/Los_Angeles' },
  },
  {
    id: 'empty-story',
    packId: 'pack',
    title: 'Optional',
    format: 'story',
    storyMode: 'auto',
    status: 'draft',
    caption: '',
    slides: [],
    scheduleLocal: { date: '2026-10-25', time: '08:30', timeZone: 'America/Los_Angeles' },
  },
  {
    id: 'too-many',
    packId: 'pack',
    title: 'Eleven',
    format: 'carousel',
    status: 'draft',
    caption: 'Too long',
    slides: Array.from({ length: 11 }, () => slide),
    scheduleLocal: { date: '2026-10-09', time: '19:00', timeZone: 'America/Los_Angeles' },
  },
]
await store.writeState(state)

const approved = await store.applyApprovePack('pack')
const carousel = approved.items.find((item) => item.id === 'carousel')
const manual = approved.items.find((item) => item.id === 'manual-story')
const empty = approved.items.find((item) => item.id === 'empty-story')
const tooMany = approved.items.find((item) => item.id === 'too-many')
assert.equal(carousel.status, 'approved')
assert.equal(carousel.publishAtUtc, null)
assert.equal(carousel.approved.caption, 'Approved caption')
assert.equal(manual.status, 'approved')
assert.equal(manual.storyMode, 'manual')
assert.equal(empty.status, 'draft')
assert.equal(tooMany.status, 'draft')
assert.ok(approved.errors.some((error) => error.id === 'too-many'))
assert.ok(fs.existsSync(path.join(dir, 'export', 'carousel', '01.png')))
assert.equal(fs.readFileSync(path.join(dir, 'export', 'carousel', 'caption.txt'), 'utf8'), 'Approved caption')
const notDue = await store.publishDue(new Date('2026-10-22T20:00:00.000Z'))
assert.equal(notDue.published.includes('carousel'), false)
assert.equal(notDue.items.find((item) => item.id === 'carousel').status, 'approved')

const edited = await store.applyEdit('carousel', { caption: 'Changed after approval' })
const editedCarousel = edited.items.find((item) => item.id === 'carousel')
const untouched = edited.items.find((item) => item.id === 'manual-story')
assert.equal(editedCarousel.status, 'needs_reapproval')
assert.equal(editedCarousel.publishAtUtc, null)
assert.equal(untouched.status, 'approved')

const queued = await store.readState()
const queuedStory = queued.items.find((item) => item.id === 'manual-story')
queuedStory.status = 'scheduled'
queuedStory.publishAtUtc = core.pacificToUtcIso('2026-10-23', '19:00')
await store.writeState(queued)
const reminderNow = new Date(Date.parse(queuedStory.publishAtUtc) - 5 * 60 * 1000)
const reminded = await store.applyReminders(reminderNow)
assert.ok(reminded.reminders.some((reminder) => reminder.itemId === 'manual-story' && reminder.kind === 'manual'))
assert.equal(reminded.reminders.some((reminder) => reminder.itemId === 'carousel'), false)

await store.applyCancel('manual-story')
const afterCancel = await store.readState()
assert.equal(afterCancel.items.find((item) => item.id === 'manual-story').status, 'cancelled')
assert.equal(afterCancel.items.find((item) => item.id === 'empty-story').status, 'draft')
assert.equal(afterCancel.items.find((item) => item.id === 'carousel').status, 'needs_reapproval')

await store.applyEdit('carousel', { caption: 'Approved caption' })
await store.applyApproveItem('carousel')
const readyState = await store.readState()
const readyCarousel = readyState.items.find((item) => item.id === 'carousel')
readyCarousel.status = 'scheduled'
readyCarousel.publishAtUtc = core.pacificToUtcIso('2026-10-22', '12:00')
await store.writeState(readyState)
const catalog = new Map([
  ['event-a', { id: 'event-a', title: 'Monster Bash', date: '2026-10-25', cost: 'Free', status: 'Published', isLive: true }],
])
const blocked = await store.publishDue(new Date(Date.parse(readyCarousel.publishAtUtc) + 1000), { catalog })
assert.equal(blocked.published.includes('carousel'), false)
assert.equal(blocked.items.find((item) => item.id === 'carousel').status, 'needs_reapproval')
assert.ok(blocked.reminders.some((reminder) => reminder.kind === 'event_change'))

await store.applyApproveItem('carousel')
const liveCatalog = new Map([
  ['event-a', { id: 'event-a', title: 'Monster Bash', date: '2026-10-24', cost: 'Free', status: 'Published', isLive: true }],
])
const frozen = await store.readState()
const frozenCarousel = frozen.items.find((item) => item.id === 'carousel')
frozenCarousel.status = 'scheduled'
frozenCarousel.publishAtUtc = core.pacificToUtcIso('2026-10-22', '12:00')
frozenCarousel.caption = 'Working copy that must not publish'
frozenCarousel.approved.caption = 'Frozen caption'
await store.writeState(frozen)
const published = await store.publishDue(new Date(Date.parse(frozenCarousel.publishAtUtc) + 1000), {
  catalog: liveCatalog,
})
const done = published.items.find((item) => item.id === 'carousel')
assert.equal(done.status, 'published')
assert.equal(done.publishedPayload.caption, 'Frozen caption')
assert.match(done.instagramMediaId, /^mock-carousel-v/)
assert.equal(published.items.find((item) => item.id === 'manual-story').status, 'cancelled')

const lockScript = `
import { claimLock } from ${JSON.stringify(path.join(process.cwd(), 'netlify/lib/social-studio-store.mjs'))}
process.env.SOCIAL_STUDIO_DIR = ${JSON.stringify(dir)}
const result = await claimLock('held')
console.log(result.ok ? 'won' : 'lost')
`
fs.writeFileSync(path.join(dir, 'lock.mjs'), lockScript)
const a = spawnSync(process.execPath, [path.join(dir, 'lock.mjs')], { encoding: 'utf8', env: { ...process.env, SOCIAL_STUDIO_DIR: dir } })
const b = spawnSync(process.execPath, [path.join(dir, 'lock.mjs')], { encoding: 'utf8', env: { ...process.env, SOCIAL_STUDIO_DIR: dir } })
const outcomes = [a.stdout.trim(), b.stdout.trim()].sort()
assert.deepEqual(outcomes, ['lost', 'won'])

const publish = await import('../netlify/lib/instagram-publish.mjs')
let checks = 0
await publish.waitForContainer('container', 'token', {
  attempts: 3,
  delayMs: 1,
  sleep: async () => { checks += 1 },
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({ status_code: checks === 0 ? 'IN_PROGRESS' : 'FINISHED' }),
  }),
})
assert.equal(checks, 1)
await assert.rejects(
  () => publish.waitForContainer('bad', 'token', {
    attempts: 1,
    fetchImpl: async () => ({ ok: true, json: async () => ({ status_code: 'ERROR' }) }),
  }),
  /could not prepare/,
)

const sharp = (await import('sharp')).default
const png = await sharp({ create: { width: 8, height: 10, channels: 3, background: '#141414' } }).png().toBuffer()
const jpeg = await sharp(png).jpeg().toBuffer()
assert.equal(jpeg[0], 0xff)
assert.equal(jpeg[1], 0xd8)

const notionSlide = await store.saveAsset(Buffer.from('png'), 'png')
const notionState = await store.readState()
notionState.packs.push({ id: 'notion-pack', title: 'Notion pack', kind: 'weekly' })
notionState.items.push(
  {
    id: 'notion-carousel',
    packId: 'notion-pack',
    lane: 'weekend',
    title: 'Weekend Highlights',
    format: 'carousel',
    status: 'draft',
    caption: 'Weekend plans with little ones\n\n📅 Oct 17 - Oct 18\n\nSave this.',
    slides: [notionSlide],
    scheduleLocal: { date: '2026-10-15', time: '12:00', timeZone: 'America/Los_Angeles' },
  },
  {
    id: 'notion-xhs',
    packId: 'notion-pack',
    lane: 'weekend',
    title: '灣區週末',
    format: 'xiaohongshu',
    status: 'draft',
    caption: '灣區週末｜10/17–18\n\n先收藏。',
    slides: [notionSlide],
    scheduleLocal: { date: '2026-10-15', time: '19:00', timeZone: 'America/Los_Angeles' },
  },
  {
    id: 'notion-story',
    packId: 'notion-pack',
    lane: 'weekend',
    title: 'Story',
    format: 'story',
    storyMode: 'manual',
    status: 'draft',
    caption: 'Story only',
    slides: [notionSlide],
    scheduleLocal: { date: '2026-10-16', time: '19:00', timeZone: 'America/Los_Angeles' },
  },
)
await store.writeState(notionState)

process.env.NOTION_TOKEN = 'test-token'
const notionCalls = []
const originalFetch = globalThis.fetch
globalThis.fetch = async (url, init = {}) => {
  const method = init.method || 'GET'
  const body = init.body ? JSON.parse(init.body) : null
  notionCalls.push({ url: String(url), method, body })
  if (method === 'POST' && String(url).endsWith('/pages')) {
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'page-week' }) }
  }
  if (method === 'PATCH' && String(url).includes('/pages/page-week')) {
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'page-week' }) }
  }
  if (String(url).includes('/children')) {
    return { ok: true, status: 200, text: async () => JSON.stringify({ results: [{ id: 'old-block' }], has_more: false }) }
  }
  if (method === 'DELETE') {
    return { ok: true, status: 200, text: async () => JSON.stringify({}) }
  }
  return { ok: false, status: 500, text: async () => JSON.stringify({ message: 'unexpected' }) }
}

try {
  const firstApprove = await store.applyApproveItem('notion-carousel')
  assert.equal(firstApprove.error, null)
  assert.equal(firstApprove.items.find((item) => item.id === 'notion-carousel').notionPageId, 'page-week')
  assert.equal(firstApprove.items.find((item) => item.id === 'notion-xhs').notionPageId, 'page-week')
  assert.equal(firstApprove.items.find((item) => item.id === 'notion-story').notionPageId, undefined)
  assert.equal(fs.readFileSync(path.join(dir, 'export', 'notion-carousel', 'caption.txt'), 'utf8').includes('Oct 17 - Oct 18'), true)
  const created = notionCalls.find((call) => call.method === 'POST')
  assert.equal(created.body.properties.Name.title[0].text.content, 'Oct 17 - Oct 18')
  assert.equal(created.body.properties['Publish Date'].date.start, '2026-10-15')
  assert.equal(created.body.properties.Channel.relation.length, 1)
  assert.equal(created.body.children.some((block) => block.type === 'divider'), false)

  notionCalls.length = 0
  const secondApprove = await store.applyApproveItem('notion-xhs')
  assert.equal(secondApprove.error, null)
  assert.equal(secondApprove.items.find((item) => item.id === 'notion-xhs').notionPageId, 'page-week')
  assert.equal(fs.existsSync(path.join(dir, 'export', 'notion-xhs', 'xiaohongshu.txt')), true)
  const updated = notionCalls.find((call) => call.method === 'PATCH' && call.url.includes('/pages/page-week'))
  assert.equal(updated.body.properties.Channel.relation.length, 2)
  const appended = notionCalls.find((call) => call.method === 'PATCH' && call.url.includes('/children'))
  assert.equal(appended.body.children.some((block) => block.type === 'divider'), true)
  assert.equal(appended.body.children.some((block) => block.paragraph?.rich_text?.[0]?.text?.content?.includes('灣區週末')), true)

  await store.applyApproveItem('notion-story')
  assert.equal(fs.readFileSync(path.join(dir, 'export', 'notion-story', 'caption.txt'), 'utf8'), 'Story only')
  assert.equal(notionCalls.some((call) => call.body && JSON.stringify(call.body).includes('Story only')), false)

  const remoteState = await store.readState()
  remoteState.items.push({
    id: 'notion-remote',
    packId: 'notion-remote-pack',
    lane: 'weekday',
    title: 'Remote carousel',
    format: 'carousel',
    status: 'draft',
    caption: 'Remote plans\n\n📅 Oct 24 - Oct 25\n\nSave this.',
    slides: [notionSlide],
    scheduleLocal: { date: '2026-10-22', time: '12:00', timeZone: 'America/Los_Angeles' },
  })
  await store.writeState(remoteState)
  process.env.SOCIAL_STUDIO_FOLDER = 'off'
  notionCalls.length = 0
  const remote = await store.applyApproveItem('notion-remote')
  assert.equal(remote.error, null)
  assert.match(remote.message, /content calendar/)
  assert.equal(remote.items.find((item) => item.id === 'notion-remote').status, 'approved')
  assert.equal(remote.items.find((item) => item.id === 'notion-remote').notionPageId, 'page-week')
  assert.equal(fs.existsSync(path.join(dir, 'export', 'notion-remote')), false)
  delete process.env.SOCIAL_STUDIO_FOLDER

  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ message: 'unauthorized' }),
  })
  const failed = await store.applyApproveItem('notion-carousel')
  assert.equal(failed.items.find((item) => item.id === 'notion-carousel').status, 'approved')
  assert.match(failed.error, /Saved to the weekly folder/)
  assert.match(failed.error, /unauthorized/)
  assert.equal(fs.readFileSync(path.join(dir, 'export', 'notion-carousel', 'caption.txt'), 'utf8').includes('Oct 17 - Oct 18'), true)
} finally {
  globalThis.fetch = originalFetch
  delete process.env.NOTION_TOKEN
}

console.log('social studio mock tests passed')
console.log(JSON.stringify({
  carousel: done.instagramMediaId,
  manualStillScheduled: true,
  emptyStayedDraft: true,
  elevenBlocked: true,
  editIsolated: true,
  reminderWithoutPublish: true,
  eventChangeBlocked: true,
  lockExclusive: true,
}, null, 2))
