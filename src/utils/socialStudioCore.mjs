/** Social Studio queue rules. Persistence and locks live in the store. */

export const TIME_ZONE = 'America/Los_Angeles'
export const MAX_CAROUSEL_SLIDES = 10
export const REMINDER_LEAD_MS = 10 * 60 * 1000

export function emptyState() {
  return {
    packs: [],
    items: [],
    reminders: [],
    pausePublishing: false,
    instagram: null,
  }
}

export function pacificToUtcIso(date, time) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '')
  const clock = /^(\d{2}):(\d{2})$/.exec(time || '')
  if (!match || !clock) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(clock[1])
  const minute = Number(clock[2])
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(utc))
    const read = (type) => Number(parts.find((part) => part.type === type)?.value)
    const shown = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'))
    const wanted = Date.UTC(year, month - 1, day, hour, minute)
    const delta = wanted - shown
    if (delta === 0) break
    utc += delta
  }
  return new Date(utc).toISOString()
}

export function isReady(item) {
  if (!item || item.status === 'cancelled') return false
  if (!item.scheduleLocal?.date || !item.scheduleLocal?.time) return false
  if (!String(item.caption || '').trim()) return false
  const slides = item.slides || []
  if (item.format === 'carousel' || item.format === 'xiaohongshu') {
    return slides.length > 0 && slides.length <= MAX_CAROUSEL_SLIDES
  }
  if (item.format === 'story' && item.storyMode === 'manual') return slides.length <= 2
  if (item.format === 'story' && item.storyMode === 'auto') return slides.length === 1
  return false
}

export function readinessError(item) {
  if (!item) return 'Item not found.'
  if (item.format === 'carousel' && (item.slides || []).length > MAX_CAROUSEL_SLIDES) {
    return `Carousels can include at most ${MAX_CAROUSEL_SLIDES} images.`
  }
  if (!isReady(item)) return 'This item needs a time, caption, and slides before it can be approved.'
  return null
}

function snapshot(item) {
  return {
    version: (item.approved?.version || 0) + 1,
    caption: item.caption,
    slides: (item.slides || []).map((slide) => ({ ...slide })),
  }
}

function acceptItem(item) {
  const error = readinessError(item)
  if (error) return { item, error }
  if (!pacificToUtcIso(item.scheduleLocal.date, item.scheduleLocal.time)) {
    return { item, error: 'Enter a date and time.' }
  }
  return {
    item: {
      ...item,
      status: 'approved',
      publishAtUtc: null,
      approved: snapshot(item),
      lastError: null,
    },
    error: null,
  }
}

export function approveItem(state, itemId) {
  const existing = state.items.find((item) => item.id === itemId)
  if (!existing) return { state, error: 'Item not found.', item: null }
  const accepted = acceptItem(existing)
  return {
    state: {
      ...state,
      items: state.items.map((item) => (item.id === itemId ? accepted.item : item)),
    },
    error: accepted.error,
    item: accepted.error ? null : accepted.item,
  }
}

export function approvePack(state, packId) {
  const errors = []
  const approvedItems = []
  const items = state.items.map((item) => {
    if (item.packId !== packId || item.status === 'cancelled') return item
    const result = acceptItem(item)
    if (result.error) {
      errors.push({ id: item.id, error: result.error })
      return item
    }
    approvedItems.push(result.item)
    return result.item
  })
  return { state: { ...state, items }, errors, items: approvedItems }
}

export function editItem(state, itemId, patch) {
  return {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== itemId || item.status === 'published' || item.status === 'cancelled') return item
      const next = {
        ...item,
        caption: patch.caption ?? item.caption,
        scheduleLocal: patch.scheduleLocal
          ? { ...item.scheduleLocal, ...patch.scheduleLocal, timeZone: TIME_ZONE }
          : item.scheduleLocal,
        storyMode: patch.storyMode ?? item.storyMode,
        slides: patch.slides ?? item.slides,
      }
      const changed =
        next.caption !== item.caption ||
        next.scheduleLocal?.date !== item.scheduleLocal?.date ||
        next.scheduleLocal?.time !== item.scheduleLocal?.time ||
        next.storyMode !== item.storyMode ||
        next.slides !== item.slides
      if (!changed) return item
      if (item.status === 'scheduled' || item.status === 'approved' || item.status === 'failed' || item.status === 'needs_reapproval') {
        return { ...next, status: 'needs_reapproval', publishAtUtc: null }
      }
      return { ...next, publishAtUtc: null }
    }),
  }
}

export function cancelItem(state, itemId) {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, status: 'cancelled', publishAtUtc: null } : item,
    ),
  }
}

export function overlapWarnings(items) {
  const warnings = []
  const active = items.filter((item) => item.status !== 'cancelled' && item.scheduleLocal?.date)
  for (let index = 0; index < active.length; index += 1) {
    for (let other = index + 1; other < active.length; other += 1) {
      const a = active[index]
      const b = active[other]
      if (a.scheduleLocal.date === b.scheduleLocal.date && a.scheduleLocal.time === b.scheduleLocal.time) {
        warnings.push({ ids: [a.id, b.id], date: a.scheduleLocal.date, time: a.scheduleLocal.time })
      }
    }
  }
  return warnings
}

export function eventChangeError(item, catalog) {
  if (!catalog || !item.eventRefs?.length) return null
  for (const ref of item.eventRefs) {
    const event = catalog.get(ref.id)
    if (!event) continue
    if (event.status === 'Cancelled' || event.isLive === false) {
      return `${event.title || ref.id} is no longer live.`
    }
    if (ref.date && event.date && event.date !== ref.date) {
      return `${event.title || ref.id} moved from ${ref.date} to ${event.date}.`
    }
    if (ref.cost && event.cost && event.cost !== ref.cost) {
      return `${event.title || ref.id} price changed.`
    }
  }
  return null
}

/** Manual-story reminders. This does not publish. */
export function syncReminders(state, now) {
  const nowMs = now.getTime()
  const reminders = [...state.reminders]
  for (const item of state.items) {
    if (item.status !== 'scheduled' || item.format !== 'story' || item.storyMode !== 'manual') continue
    if (!item.publishAtUtc || !item.approved) continue
    const publishMs = Date.parse(item.publishAtUtc)
    const fireMs = publishMs - REMINDER_LEAD_MS
    if (nowMs < fireMs || nowMs >= publishMs) continue
    const exists = reminders.some(
      (reminder) =>
        reminder.itemId === item.id &&
        reminder.kind === 'manual' &&
        reminder.approvalVersion === item.approved.version,
    )
    if (exists) continue
    reminders.push({
      id: `manual-${item.id}-v${item.approved.version}`,
      itemId: item.id,
      kind: 'manual',
      approvalVersion: item.approved.version,
      href: `/admin/social?item=${item.id}`,
      createdAt: now.toISOString(),
    })
  }
  return { ...state, reminders }
}

export function addAlert(state, item, kind, message) {
  const reminder = {
    id: `${kind}-${item.id}-v${item.approved?.version || 0}-${Date.now()}`,
    itemId: item.id,
    kind,
    approvalVersion: item.approved?.version || 0,
    href: `/admin/social?item=${item.id}`,
    message,
    createdAt: new Date().toISOString(),
  }
  return { ...state, reminders: [...state.reminders, reminder] }
}

export function dueItems(state, now, { forceItemId } = {}) {
  if (state.pausePublishing && !forceItemId) return []
  return state.items.filter((item) => {
    if (item.format === 'xiaohongshu') return false
    if (item.format === 'story' && item.storyMode === 'manual') return false
    if (forceItemId) return item.id === forceItemId && item.status === 'scheduled'
    if (item.status !== 'scheduled' || !item.publishAtUtc || !item.approved) return false
    return Date.parse(item.publishAtUtc) <= now.getTime()
  })
}

export function markPublished(item, mediaId) {
  return {
    ...item,
    status: 'published',
    instagramMediaId: mediaId || `mock-${item.id}-v${item.approved.version}`,
    publishedPayload: {
      caption: item.approved.caption,
      slides: item.approved.slides.map((slide) => slide.token),
    },
    lastError: null,
  }
}

export function markNeedsReapproval(item, error) {
  return { ...item, status: 'needs_reapproval', publishAtUtc: null, lastError: error }
}

export function markFailed(item, error) {
  return { ...item, status: 'failed', lastError: error }
}

export function publicState(state) {
  const instagram = state.instagram
  return {
    packs: state.packs,
    items: state.items,
    reminders: state.reminders,
    pausePublishing: state.pausePublishing,
    overlaps: overlapWarnings(state.items),
    publishMode: process.env.SOCIAL_PUBLISH_MODE === 'live' ? 'live' : 'mock',
    instagram: instagram
      ? { connected: true, configured: true, userId: instagram.userId || null, expiresAt: instagram.expiresAt || null }
      : {
          connected: false,
          configured: Boolean(process.env.INSTAGRAM_APP_ID?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim()),
        },
  }
}
