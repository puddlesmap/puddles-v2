import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { DEFAULT_BROWSE_FILTERS, type BrowseFilters } from '../utils/filters'
import type { TemporalTab } from '../utils/dates'

interface AppContextValue {
  city: string
  setCity: (city: string) => void
  temporalTab: TemporalTab
  setTemporalTab: (tab: TemporalTab) => void
  browseFilters: BrowseFilters
  setBrowseFilters: (f: BrowseFilters) => void
  selectedEvent: Event | null
  eventOpenSource: EventOpenSource | null
  openEvent: (event: Event, source: EventOpenSource) => void
  closeEvent: () => void
  showLocationBridge: boolean
  setShowLocationBridge: (v: boolean) => void
  locationBridgeSource: 'discovery' | 'browse'
  setLocationBridgeSource: (s: 'discovery' | 'browse') => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState('all')
  const [temporalTab, setTemporalTab] = useState<TemporalTab>('today')
  const [browseFilters, setBrowseFilters] = useState<BrowseFilters>(DEFAULT_BROWSE_FILTERS)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventOpenSource, setEventOpenSource] = useState<EventOpenSource | null>(null)
  const [showLocationBridge, setShowLocationBridge] = useState(false)
  const [locationBridgeSource, setLocationBridgeSource] = useState<'discovery' | 'browse'>('discovery')

  const openEvent = useCallback((event: Event, source: EventOpenSource) => {
    setEventOpenSource(source)
    setSelectedEvent(event)
  }, [])

  const closeEvent = useCallback(() => {
    setSelectedEvent(null)
    setEventOpenSource(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        city,
        setCity,
        temporalTab,
        setTemporalTab,
        browseFilters,
        setBrowseFilters,
        selectedEvent,
        eventOpenSource,
        openEvent,
        closeEvent,
        showLocationBridge,
        setShowLocationBridge,
        locationBridgeSource,
        setLocationBridgeSource,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
