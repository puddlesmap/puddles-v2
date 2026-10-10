import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type Slide = { token: string; filename?: string }
type StudioItem = {
  id: string
  packId: string
  title: string
  format: 'carousel' | 'story' | 'xiaohongshu'
  storyMode: 'auto' | 'manual' | null
  status: string
  caption: string
  slides: Slide[]
  approved: { version: number; caption: string; slides: Slide[] } | null
  scheduleLocal: { date: string; time: string }
  publishAtUtc: string | null
  instagramMediaId: string | null
  lastError: string | null
  optional?: boolean
  lane?: 'weekday' | 'weekend' | 'seasonal'
}
type Reminder = { id: string; itemId: string; kind: string; href: string; message?: string }
type Studio = {
  packs: { id: string; title: string; kind: string }[]
  items: StudioItem[]
  reminders: Reminder[]
  pausePublishing: boolean
  overlaps: { ids: string[]; date: string; time: string }[]
  publishMode: string
  folderExport?: boolean
  instagram: { connected: boolean; configured?: boolean }
}

async function postStudio(body: Record<string, unknown>) {
  const response = await fetch('/api/social-studio', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as { ok: boolean; error?: string; message?: string; studio: Studio }
  if (!response.ok && !payload.studio) throw new Error(payload.error || 'Request failed')
  return payload
}

function statusLabel(status: string) {
  if (status === 'needs_reapproval') return 'Needs reapproval'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function hashtagLine(text: string) {
  const tags = text.match(/#[\p{L}\p{N}_]+/gu)
  return tags?.length ? tags.join(' ') : ''
}

function clockLabel(time: string) {
  const [hourText, minute] = time.split(':')
  const hour = Number(hourText)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${suffix}`
}

function dayLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(utc)
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(utc)
  return `${weekday}, ${monthName} ${day}`
}

function kindWord(item: StudioItem) {
  if (item.format === 'story') return 'Story'
  if (item.format === 'xiaohongshu') return '小紅書'
  return 'Carousel'
}

function scheduleLine(item: StudioItem, folderExport: boolean) {
  const when = `${dayLabel(item.scheduleLocal.date)} · ${clockLabel(item.scheduleLocal.time)} PT`
  const how = item.format === 'carousel' ? (folderExport ? 'Folder on approve' : 'Calendar on approve') : 'You post this'
  return `${when} · ${how}`
}

function KindCapsule({ item }: { item: StudioItem }) {
  return <span className={`admin-social__kind is-${item.format}`}>{kindWord(item)}</span>
}

function detailLine(item: StudioItem, folderExport: boolean) {
  const when = `${dayLabel(item.scheduleLocal.date)} at ${clockLabel(item.scheduleLocal.time)} PT`
  if (item.format === 'story') {
    return `Story. You post this ${when}. Add the hashtags as stickers.`
  }
  if (item.format === 'xiaohongshu') return `小紅書. You post this ${when}.`
  if (!folderExport) {
    return `Carousel. Approve saves the caption to the content calendar. It is not posted from here. ${when}.`
  }
  return `Carousel. Approve saves this to the weekly folder and the content calendar. It is not posted from here. ${when}.`
}

function monthCells(year: number, monthIndex: number) {
  const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const start = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
  const cells: Array<number | null> = Array.from({ length: start }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function AdminSocialStudioPage() {
  const [params] = useSearchParams()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [selectedId, setSelectedId] = useState(params.get('item') || '')
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [month, setMonth] = useState({ year: 2026, monthIndex: 9 })
  const [showStories, setShowStories] = useState(true)
  const [showPosts, setShowPosts] = useState(true)
  const [showXiaohongshu, setShowXiaohongshu] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [listGroup, setListGroup] = useState<'seasonal' | 'weekly'>('seasonal')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/social-studio', { credentials: 'include' })
    const payload = (await response.json()) as { studio: Studio }
    setStudio(payload.studio)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = studio?.items.find((item) => item.id === selectedId) || studio?.items[0]
  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    setCaption(selected.caption)
    setDate(selected.scheduleLocal.date)
    setTime(selected.scheduleLocal.time)
    setViewerIndex(null)
  }, [selected?.id, selected?.caption, selected?.slides?.length])

  const previewSlides = selected?.approved?.slides?.length ? selected.approved.slides : selected?.slides || []

  useEffect(() => {
    if (viewerIndex === null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setViewerIndex(null)
      if (event.key === 'ArrowRight') {
        setViewerIndex((index) => (index === null ? index : (index + 1) % previewSlides.length))
      }
      if (event.key === 'ArrowLeft') {
        setViewerIndex((index) => (index === null ? index : (index - 1 + previewSlides.length) % previewSlides.length))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerIndex, previewSlides.length])

  const attention = useMemo(
    () => studio?.items.filter((item) => item.status === 'failed' || item.status === 'needs_reapproval') || [],
    [studio],
  )

  const visibleItems = useMemo(() => {
    const items = studio?.items.filter((item) => item.status !== 'cancelled') || []
    return items.filter((item) => {
      if (item.format === 'story') return showStories
      if (item.format === 'xiaohongshu') return showXiaohongshu
      return showPosts
    })
  }, [studio, showStories, showPosts, showXiaohongshu])

  function itemsOnDay(day: number) {
    const date = `${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return visibleItems
      .filter((item) => item.scheduleLocal.date === date)
      .sort((a, b) => a.scheduleLocal.time.localeCompare(b.scheduleLocal.time))
  }

  async function copyText(text: string, note: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(note)
    } catch {
      setMessage('Copy failed. Select the caption and copy it yourself.')
    }
  }

  async function run(body: Record<string, unknown>, note: string) {
    setBusy(true)
    setMessage('')
    try {
      const payload = await postStudio(body)
      setStudio(payload.studio)
      setMessage(payload.message || payload.error || note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!studio || !selected) {
    return <p className="text-sm text-muted">Loading Social Studio…</p>
  }

  const folderExport = studio.folderExport !== false

  return (
    <div className="admin-social">
      <div className="admin-events-header">
        <div>
          <h2 className="font-display text-xl text-charcoal">Social Studio</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {folderExport
              ? 'Review a finished pack here. Approve saves the slides and captions into the weekly folder on this Mac and updates the Notion content calendar. It does not post to Instagram.'
              : 'Review a finished pack here. Approve updates the Notion content calendar. The weekly folder on this Mac updates when you approve from the local admin. It does not post to Instagram.'}
          </p>
        </div>
        <div className="admin-events-header-actions">
          {studio.publishMode === 'live' && studio.instagram.configured && !studio.instagram.connected ? (
            <a className="admin-btn admin-btn-primary" href="/api/instagram-oauth">Connect Instagram</a>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={busy}
            onClick={() => void run({ action: 'pause', paused: !studio.pausePublishing }, studio.pausePublishing ? 'Publishing resumed.' : 'Publishing paused.')}
          >
            {studio.pausePublishing ? 'Resume publishing' : 'Pause publishing'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={busy}
            onClick={() => void run(
              { action: 'publish-due' },
              studio.publishMode === 'live'
                ? 'Checked the queue and sent anything that was already due.'
                : 'Checked the queue. Nothing is sent to Instagram.',
            )}
          >
            {studio.publishMode === 'live' ? 'Publish due now' : 'Run mock publisher'}
          </button>
        </div>
      </div>

      {message ? <p className="admin-social__note">{message}</p> : null}
      {params.get('instagram') === 'failed' ? (
        <p className="admin-social__note">Instagram did not connect. Check the app keys and try Connect Instagram again.</p>
      ) : null}
      {studio.overlaps.length > 0 ? (
        <p className="admin-social__note">
          Overlapping times:{' '}
          {studio.overlaps.map((overlap) => `${overlap.date} ${overlap.time}`).join(' · ')}
        </p>
      ) : null}
      {attention.length > 0 ? (
        <p className="admin-social__note">
          Needs you:{' '}
          {attention.map((item) => item.title).join(', ')}
        </p>
      ) : null}
      <div className="admin-social__viewbar">
        <div className="admin-social__toggles" role="group" aria-label="View">
          <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</button>
          <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
        </div>
        {view === 'list' ? (
          <div className="admin-social__toggles" role="group" aria-label="List">
            <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={listGroup === 'seasonal'} onClick={() => setListGroup('seasonal')}>Seasonal</button>
            <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={listGroup === 'weekly'} onClick={() => setListGroup('weekly')}>Regular week</button>
          </div>
        ) : null}
      </div>

      {studio.reminders.length > 0 ? (
        <ul className="admin-social__reminders">
          {studio.reminders.map((reminder) => (
            <li key={reminder.id}>
              <a href={reminder.href}>{reminder.kind}</a>
              {reminder.message ? ` — ${reminder.message}` : ' — manual story is ready to post by hand.'}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={view === 'calendar' ? 'admin-social__layout is-calendar' : 'admin-social__layout'}>
        {view === 'calendar' ? (
          <section className="admin-social__calendar" aria-label="October schedule">
            <div className="admin-social__calendar-head">
              <h3>
                {new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(month.year, month.monthIndex, 1)))}
                {' '}
                {month.year}
              </h3>
              <div className="admin-social__toggles" role="group" aria-label="Show">
                <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={showStories} onClick={() => setShowStories((value) => !value)}>Stories</button>
                <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={showPosts} onClick={() => setShowPosts((value) => !value)}>Posts</button>
                <button type="button" className="admin-btn admin-btn-secondary" aria-pressed={showXiaohongshu} onClick={() => setShowXiaohongshu((value) => !value)}>小紅書</button>
              </div>
              <ul className="admin-social__legend">
                <li><i className="is-weekday" /> Weekday</li>
                <li><i className="is-weekend" /> Weekend</li>
                <li><i className="is-seasonal" /> Seasonal</li>
              </ul>
              <div className="admin-social__toggles">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setMonth((current) => current.monthIndex === 0 ? { year: current.year - 1, monthIndex: 11 } : { year: current.year, monthIndex: current.monthIndex - 1 })}>Previous</button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setMonth((current) => current.monthIndex === 11 ? { year: current.year + 1, monthIndex: 0 } : { year: current.year, monthIndex: current.monthIndex + 1 })}>Next</button>
              </div>
            </div>
            <div className="admin-social__weekdays" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="admin-social__month">
              {monthCells(month.year, month.monthIndex).map((day, index) => (
                <div key={`${month.year}-${month.monthIndex}-${index}`} className={day ? 'admin-social__day' : 'admin-social__day is-empty'}>
                  {day ? <span className="admin-social__day-number">{day}</span> : null}
                  {day ? itemsOnDay(day).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${item.lane ? `is-${item.lane}` : 'is-weekday'}${item.id === selected.id ? ' is-selected' : ''}`}
                      aria-label={`${item.title}. ${kindWord(item)} · ${clockLabel(item.scheduleLocal.time)}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span className="admin-social__chip-title">{item.title}</span>
                      <span className="admin-social__chip-meta">
                        <KindCapsule item={item} />
                        <span>{clockLabel(item.scheduleLocal.time)}</span>
                      </span>
                    </button>
                  )) : null}
                </div>
              ))}
            </div>
          </section>
        ) : (
        <div>
          {studio.packs.filter((pack) => pack.kind === listGroup).map((pack) => (
            <section key={pack.id} className="admin-social__pack">
              <div className="admin-social__pack-head">
                <h3>{pack.title}</h3>
                <span>{pack.kind}</span>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={busy}
                  onClick={() => void run({ action: 'approve-pack', packId: pack.id }, 'Saved this pack to the weekly folder.')}
                >
                  Approve pack
                </button>
              </div>
              <ul>
                {studio.items
                  .filter((item) => item.packId === pack.id)
                  .sort((a, b) => `${a.scheduleLocal.date}${a.scheduleLocal.time}`.localeCompare(`${b.scheduleLocal.date}${b.scheduleLocal.time}`))
                  .map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={item.id === selected.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <span className="admin-social__row-meta">
                        <KindCapsule item={item} />
                        <span>{scheduleLine(item, folderExport)}{item.optional ? ' · optional' : ''}</span>
                      </span>
                      <span>{statusLabel(item.status)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        )}

        <div className="admin-social__detail">
          <h3>
            {selected.title}
            <KindCapsule item={selected} />
          </h3>
          <p className="text-sm text-muted">
            {detailLine(selected, folderExport)}
            {selected.format === 'carousel' && selected.slides.length ? ` ${selected.slides.length} slides.` : ''}
            {selected.instagramMediaId ? ` ${selected.instagramMediaId}` : ''}
          </p>
          {selected.lastError ? <p className="admin-social__note">{selected.lastError}</p> : null}
          <div className="admin-social__slides">
            {previewSlides.map((slide, index) => (
              <button
                key={slide.token}
                type="button"
                className="admin-social__slide"
                aria-label={`Open slide ${index + 1} of ${previewSlides.length}`}
                onClick={() => setViewerIndex(index)}
              >
                <img src={`/api/social-studio/asset?token=${slide.token}`} alt="" />
              </button>
            ))}
          </div>
          <div className="admin-social__caption">
            <div className="admin-social__caption-head">
              <label htmlFor="social-caption">Caption</label>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => void copyText(caption, 'Caption copied.')}>
                Copy caption
              </button>
              {hashtagLine(caption) ? (
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => void copyText(hashtagLine(caption), 'Hashtags copied.')}>
                  Copy hashtags
                </button>
              ) : null}
            </div>
            <textarea id="social-caption" value={caption} onChange={(event) => setCaption(event.target.value)} rows={8} />
          </div>
          <div className="admin-social__times">
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Time (Pacific)
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
          </div>
          <div className="admin-events-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={busy}
              onClick={() => void run({
                action: 'edit',
                itemId: selected.id,
                caption,
                scheduleLocal: { date, time },
              }, 'Saved this item only.')}
            >
              Save
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={busy || selected.status === 'cancelled'}
              onClick={() => void run({ action: 'approve-item', itemId: selected.id }, 'Saved to the weekly folder.')}
            >
              Approve item
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={busy || selected.status === 'cancelled'}
              onClick={() => void run({ action: 'cancel', itemId: selected.id }, 'Cancelled this item only.')}
            >
              Cancel item
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={busy || selected.status !== 'scheduled' || selected.format !== 'carousel'}
              onClick={() => {
                if (studio.publishMode === 'live' && !window.confirm('Post this carousel to Instagram now?')) return
                void run(
                  { action: 'publish-due', forceItemId: selected.id },
                  studio.publishMode === 'live' ? 'Sent this carousel to Instagram.' : 'Mock publish attempted for this item.',
                )
              }}
            >
              {studio.publishMode === 'live' ? 'Publish this now' : 'Mock publish now'}
            </button>
          </div>
        </div>
      </div>
      {viewerIndex !== null && previewSlides[viewerIndex] ? (
        <div
          className="admin-social__viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`Slide ${viewerIndex + 1} of ${previewSlides.length}`}
          onClick={() => setViewerIndex(null)}
        >
          <button type="button" className="admin-btn admin-btn-secondary admin-social__viewer-close" onClick={() => setViewerIndex(null)}>
            Close
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={(event) => {
              event.stopPropagation()
              setViewerIndex((index) => (index === null ? index : (index - 1 + previewSlides.length) % previewSlides.length))
            }}
          >
            Previous
          </button>
          <img
            src={`/api/social-studio/asset?token=${previewSlides[viewerIndex].token}`}
            alt=""
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={(event) => {
              event.stopPropagation()
              setViewerIndex((index) => (index === null ? index : (index + 1) % previewSlides.length))
            }}
          >
            Next
          </button>
          <p className="admin-social__viewer-count">{viewerIndex + 1} / {previewSlides.length}</p>
        </div>
      ) : null}
    </div>
  )
}
