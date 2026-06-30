import { useLayoutEffect, useState, type RefObject } from 'react'

/** Matches `@container browse-map-list (min-width: 40rem)` */
const TWO_COLUMN_MIN_PX = 640

export function useBrowseMapListTwoColumn(containerRef: RefObject<HTMLElement | null>) {
  const [isTwoColumn, setIsTwoColumn] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    function update() {
      const node = containerRef.current
      if (!node) return
      setIsTwoColumn(node.getBoundingClientRect().width >= TWO_COLUMN_MIN_PX)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  return isTwoColumn
}
