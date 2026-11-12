'use client'

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MergedDatePicker,
  buildCalendarMonths,
  type DatePickerStyle,
} from '../components/experiment/MergedStackDatePicker'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { formatShortDate, getAnchorDate, getTemporalTabs } from '../utils/dates'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-where-when-search.css'

type Panel = 'where' | 'when' | null

type WhereOption = {
  key: string
  title: string
  sub: string
  tone: 'nearby' | 'city' | 'other'
}

type WhenOption = {
  key: string
  title: string
  sub: string
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg className="wws-typeahead__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

const DATE_STYLES: Array<{
  id: DatePickerStyle
  tag: string
  title: string
  desc: string
}> = [
  {
    id: 'stack',
    tag: 'Style 1',
    title: 'Stack',
    desc: 'Type on top, one month grid under tabs. Compact default for both breakpoints.',
  },
  {
    id: 'split',
    tag: 'Style 2',
    title: 'Split',
    desc: 'Desktop: type left, calendar right. Mobile: same stack, tighter.',
  },
  {
    id: 'inline',
    tag: 'Style 3',
    title: 'Inline bar',
    desc: 'Month tabs + type field on one row; densest chrome.',
  },
  {
    id: 'dense',
    tag: 'Style 4',
    title: 'Dense sheet',
    desc: 'Smaller type row + tighter day cells for short sheets.',
  },
]

export function ExperimentWhereWhenSearchPage() {
  const anchor = useMemo(() => getAnchorDate(), [])
  const temporalTabs = useMemo(() => getTemporalTabs(anchor), [anchor])
  const calendarMonths = useMemo(() => buildCalendarMonths(anchor), [anchor])

  const whenOptions: WhenOption[] = useMemo(
    () => [
      ...temporalTabs.map((tab) => ({ key: tab.key, title: tab.label, sub: tab.sub })),
      { key: 'anytime', title: 'Anytime', sub: 'Next 2 months' },
    ],
    [temporalTabs],
  )

  const [panel, setPanel] = useState<Panel>('where')
  const [query, setQuery] = useState('')
  const [whereKey, setWhereKey] = useState('all')
  const [whenKey, setWhenKey] = useState('today')
  const [pickedYmd, setPickedYmd] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  function pickDate(ymd: string) {
    setPickedYmd(ymd)
    setWhenKey('date')
  }

  const whereLabel = WHERE_OPTIONS.find((row) => row.key === whereKey)?.title ?? 'All cities'
  const whenLabel = (() => {
    if (whenKey === 'date' && pickedYmd) {
      const parsed = new Date(`${pickedYmd}T12:00:00`)
      return formatShortDate(parsed)
    }
    return whenOptions.find((row) => row.key === whenKey)?.title ?? 'Today'
  })()

  const filteredWhere = WHERE_OPTIONS.filter((row) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return row.title.toLowerCase().includes(q) || row.sub.toLowerCase().includes(q) || row.key.toLowerCase().includes(q)
  })

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((current) => (current === next ? null : next))
  }

  return (
    <div className="home-experiment-shell home-experiment-shell--refined">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer layout="wide" className="wws-page">
        <p className="wws-note">
          Experiment mock — not wired to live Home/Browse filters.{' '}
          <Link to="/experiment/where-when-home-browse">See Style 1 on Home + Browse</Link>
          {' · '}
          <Link to="/">Back to Home</Link>
        </p>

        <h1 className="wws-title">Where / When search</h1>
        <p className="wws-lede">
          Airbnb-style suggested list + typeahead, kept in Puddles chrome. Selecting only updates this
          mock pill.
        </p>

        <div className="wws-stage">
          <div className="wws-pill" role="group" aria-label="Where and when">
            <button
              type="button"
              className={['wws-pill__seg', panel === 'where' ? 'wws-pill__seg--active' : '']
                .filter(Boolean)
                .join(' ')}
              aria-expanded={panel === 'where'}
              onClick={() => togglePanel('where')}
            >
              <span className="wws-pill__label">Where</span>
              <span className="wws-pill__value">{whereLabel}</span>
            </button>
            <button
              type="button"
              className={['wws-pill__seg', panel === 'when' ? 'wws-pill__seg--active' : '']
                .filter(Boolean)
                .join(' ')}
              aria-expanded={panel === 'when'}
              onClick={() => togglePanel('when')}
            >
              <span className="wws-pill__label">When</span>
              <span className="wws-pill__value">{whenLabel}</span>
            </button>
          </div>

          {panel === 'where' ? (
            <div className="wws-panel" role="dialog" aria-label="Suggested destinations">
              <p className="wws-panel__eyebrow">Suggested destinations</p>
              <label className="wws-typeahead">
                <SearchIcon />
                <input
                  className="wws-typeahead__input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search city or ZIP"
                  aria-label="Search city or ZIP"
                />
              </label>
              <div className="wws-list">
                {filteredWhere.length === 0 ? (
                  <p className="wws-empty">No matching cities — try a core city name, or Around the Bay.</p>
                ) : (
                  filteredWhere.map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      className={[
                        'wws-row',
                        whereKey === row.key ? 'wws-row--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        setWhereKey(row.key)
                        setPanel(null)
                      }}
                    >
                      <span
                        className={[
                          'wws-row__icon',
                          row.tone === 'nearby' ? 'wws-row__icon--nearby' : '',
                          row.tone === 'other' ? 'wws-row__icon--other' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-hidden
                      >
                        <PinIcon />
                      </span>
                      <span className="wws-row__copy">
                        <span className="wws-row__title">{row.title}</span>
                        <span className="wws-row__sub">{row.sub}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {panel === 'when' ? (
            <div className="wws-panel" role="dialog" aria-label="When">
              <p className="wws-panel__eyebrow">Home</p>
              <div className="wws-list">
                {whenOptions
                  .filter((row) => row.key !== 'anytime')
                  .map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      className={[
                        'wws-row',
                        whenKey === row.key && !showCalendar ? 'wws-row--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        setWhenKey(row.key)
                        setShowCalendar(false)
                        setPickedYmd(null)
                        setPanel(null)
                      }}
                    >
                      <span className="wws-row__icon wws-row__icon--when" aria-hidden>
                        <CalendarGlyph />
                      </span>
                      <span className="wws-row__copy">
                        <span className="wws-row__title">{row.title}</span>
                        <span className="wws-row__sub">{row.sub}</span>
                      </span>
                    </button>
                  ))}
              </div>

              <div className="wws-subsection">
                <p className="wws-panel__eyebrow">Browse</p>
                <div className="wws-list">
                  <button
                    type="button"
                    className={[
                      'wws-row',
                      whenKey === 'anytime' ? 'wws-row--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setWhenKey('anytime')
                      setShowCalendar(false)
                      setPickedYmd(null)
                      setPanel(null)
                    }}
                  >
                    <span className="wws-row__icon wws-row__icon--when" aria-hidden>
                      <CalendarGlyph />
                    </span>
                    <span className="wws-row__copy">
                      <span className="wws-row__title">Anytime</span>
                      <span className="wws-row__sub">Next 2 months</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={[
                      'wws-row',
                      whenKey === 'date' ? 'wws-row--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setShowCalendar(true)}
                  >
                    <span className="wws-row__icon wws-row__icon--when" aria-hidden>
                      <CalendarGlyph />
                    </span>
                    <span className="wws-row__copy">
                      <span className="wws-row__title">Pick a date</span>
                      <span className="wws-row__sub">
                        {pickedYmd
                          ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
                          : 'Single day within the listing window'}
                      </span>
                    </span>
                  </button>
                </div>

                {showCalendar ? (
                  <p className="wws-pick-hint">
                    Compare merged type + calendar styles below (mobile vs desktop).{' '}
                    <Link to="/experiment/where-when-home-browse">Style 1 on Home + Browse →</Link>
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {showCalendar ? (
          <section className="wws-date-mockups" aria-label="Merged pick-a-date styles">
            <header className="wws-date-mockups__intro">
              <h2 className="wws-date-mockups__heading">Pick a date — merged A + B</h2>
              <p className="wws-date-mockups__lede">
                Type a date or tap the calendar. Four compact layouts with mobile and desktop frames.
              </p>
            </header>

            {DATE_STYLES.map((style) => (
              <article key={style.id} className="wws-date-mock">
                <header className="wws-date-mock__head">
                  <p className="wws-date-mock__tag">{style.tag}</p>
                  <h3 className="wws-date-mock__title">{style.title}</h3>
                  <p className="wws-date-mock__desc">{style.desc}</p>
                </header>
                <div className="wws-date-mock__frames">
                  <div className="wws-frame wws-frame--mobile">
                    <p className="wws-frame__label">Mobile</p>
                    <div className="wws-frame__body">
                      <MergedDatePicker
                        style={style.id}
                        months={calendarMonths}
                        anchor={anchor}
                        pickedYmd={pickedYmd}
                        onPick={pickDate}
                      />
                    </div>
                  </div>
                  <div className="wws-frame wws-frame--desktop">
                    <p className="wws-frame__label">Desktop</p>
                    <div className="wws-frame__body">
                      <MergedDatePicker
                        style={style.id}
                        months={calendarMonths}
                        anchor={anchor}
                        pickedYmd={pickedYmd}
                        onPick={pickDate}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}
