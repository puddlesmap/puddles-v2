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

export function AdminManualCheckList() {
  const weekKey = pacificIsoWeekKey()
  const storageKey = storageKeyForWeek(weekKey)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

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

  const looked = ADMIN_MANUAL_CHECK_LINKS.filter((link) => checked[link.id]).length

  return (
    <section className="admin-needs-attention admin-manual-checks" aria-labelledby="admin-manual-checks-title">
      <h2 id="admin-manual-checks-title">Open these this week</h2>
      <p className="admin-review-flag__evidence">
        {looked} of {ADMIN_MANUAL_CHECK_LINKS.length} looked. GitHub does not open these pages. Check
        the box after you look. A new date or a new event still needs a note in chat — the box does
        not add it.
      </p>
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
    </section>
  )
}
