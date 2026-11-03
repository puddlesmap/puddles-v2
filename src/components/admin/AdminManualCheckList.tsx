import { useEffect, useState } from 'react'
import {
  ADMIN_MANUAL_CHECK_LINKS,
  pacificIsoWeekKey,
} from '../../data/adminManualCheckLinks'

function storageKeyForWeek(weekKey: string) {
  return `puddles-admin-manual-checks-${weekKey}`
}

function readChecked(storageKey: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, boolean>
  } catch {
    return {}
  }
}

const OPEN_ALL_STAGGER_MS = 200

export function AdminManualCheckList() {
  const weekKey = pacificIsoWeekKey()
  const storageKey = storageKeyForWeek(weekKey)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openAllNote, setOpenAllNote] = useState('')
  const [openingAll, setOpeningAll] = useState(false)

  useEffect(() => {
    setChecked(readChecked(storageKey))
  }, [storageKey])

  function toggle(id: string) {
    setChecked((current) => {
      const next = { ...current, [id]: !current[id] }
      if (!next[id]) delete next[id]
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  async function openAllThisWeek() {
    setOpenAllNote('')
    setOpeningAll(true)
    const urls = ADMIN_MANUAL_CHECK_LINKS.map((link) => link.url.trim()).filter((url) =>
      /^https?:\/\//i.test(url),
    )
    let opened = 0
    let blocked = 0
    for (let index = 0; index < urls.length; index += 1) {
      const handle = window.open(urls[index], '_blank', 'noopener,noreferrer')
      if (handle) opened += 1
      else blocked += 1
      if (index < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, OPEN_ALL_STAGGER_MS))
      }
    }
    setOpeningAll(false)
    if (blocked > 0) {
      setOpenAllNote(
        opened > 0
          ? `Opened ${opened}. ${blocked} blocked — allow pop-ups for this site, then try again.`
          : 'Pop-ups were blocked. Allow pop-ups for this site, then try Open all again.',
      )
    } else {
      setOpenAllNote(`Opened ${opened} tabs. Check the boxes after you look — this does not mark them looked.`)
    }
  }

  const looked = ADMIN_MANUAL_CHECK_LINKS.filter((link) => checked[link.id]).length

  return (
    <section className="admin-needs-attention admin-manual-checks" aria-labelledby="admin-manual-checks-title">
      <details className="admin-manual-checks__details">
        <summary className="admin-manual-checks__summary">
          <h2 id="admin-manual-checks-title">
            Open these this week · {looked} of {ADMIN_MANUAL_CHECK_LINKS.length} looked
          </h2>
        </summary>
        <div className="admin-manual-checks__toolbar">
          <p className="admin-review-flag__evidence">
            These links are for you in your own browser, or ask Cursor to open the same URLs in the
            Editor browser and scrape into Discovery. Checking a box only marks “looked” on this device —
            it does not add events to the queue.
          </p>
          <p className="admin-review-flag__evidence">
            <strong>Wednesdays @ 8:00 AM PT:</strong> GitHub runs library scrapes and ingests inbox JSON
            only — it does <em>not</em> open this checklist or read Instagram / FIT4MOM / roundups. To
            cover these sources each week, ask Cursor (or a scheduled Automation): “Open the manual
            checklist URLs in the Editor browser, scrape, and merge into{' '}
            <code>discovery-candidates.json</code>.” Keep Instagram logged in in Cursor Browser when
            scraping @cityofsunnyvale.
          </p>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={openingAll}
            onClick={() => void openAllThisWeek()}
          >
            {openingAll ? 'Opening…' : 'Open all this week'}
          </button>
        </div>
        {openAllNote ? (
          <p className="admin-manual-checks__open-note" role="status">
            {openAllNote}
          </p>
        ) : null}
        <ul className="admin-needs-attention__list">
        {ADMIN_MANUAL_CHECK_LINKS.map((link) => {
          const isLooked = Boolean(checked[link.id])
          return (
            <li key={link.id} className="admin-review-flag">
              <div className="admin-manual-checks__row">
                <label className="admin-manual-checks__check">
                  <input
                    type="checkbox"
                    checked={isLooked}
                    onChange={() => toggle(link.id)}
                  />
                  <span className="sr-only">Looked this week: {link.name}</span>
                </label>
                <div className="admin-manual-checks__copy">
                  <h3 className="admin-review-flag__title">{link.name}</h3>
                  <p className="admin-review-flag__note">{link.why}</p>
                </div>
                <a
                  className="admin-btn admin-btn-secondary"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </a>
              </div>
            </li>
          )
        })}
      </ul>
      </details>
    </section>
  )
}
