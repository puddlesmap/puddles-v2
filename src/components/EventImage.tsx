import { forwardRef, useEffect, useState } from 'react'
import type { Event } from '../types/event'
import {
  getEventFallbackImageUrl,
  getEventImageKey,
  getEventImageUrl,
  isEventFallbackImage,
} from '../utils/eventImages'

interface EventImageProps {
  event: Event
  className?: string
  loading?: 'eager' | 'lazy'
  onLoad?: () => void
}

export const EventImage = forwardRef<HTMLImageElement, EventImageProps>(function EventImage(
  { event, className, loading = 'lazy', onLoad },
  ref,
) {
  const resolvedUrl = getEventImageUrl(event)
  const [src, setSrc] = useState(resolvedUrl)
  const [usingFallback, setUsingFallback] = useState(isEventFallbackImage(resolvedUrl, event))

  useEffect(() => {
    const nextUrl = getEventImageUrl(event)
    setSrc(nextUrl)
    setUsingFallback(isEventFallbackImage(nextUrl, event))
  }, [event.id, event.title, event.description, event.imageUrl, event.types, event.categoryTags])

  function handleError() {
    const nextFallback = getEventFallbackImageUrl(event)
    setSrc((current) => (current === nextFallback ? current : nextFallback))
    setUsingFallback(true)
  }

  return (
    <img
      key={getEventImageKey(event)}
      ref={ref}
      src={src}
      alt=""
      className={[className, usingFallback ? 'event-image--fallback' : ''].filter(Boolean).join(' ')}
      loading={loading}
      onLoad={onLoad}
      onError={handleError}
    />
  )
})
