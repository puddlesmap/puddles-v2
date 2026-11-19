import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GuideMapCategory, GuidePlace } from '../../data/halloweenGuide'
import { HOLIDAY_GUIDE_SECTION_NAV } from '../../data/holidayGuide'
import { trackGuideMapPinClicked } from '../../utils/analytics'
import { markGuideMapAssisted } from '../../utils/discoveryAttribution'
import { guideCommonProps } from '../../utils/guideVisitAnalytics'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from '../../views/experimentShared'
import { GuideMapPlaceCard, type GuideMapPlaceCardCategory } from './GuideMapPlaceCard'
import './guideMapExplore.css'

function eventIdFromPlace(place: GuidePlace): string | undefined {
  const href = place.eventHref
  if (!href) return undefined
  const match = href.match(/\/event\/([^/?#]+)/)
  return match?.[1]
}

const GuidePlacesMap = lazy(() =>
  import('./GuidePlacesMap').then((mod) => ({ default: mod.GuidePlacesMap })),
)

export type GuideMapSectionNavItem = {
  slug: string
  label: string
  imageSrc?: string
}

function categoryMeta(
  categoryId: string | undefined,
  categories: GuideMapCategory[],
  sectionNav: readonly GuideMapSectionNavItem[],
): GuideMapPlaceCardCategory | null {
  if (!categoryId) return null
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return null
  const nav = sectionNav.find((item) => item.slug === categoryId)
  return { label: cat.label, imageSrc: nav?.imageSrc }
}

export function GuideMapExploreOverlay({
  idPrefix,
  open,
  onClose,
  onSeeDetails,
  places,
  categories,
  selectedSlug,
  onSelectSlug,
  defaultCategoryId,
  sectionNav = HOLIDAY_GUIDE_SECTION_NAV,
  guideSlug,
}: {
  idPrefix: string
  open: boolean
  onClose: () => void
  onSeeDetails: (slug: string) => void
  places: readonly GuidePlace[] | GuidePlace[]
  categories: readonly GuideMapCategory[] | GuideMapCategory[]
  selectedSlug: string | null
  onSelectSlug: (slug: string | null) => void
  defaultCategoryId: string
  /** Clay icons keyed by category id / section slug (Lights defaults). */
  sectionNav?: readonly GuideMapSectionNavItem[]
  guideSlug?: string
}) {
  const showMap = places.length > 0 && hasGoogleMapsApiKey()
  const mapPlaces = useMemo(() => [...places], [places])
  const mapCategories = useMemo(() => [...categories], [categories])
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId)
  const [desktop, setDesktop] = useState(false)
  const suppressPinTrack = useRef(false)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveCategoryId(defaultCategoryId)
  }, [open, defaultCategoryId])

  const listPlaces = useMemo(
    () => mapPlaces.filter((place) => place.categoryId === activeCategoryId),
    [mapPlaces, activeCategoryId],
  )

  const selectedPlace =
    (selectedSlug ? listPlaces.find((place) => place.slug === selectedSlug) : null) ?? null

  useEffect(() => {
    if (!open) return
    if (selectedSlug && listPlaces.some((place) => place.slug === selectedSlug)) return
    // Always surface a place card (summary + save) when opening from the hero map icon.
    if (listPlaces[0]) {
      suppressPinTrack.current = true
      onSelectSlug(listPlaces[0].slug)
      return
    }
    if (selectedSlug) onSelectSlug(null)
  }, [open, desktop, listPlaces, selectedSlug, onSelectSlug])

  const selectPlace = (slug: string | null) => {
    if (slug && guideSlug && !suppressPinTrack.current) {
      const place = mapPlaces.find((row) => row.slug === slug)
      markGuideMapAssisted()
      trackGuideMapPinClicked(
        guideSlug,
        place ? eventIdFromPlace(place) : undefined,
        slug,
        guideCommonProps(guideSlug),
      )
    }
    suppressPinTrack.current = false
    onSelectSlug(slug)
  }

  if (!open) return null

  const categoryChips = (
    <div className="gdm-map-g__categories" role="toolbar" aria-label="Map categories">
      {mapCategories.map((cat) => {
        const pressed = activeCategoryId === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            className={`gdm-map-g__category-chip${pressed ? ' is-active' : ''}`}
            aria-pressed={pressed}
            onClick={() => setActiveCategoryId(cat.id)}
          >
            <span
              className="gdm-map-g__category-swatch"
              style={{ background: cat.color }}
              aria-hidden="true"
            />
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )

  const mapNode = showMap ? (
    <Suspense fallback={<div className="gdm-map-g__fallback" aria-hidden="true" />}>
      <GuidePlacesMap
        idPrefix={idPrefix}
        places={listPlaces}
        categories={mapCategories}
        caption=""
        compact
        pinTheme="holiday"
        showLegend={false}
        selectedSlug={selectedSlug}
        onSelectSlug={selectPlace}
        hidePreviewSheet
      />
    </Suspense>
  ) : (
    <div className="gdm-map-g__fallback">
      <p>Map preview unavailable in this environment.</p>
    </div>
  )

  return createPortal(
    <div className="gdm-map-g" role="dialog" aria-modal="true" aria-label="Guide map">
      <header className="gdm-map-g__header">
        <button type="button" className="gdm-map-g__back" onClick={onClose}>
          <span className="gdm-map-g__back-chevron" aria-hidden="true">
            ‹
          </span>
          Back to guide
        </button>
        <img
          className="gdm-map-g__logo"
          src={PUDDLES_WORDMARK_LOGO_SRC}
          srcSet={`${PUDDLES_WORDMARK_LOGO_SRC} 1x, ${PUDDLES_WORDMARK_LOGO_SRC_2X} 2x`}
          alt="Puddles"
          decoding="async"
        />
      </header>

      {categoryChips}

      <div className={`gdm-map-g__body${desktop ? ' gdm-map-g__body--desktop' : ''}`}>
        {desktop ? (
          <>
            <aside className="gdm-map-g__list" aria-label="Places in this category">
              <ul className="gdm-map-g__list-inner">
                {listPlaces.map((place) => (
                  <li key={place.slug}>
                    <GuideMapPlaceCard
                      place={place}
                      category={categoryMeta(place.categoryId, mapCategories, sectionNav)}
                      density="list"
                      selected={place.slug === selectedSlug}
                      onSelect={() => selectPlace(place.slug)}
                      onSeeDetails={onSeeDetails}
                    />
                  </li>
                ))}
              </ul>
            </aside>
            <div className="gdm-map-g__map">{mapNode}</div>
          </>
        ) : (
          <>
            <div className="gdm-map-g__map">{mapNode}</div>
            {selectedPlace ? (
              <div className="gdm-map-g__sheet" role="dialog" aria-label={selectedPlace.name}>
                <div className="gdm-map-g__sheet-handle" aria-hidden="true" />
                <GuideMapPlaceCard
                  place={selectedPlace}
                  category={categoryMeta(selectedPlace.categoryId, mapCategories, sectionNav)}
                  density="sheet"
                  onSeeDetails={onSeeDetails}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
