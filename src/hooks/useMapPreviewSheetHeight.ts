import { useLayoutEffect, type RefObject } from 'react'

/** Keep map zoom controls above the mobile preview sheet as its height changes. */
export function useMapPreviewSheetHeight(
  sheetRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const panel = sheet.closest('.browse-map-panel-mobile') as HTMLElement | null
    if (!panel) return

    const syncHeight = () => {
      panel.style.setProperty('--browse-map-mobile-sheet-height', `${Math.ceil(sheet.offsetHeight)}px`)
    }

    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(sheet)

    return () => {
      observer.disconnect()
      panel.style.removeProperty('--browse-map-mobile-sheet-height')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when sheet content changes
  }, deps)
}
