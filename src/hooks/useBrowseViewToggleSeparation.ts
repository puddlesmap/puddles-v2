import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

const ROW_GAP_PX = 10
const DEFAULT_TOGGLE_WIDTH_PX = 108

/**
 * True when filter chips and the inline List/Map toggle cannot fit on one row.
 */
export function useBrowseViewToggleSeparation(
  rowRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  const [separated, setSeparated] = useState(false)
  const toggleWidthRef = useRef(DEFAULT_TOGGLE_WIDTH_PX)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const chips = row.querySelector('.browse-filter-chips') as HTMLElement | null
    if (!chips) return

    const measure = () => {
      const inlineToggle = row.querySelector('.browse-view-toggle-inline') as HTMLElement | null
      if (inlineToggle && inlineToggle.offsetWidth > 0) {
        toggleWidthRef.current = inlineToggle.offsetWidth
      }

      const rowWidth = row.clientWidth
      if (rowWidth <= 0) return

      const chipsContentWidth = chips.scrollWidth
      const toggleWidth = toggleWidthRef.current
      const needsSeparation = chipsContentWidth + toggleWidth + ROW_GAP_PX > rowWidth
      setSeparated(needsSeparation)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(row)
    observer.observe(chips)

    const inlineToggle = row.querySelector('.browse-view-toggle-inline') as HTMLElement | null
    if (inlineToggle) observer.observe(inlineToggle)

    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when chip row content changes
  }, [rowRef, ...deps])

  return separated
}
