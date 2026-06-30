import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Event } from '../types/event'
import type { MapBoundsBox } from '../utils/mapBounds'
import {
  filterEventsInBounds,
  getEventsWithCoordinates,
} from '../utils/mapBounds'
import {
  findLocationGroupForEvent,
  getEventLocationKey,
  getLocationGroupLabel,
  groupMappableEventsByLocation,
  type EventLocationGroup,
} from '../utils/mapLocationGroups'

export type MapInteractionMode = 'default' | 'connected'

const FLASH_DURATION_MS = 1300

interface UseBrowseMapInteractionOptions {
  events: Event[]
  feedKey: string
  areaBounds: MapBoundsBox | null
  isMobile: boolean
  onOpenEvent: (event: Event) => void
  interactionMode?: MapInteractionMode
}

export function useBrowseMapInteraction({
  events,
  feedKey,
  areaBounds,
  isMobile,
  onOpenEvent,
  interactionMode = 'default',
}: UseBrowseMapInteractionOptions) {
  const isConnected = interactionMode === 'connected'

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [flashEventId, setFlashEventId] = useState<string | null>(null)
  const [focusedLocationKey, setFocusedLocationKey] = useState<string | null>(null)
  const [panTrigger, setPanTrigger] = useState(0)

  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const flashTimeoutRef = useRef<number | null>(null)

  const displayEvents = useMemo(() => {
    if (!areaBounds) return events
    return filterEventsInBounds(events, areaBounds)
  }, [events, areaBounds])

  const mappableEvents = useMemo(
    () => getEventsWithCoordinates(displayEvents),
    [displayEvents],
  )

  const locationGroups = useMemo(
    () => (isConnected ? groupMappableEventsByLocation(mappableEvents) : []),
    [isConnected, mappableEvents],
  )

  const mobileCarouselEvents = useMemo(() => {
    if (!isMobile) return mappableEvents
    if (!isConnected || !focusedLocationKey) return mappableEvents

    const group = locationGroups.find((item) => item.key === focusedLocationKey)
    return group?.events ?? mappableEvents
  }, [focusedLocationKey, isConnected, isMobile, locationGroups, mappableEvents])

  const selectedEvent =
    displayEvents.find((event) => event.id === selectedEventId) ??
    mappableEvents.find((event) => event.id === selectedEventId) ??
    null

  const activeLocationGroup = useMemo(() => {
    if (!isConnected) return null
    return findLocationGroupForEvent(locationGroups, selectedEvent)
  }, [isConnected, locationGroups, selectedEvent])

  const mobileLocationLabel = useMemo(() => {
    if (!isConnected || !isMobile || !activeLocationGroup) return null
    return getLocationGroupLabel(activeLocationGroup)
  }, [activeLocationGroup, isConnected, isMobile])

  const clearFlashTimeout = useCallback(() => {
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = null
    }
  }, [])

  const triggerFlash = useCallback(
    (eventId: string) => {
      if (!isConnected) return

      clearFlashTimeout()
      setFlashEventId(eventId)
      flashTimeoutRef.current = window.setTimeout(() => {
        setFlashEventId((current) => (current === eventId ? null : current))
        flashTimeoutRef.current = null
      }, FLASH_DURATION_MS)
    },
    [clearFlashTimeout, isConnected],
  )

  useEffect(() => {
    return () => clearFlashTimeout()
  }, [clearFlashTimeout])

  useEffect(() => {
    setPanTrigger(0)
    setHoveredEventId(null)
    setFlashEventId(null)
    clearFlashTimeout()
    setFocusedLocationKey(null)
  }, [clearFlashTimeout, feedKey])

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null)
      setFocusedLocationKey(null)
      return
    }

    setSelectedEventId((current) => {
      const pool = areaBounds ? filterEventsInBounds(events, areaBounds) : events
      if (current && pool.some((event) => event.id === current)) return current
      const mappable = getEventsWithCoordinates(pool)
      return mappable[0]?.id ?? pool[0]?.id ?? null
    })
  }, [feedKey, events, areaBounds])

  useEffect(() => {
    if (!selectedEventId) return

    const node = cardRefs.current[selectedEventId]
    node?.scrollIntoView({
      block: 'nearest',
      inline: isMobile ? 'center' : 'nearest',
      behavior: 'smooth',
    })
  }, [isMobile, selectedEventId, mobileCarouselEvents.length, focusedLocationKey])

  const selectEvent = useCallback(
    (event: Event) => {
      setSelectedEventId(event.id)
      setPanTrigger((value) => value + 1)

      if (isConnected) {
        setFocusedLocationKey(getEventLocationKey(event))
        triggerFlash(event.id)
      }
    },
    [isConnected, triggerFlash],
  )

  const selectLocationGroup = useCallback(
    (group: EventLocationGroup) => {
      const primary = group.events[0]
      if (!primary) return
      setFocusedLocationKey(group.key)
      selectEvent(primary)
    },
    [selectEvent],
  )

  const handleCardClick = useCallback(
    (event: Event) => {
      if (selectedEventId === event.id) {
        onOpenEvent(event)
        return
      }
      selectEvent(event)
    },
    [onOpenEvent, selectEvent, selectedEventId],
  )

  const handleCardHover = useCallback(
    (eventId: string | null) => {
      if (isMobile) return
      setHoveredEventId(eventId)
    },
    [isMobile],
  )

  const handleMobilePreviewScroll = useCallback(() => {
    const container = listRef.current
    if (!container) return

    const center = container.scrollLeft + container.clientWidth / 2
    let closestId: string | null = null
    let closestDistance = Number.POSITIVE_INFINITY

    for (const event of mobileCarouselEvents) {
      const node = cardRefs.current[event.id]
      if (!node) continue

      const nodeCenter = node.offsetLeft + node.offsetWidth / 2
      const distance = Math.abs(center - nodeCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        closestId = event.id
      }
    }

    if (!closestId || closestId === selectedEventId) return

    setSelectedEventId(closestId)
    if (isConnected) {
      const nextEvent = mobileCarouselEvents.find((event) => event.id === closestId)
      if (nextEvent) {
        setFocusedLocationKey(getEventLocationKey(nextEvent))
        triggerFlash(closestId)
      }
    }
  }, [isConnected, mobileCarouselEvents, selectedEventId, triggerFlash])

  const isEventSelected = useCallback(
    (eventId: string) => selectedEventId === eventId,
    [selectedEventId],
  )

  const isEventFlashing = useCallback(
    (eventId: string) => isConnected && flashEventId === eventId,
    [flashEventId, isConnected],
  )

  const isLocationGroupSelected = useCallback(
    (group: EventLocationGroup) => {
      if (!selectedEventId) return false
      return group.events.some((event) => event.id === selectedEventId)
    },
    [selectedEventId],
  )

  const isLocationGroupHovered = useCallback(
    (group: EventLocationGroup) => {
      if (!hoveredEventId) return false
      return group.events.some((event) => event.id === hoveredEventId)
    },
    [hoveredEventId],
  )

  const markerGroups = isConnected ? locationGroups : null

  return {
    listRef,
    cardRefs,
    displayEvents,
    mappableEvents,
    mobileCarouselEvents,
    selectedEvent,
    selectedEventId,
    hoveredEventId,
    panTrigger,
    mobileLocationLabel,
    markerGroups,
    selectEvent,
    selectLocationGroup,
    handleCardClick,
    handleCardHover,
    handleMobilePreviewScroll,
    isEventSelected,
    isEventFlashing,
    isLocationGroupSelected,
    isLocationGroupHovered,
    setSelectedEventId,
    setPanTrigger,
    setHoveredEventId,
    setFocusedLocationKey,
  }
}
