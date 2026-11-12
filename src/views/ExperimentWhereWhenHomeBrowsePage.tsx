'use client'

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MergedStackDatePicker,
  buildCalendarMonths,
} from '../components/experiment/MergedStackDatePicker'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { formatShortDate, getAnchorDate, getTemporalTabs } from '../utils/dates'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-where-when-home-browse.css'

type Panel = 'where' | 'when' | null

type WhereOption = {
  key: string
  title: string
  sub: string
  tone: 'nearby' | 'city' | 'other'
}

const WHERE_OPTIONS: WhereOption[] = [
  { key: 'nearby', title: 'Nearby', sub: 'Near you · within ~8 mi', tone: 'nearby' },
  { key: 'Palo Alto', title: 'Palo Alto', sub: 'Core city', tone: 'city' },
  { key: 'Los Altos', title: 'Los Altos', sub: 'Includes Los Altos Hills', tone: 'city' },
  { key: 'Mountain View', title: 'Mountain View', sub: 'Core city', tone: 'city' },
  { key: 'Sunnyvale', title: 'Sunnyvale', sub: 'Core city', tone: 'city' },
  { key: 'other', title: 'Around the Bay', sub: 'Outside the core four', tone: 'other' },
  { key: 'all', title: 'All cities', sub: 'Everything we list', tone: 'other' },
]

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function SurfaceMock({
  surface,
  defaultWhere,
  defaultWhen,
  includeAnytime,
  whereTitleCase,
}: {
  surface: 'home' | 'browse'
  defaultWhere: string
  defaultWhen: string
  includeAnytime: boolean
  whereTitleCase: 'All Cities' | 'All cities'
}) {
  const anchor = useMemo(() => getAnchorDate(), [])
  const temporalTabs = useMemo(() => getTemporalTabs(anchor), [anchor])
  const months = useMemo(() => buildCalendarMonths(anchor), [anchor])

  const whenRows = useMemo(() => {
    const rows: Array<{ key: string; title: string; sub: string }> = temporalTabs.map((tab) => ({
      key: tab.key,
      title: tab.label,
      sub: tab.sub,
    }))
    if (includeAnytime) rows.push({ key: 'anytime', title: 'Anytime', sub: 'Next 2 months' })
    return rows
  }, [temporalTabs, includeAnytime])

  const [panel, setPanel] = useState<Panel>(null)
  const [query, setQuery] = useState('')
  const [whereKey, setWhereKey] = useState(defaultWhere)
  const [whenKey, setWhenKey] = useState(defaultWhen)
  const [pickedYmd, setPickedYmd] = useState<string | null>(null)
  const [showDate, setShowDate] = useState(false)

  const whereOptions = WHERE_OPTIONS.map((row) =>
    row.key === 'all' ? { ...row, title: whereTitleCase } : row,
  )

  const whereLabel = whereOptions.find((row) => row.key === whereKey)?.title ?? whereTitleCase
  const whenLabel = (() => {
    if (whenKey === 'date' && pickedYmd) {
      return formatShortDate(new Date(`${pickedYmd}T12:00:00`))
    }
    return whenRows.find((row) => row.key === whenKey)?.title ?? whenRows[0]?.title ?? 'Today'
  })()

  const filteredWhere = whereOptions.filter((row) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      row.title.toLowerCase().includes(q) ||
      row.sub.toLowerCase().includes(q) ||
      row.key.toLowerCase().includes(q)
    )
  })

  function toggle(next: Exclude<Panel, null>) {
    setPanel((current) => (current === next ? null : next))
  }

  const controls = (
    <>
      <div className="wwhb-pill" role="group" aria-label="Where and when">
        <button
          type="button"
          className={['wwhb-pill__seg', panel === 'where' ? 'wwhb-pill__seg--active' : '']
            .filter(Boolean)
            .join(' ')}
          aria-expanded={panel === 'where'}
          onClick={() => toggle('where')}
        >
          <span className="wwhb-pill__label">Where</span>
          <span className="wwhb-pill__value">{whereLabel}</span>
        </button>
        <button
          type="button"
          className={['wwhb-pill__seg', panel === 'when' ? 'wwhb-pill__seg--active' : '']
            .filter(Boolean)
            .join(' ')}
          aria-expanded={panel === 'when'}
          onClick={() => toggle('when')}
        >
          <span className="wwhb-pill__label">When</span>
          <span className="wwhb-pill__value">{whenLabel}</span>
        </button>
      </div>

      {panel === 'where' ? (
        <div className="wwhb-panel" role="dialog" aria-label="Where">
          <p className="wwhb-panel__eyebrow">Suggested destinations</p>
          <label className="wwhb-typeahead">
            <SearchIcon />
            <input
              className="wwhb-typeahead__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city or ZIP"
              aria-label="Search city or ZIP"
            />
          </label>
          <div className="wwhb-list">
            {filteredWhere.length === 0 ? (
              <p className="wwhb-empty">No matching cities.</p>
            ) : (
              filteredWhere.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={['wwhb-row', whereKey === row.key ? 'wwhb-row--selected' : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    setWhereKey(row.key)
                    setPanel(null)
                  }}
                >
                  <span
                    className={[
                      'wwhb-row__icon',
                      row.tone === 'nearby' ? 'wwhb-row__icon--nearby' : '',
                      row.tone === 'other' ? 'wwhb-row__icon--other' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden
                  >
                    <PinIcon />
                  </span>
                  <span className="wwhb-row__copy">
                    <span className="wwhb-row__title">{row.title}</span>
                    <span className="wwhb-row__sub">{row.sub}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {panel === 'when' ? (
        <div className="wwhb-panel" role="dialog" aria-label="When">
          <p className="wwhb-panel__eyebrow">{surface === 'home' ? 'Home when' : 'Browse when'}</p>
          <div className="wwhb-list">
            {whenRows.map((row) => (
              <button
                key={row.key}
                type="button"
                className={[
                  'wwhb-row',
                  whenKey === row.key && !showDate ? 'wwhb-row--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setWhenKey(row.key)
                  setShowDate(false)
                  setPickedYmd(null)
                  setPanel(null)
                }}
              >
                <span className="wwhb-row__icon wwhb-row__icon--when" aria-hidden>
                  <CalendarGlyph />
                </span>
                <span className="wwhb-row__copy">
                  <span className="wwhb-row__title">{row.title}</span>
                  <span className="wwhb-row__sub">{row.sub}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              className={['wwhb-row', whenKey === 'date' ? 'wwhb-row--selected' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setShowDate(true)}
            >
              <span className="wwhb-row__icon wwhb-row__icon--when" aria-hidden>
                <CalendarGlyph />
              </span>
              <span className="wwhb-row__copy">
                <span className="wwhb-row__title">Pick a date</span>
                <span className="wwhb-row__sub">
                  {pickedYmd
                    ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
                    : 'Tap the calendar'}
                </span>
              </span>
            </button>
          </div>
          {showDate ? (
            <div className="wwhb-date">
              <MergedStackDatePicker
                months={months}
                anchor={anchor}
                pickedYmd={pickedYmd}
                onPick={(ymd) => {
                  setPickedYmd(ymd)
                  setWhenKey('date')
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (surface === 'home') {
    return (
      <div className="wwhb-home-shell">
        <div className="wwhb-announce" aria-hidden>
          📍 Palo Alto · Los Altos · Mountain View · Sunnyvale + nearby adventures.
        </div>
        <div className="wwhb-home-body">
          <h3 className="wwhb-home-heading">Find activities</h3>
          {controls}
        </div>
      </div>
    )
  }

  return (
    <div className="wwhb-browse-shell">
      <div className="wwhb-browse-bar">
        <span>Filters</span>
        <span className="wwhb-browse-bar__meta">Browse mock</span>
      </div>
      <div className="wwhb-browse-sheet">{controls}</div>
    </div>
  )
}

export function ExperimentWhereWhenHomeBrowsePage() {
  return (
    <div className="home-experiment-shell home-experiment-shell--refined">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer layout="wide" className="wwhb-page">
        <p className="wwhb-note">
          Experiment mock — Style 1 stack only; not wired to live filters.{' '}
          <Link to="/experiment/home-where-when-pill">Full Home + pill</Link>
          {' · '}
          <Link to="/experiment/browse-where-when-pill">Browse + pill</Link>
          {' · '}
          <Link to="/experiment/where-when-search">All date styles</Link>
          {' · '}
          <Link to="/">Back to Home</Link>
        </p>

        <h1 className="wwhb-title">Where / When on Home + Browse</h1>
        <p className="wwhb-lede">
          Segmented Where/When pill with Style 1 pick-a-date (type + month calendar). Defaults match
          today’s live product.
        </p>

        <section className="wwhb-section" aria-labelledby="wwhb-home-heading">
          <header className="wwhb-section__head">
            <p className="wwhb-section__tag">Home</p>
            <h2 id="wwhb-home-heading" className="wwhb-section__title">
              Home filters
            </h2>
            <p className="wwhb-section__default">Default: All Cities · Today</p>
          </header>
          <SurfaceMock
            surface="home"
            defaultWhere="all"
            defaultWhen="today"
            includeAnytime={false}
            whereTitleCase="All Cities"
          />
        </section>

        <section className="wwhb-section" aria-labelledby="wwhb-browse-heading">
          <header className="wwhb-section__head">
            <p className="wwhb-section__tag">Browse</p>
            <h2 id="wwhb-browse-heading" className="wwhb-section__title">
              Browse filters
            </h2>
            <p className="wwhb-section__default">Default: All cities · Anytime</p>
          </header>
          <SurfaceMock
            surface="browse"
            defaultWhere="all"
            defaultWhen="anytime"
            includeAnytime
            whereTitleCase="All cities"
          />
        </section>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}
