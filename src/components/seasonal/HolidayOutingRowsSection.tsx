'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'
import { holidayBrowseAllHref } from '../../utils/browseShareParams'
import { BrowseEventCard } from '../BrowseEventCard'
import './holidayOutingRows.css'

const OUTING_ROW_LIMIT = 6
const SECTION_TITLE = 'Find your next holiday outing'
const SECTION_DEK = 'Lights, festive shows, and outings nearby or worth a little drive.'

function TitleChevron() {
  return (
    <svg className="hmg-outing-band__title-chevron" width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ScrollChevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d={dir === 'prev' ? 'M10 3.5 5.5 8 10 12.5' : 'M6 3.5 10.5 8 6 12.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function eventImageSrc(event: Event) {
  return event.imageUrl?.trim() || ''
}

type BandProps = {
  headingId: string
  title: string
  subtitle: string
  events: Event[]
  browseHref: string
  onEventClick: (event: Event) => void
}

function OutingBand({ headingId, title, subtitle, events, browseHref, onEventClick }: BandProps) {
  const preview = events.slice(0, OUTING_ROW_LIMIT)
  const empty = preview.length === 0
  const listRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const seeAllThumbs = preview
    .map(eventImageSrc)
    .filter(Boolean)
    .slice(0, 3)
  const navLabelId = useId()

  const updateScrollState = useCallback(() => {
    const list = listRef.current
    if (!list) {
      setCanPrev(false)
      setCanNext(false)
      return
    }
    const max = list.scrollWidth - list.clientWidth
    setCanPrev(list.scrollLeft > 4)
    setCanNext(list.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    updateScrollState()
    list.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollState) : null
    ro?.observe(list)
    return () => {
      list.removeEventListener('scroll', updateScrollState)
      ro?.disconnect()
    }
  }, [updateScrollState, preview.length])

  const scrollByPage = (dir: 'prev' | 'next') => {
    const list = listRef.current
    if (!list) return
    const delta = Math.max(list.clientWidth * 0.85, 280)
    list.scrollBy({
      left: dir === 'next' ? delta : -delta,
      behavior: 'smooth',
    })
  }

  return (
    <section className="hmg-outing-band" aria-labelledby={headingId}>
      <header className="hmg-outing-band__header">
        <div className="hmg-outing-band__copy">
          <div className="hmg-outing-band__title-row">
            <h3 id={headingId} className="hmg-outing-band__title">
              <Link to={browseHref} className="hmg-outing-band__title-link">
                <span>{title}</span>
                <TitleChevron />
              </Link>
            </h3>
            {!empty ? (
              <div
                className="hmg-outing-band__scroll-nav"
                role="group"
                aria-labelledby={navLabelId}
              >
                <span id={navLabelId} className="visually-hidden">
                  Scroll {title} cards
                </span>
                <button
                  type="button"
                  className="hmg-outing-band__scroll-btn"
                  aria-label={`Previous ${title} cards`}
                  disabled={!canPrev}
                  onClick={() => scrollByPage('prev')}
                >
                  <ScrollChevron dir="prev" />
                </button>
                <button
                  type="button"
                  className="hmg-outing-band__scroll-btn"
                  aria-label={`Next ${title} cards`}
                  disabled={!canNext}
                  onClick={() => scrollByPage('next')}
                >
                  <ScrollChevron dir="next" />
                </button>
              </div>
            ) : null}
          </div>
          <p className="hmg-outing-band__subtitle">{subtitle}</p>
        </div>
      </header>

      {empty ? (
        <p className="hmg-outing-band__empty">No activities in this section right now.</p>
      ) : (
        <div
          className="hmg-outing-band__track browse-content"
          role="region"
          aria-label={`${title} event cards`}
        >
          <ul className="hmg-outing-band__list" ref={listRef}>
            {preview.map((event) => (
              <li key={event.id} className="hmg-outing-band__item">
                <BrowseEventCard
                  event={event}
                  seasonalEditorial={false}
                  venueResponsive
                  onClick={() => onEventClick(event)}
                />
              </li>
            ))}
            <li className="hmg-outing-band__item hmg-outing-band__item--see-all">
              <Link to={browseHref} className="hmg-outing-see-all">
                <div className="hmg-outing-see-all__stack" aria-hidden>
                  {seeAllThumbs.length > 0 ? (
                    seeAllThumbs.map((src, index) => (
                      <img
                        key={`${src}-${index}`}
                        src={src}
                        alt=""
                        className={`hmg-outing-see-all__thumb hmg-outing-see-all__thumb--${index}`}
                        decoding="async"
                      />
                    ))
                  ) : (
                    <span className="hmg-outing-see-all__placeholder" />
                  )}
                </div>
                <span className="hmg-outing-see-all__label">See all</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}

type Props = {
  collection: SeasonalCollection
  closeToHomeEvents: Event[]
  driveEvents: Event[]
  onEventClick: (event: Event) => void
  /** Preserve city on Browse all when a location filter is already active. */
  city?: string | null
}

export function HolidayOutingRowsSection({
  collection,
  closeToHomeEvents,
  driveEvents,
  onEventClick,
  city,
}: Props) {
  const closeToHome = collection.closeToHome
  const worthADrive = collection.worthADrive
  const browseHref = holidayBrowseAllHref({ city })

  if (!closeToHome || !worthADrive) return null

  return (
    <section
      id="events"
      className="hmg-outing-rows"
      aria-labelledby="hmg-outing-rows-heading"
    >
      <header className="hmg-outing-rows__intro">
        <h2 id="hmg-outing-rows-heading" className="hmg-outing-rows__heading">
          {SECTION_TITLE}
        </h2>
        <p className="hmg-outing-rows__dek supporting-copy">{SECTION_DEK}</p>
      </header>

      <OutingBand
        headingId="hmg-outing-close-heading"
        title={closeToHome.title}
        subtitle={closeToHome.subtitle}
        events={closeToHomeEvents}
        browseHref={browseHref}
        onEventClick={onEventClick}
      />

      <OutingBand
        headingId="hmg-outing-drive-heading"
        title={worthADrive.title}
        subtitle={worthADrive.subtitle}
        events={driveEvents}
        browseHref={browseHref}
        onEventClick={onEventClick}
      />
    </section>
  )
}
