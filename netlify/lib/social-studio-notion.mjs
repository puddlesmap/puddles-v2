import { exportTarget } from './social-studio-export.mjs'

const NOTION_VERSION = '2025-09-03'
const DEFAULT_DATA_SOURCE = '4569d58b-1370-828f-af8b-07f481ff30e8'
const DEFAULT_INSTAGRAM = 'f4c9d58b-1370-831e-9c17-01230d568cad'
const DEFAULT_REDBOOK = '3979d58b-1370-8054-8bac-f90d63715663'

function envId(name, fallback) {
  const value = process.env[name]?.trim()
  return value || fallback
}

export function notionEnabled() {
  return Boolean(process.env.NOTION_TOKEN?.trim())
}

export function isCalendarItem(item) {
  return item?.format === 'carousel' || item?.format === 'xiaohongshu'
}

/** Shared export folders stay together. Otherwise one page per pack and lane. */
export function calendarPairKey(item) {
  const target = exportTarget(item)
  if (target.dir !== item.id) return `folder:${target.dir}`
  return `pack:${item.packId || item.id}:lane:${item.lane || ''}`
}

function pageName(carouselCaption, xhsCaption, sample) {
  const dated = String(carouselCaption || '').match(/^📅\s*(.+)$/m)
  if (dated?.[1]?.trim()) return dated[1].trim().slice(0, 200)
  const title = String(xhsCaption || '').split('\n').map((line) => line.trim()).find(Boolean)
  if (title) return title.slice(0, 200)
  const lane = sample.lane === 'weekday' ? 'Weekday' : sample.lane === 'weekend' ? 'Weekend' : 'Social'
  const date = sample.scheduleLocal?.date
  if (date) {
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))
    return `${lane} · ${formatted}`
  }
  return (sample.title || 'Social post').slice(0, 200)
}

function textChunks(value) {
  const chunks = []
  const text = String(value)
  for (let index = 0; index < text.length; index += 2000) {
    chunks.push(text.slice(index, index + 2000))
  }
  return chunks
}

function paragraph(line) {
  const rich = line ? textChunks(line).map((content) => ({ type: 'text', text: { content } })) : []
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rich } }
}

function captionBlocks(caption) {
  return String(caption || '').replace(/\r\n/g, '\n').split('\n').map((line) => paragraph(line))
}

export function calendarBlocks(carouselCaption, xhsCaption) {
  const blocks = []
  if (carouselCaption) blocks.push(...captionBlocks(carouselCaption))
  if (carouselCaption && xhsCaption) {
    blocks.push({ object: 'block', type: 'divider', divider: {} })
  }
  if (xhsCaption) blocks.push(...captionBlocks(xhsCaption))
  return blocks
}

function properties({ name, publishDate, instagram, redbook }) {
  const channels = []
  if (instagram) channels.push({ id: envId('NOTION_INSTAGRAM_CHANNEL_ID', DEFAULT_INSTAGRAM) })
  if (redbook) channels.push({ id: envId('NOTION_REDBOOK_CHANNEL_ID', DEFAULT_REDBOOK) })
  const fields = {
    Name: { title: [{ type: 'text', text: { content: name } }] },
    Status: { status: { name: 'New' } },
    Format: { select: { name: 'Carousel' } },
  }
  if (publishDate) fields['Publish Date'] = { date: { start: publishDate } }
  if (channels.length) fields.Channel = { relation: channels }
  return fields
}

async function notion(path, { method = 'GET', body, fetchImpl }) {
  const response = await fetchImpl(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN.trim()}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }
  if (!response.ok) {
    throw new Error(`Notion: ${data.message || response.statusText || 'request failed'}`)
  }
  return data
}

async function replaceChildren(pageId, children, fetchImpl) {
  let cursor = null
  const ids = []
  do {
    const query = cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : ''
    const page = await notion(`/blocks/${pageId}/children${query}`, { fetchImpl })
    ids.push(...(page.results || []).map((block) => block.id).filter(Boolean))
    cursor = page.has_more ? page.next_cursor : null
  } while (cursor)
  for (const id of ids) {
    await notion(`/blocks/${id}`, { method: 'DELETE', fetchImpl })
  }
  for (let index = 0; index < children.length; index += 100) {
    await notion(`/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: { children: children.slice(index, index + 100) },
      fetchImpl,
    })
  }
}

export async function syncCalendarGroup(state, key, { fetchImpl = globalThis.fetch } = {}) {
  if (!notionEnabled()) return { skipped: true, pageId: null }
  const members = (state.items || []).filter((item) => isCalendarItem(item) && calendarPairKey(item) === key)
  const carousel = members.find((item) => item.format === 'carousel' && item.approved?.caption)
  const xhs = members.find((item) => item.format === 'xiaohongshu' && item.approved?.caption)
  if (!carousel && !xhs) return { skipped: true, pageId: null }
  const sample = carousel || xhs
  const blocks = calendarBlocks(carousel?.approved?.caption, xhs?.approved?.caption)
  const fields = properties({
    name: pageName(carousel?.approved?.caption, xhs?.approved?.caption, sample),
    publishDate: sample.scheduleLocal?.date || null,
    instagram: Boolean(carousel),
    redbook: Boolean(xhs),
  })
  const existing = members.find((item) => item.notionPageId)?.notionPageId || null
  if (existing) {
    await notion(`/pages/${existing}`, { method: 'PATCH', body: { properties: fields }, fetchImpl })
    await replaceChildren(existing, blocks, fetchImpl)
    return { skipped: false, pageId: existing }
  }
  const created = await notion('/pages', {
    method: 'POST',
    body: {
      parent: {
        type: 'data_source_id',
        data_source_id: envId('NOTION_CONTENT_CALENDAR_ID', DEFAULT_DATA_SOURCE),
      },
      properties: fields,
      children: blocks.slice(0, 100),
    },
    fetchImpl,
  })
  if (blocks.length > 100) await replaceChildren(created.id, blocks, fetchImpl)
  return { skipped: false, pageId: created.id }
}

export function stampNotionPage(state, key, pageId) {
  state.items = state.items.map((item) => {
    if (!isCalendarItem(item) || calendarPairKey(item) !== key) return item
    if (item.notionPageId === pageId) return item
    return { ...item, notionPageId: pageId }
  })
}
