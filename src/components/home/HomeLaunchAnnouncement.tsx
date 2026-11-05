'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeAnnouncements, type HomeAnnouncementSlide } from '../../data/homeAnnouncements'

/** Launch announcement — flush under global nav (PlanetBox-style promo bar). */
export const HOME_LAUNCH_PREVIEW_ANNOUNCEMENT =
  '📍 Palo Alto · Los Altos · Mountain View · Sunnyvale + nearby adventures.'

const ROTATE_MS = 6000

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function AnnouncementCopy({ slide }: { slide: HomeAnnouncementSlide }) {
  if (slide.href) {
    return (
      <Link to={slide.href} className="home-announcement-bar__link">
        {slide.text}
      </Link>
    )
  }
  return <>{slide.text}</>
}

export function HomeLaunchAnnouncement({ message }: { message?: string } = {}) {
  const slides = message
    ? [{ id: 'custom', text: message } satisfies HomeAnnouncementSlide]
    : getHomeAnnouncements()
  const multi = slides.length > 1
  const labelId = useId()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current = prefersReducedMotion()
  }, [])

  useEffect(() => {
    if (!multi || paused || reduceMotion.current) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [multi, paused, slides.length])

  const active = slides[Math.min(index, slides.length - 1)] ?? slides[0]

  return (
    <div
      className={[
        'home-announcement-bar',
        multi ? 'home-announcement-bar--carousel' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <p id={labelId} className="home-announcement-bar__text">
        <AnnouncementCopy slide={active} />
      </p>
      {multi ? (
        <div className="home-announcement-bar__controls" role="group" aria-label="Announcements">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className={[
                'home-announcement-bar__dot',
                slideIndex === index ? 'home-announcement-bar__dot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`Show announcement ${slideIndex + 1} of ${slides.length}`}
              aria-current={slideIndex === index ? 'true' : undefined}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
