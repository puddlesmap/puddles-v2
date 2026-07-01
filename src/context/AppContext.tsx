import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_BROWSE_FILTERS, type BrowseFilters } from '../utils/filters'
import type { TemporalTab } from '../utils/dates'

interface AppContextValue {
  city: string
  setCity: (city: string) => void
  temporalTab: TemporalTab
  setTemporalTab: (tab: TemporalTab) => void
  browseFilters: BrowseFilters
  setBrowseFilters: (f: BrowseFilters) => void
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
  const [showLocationBridge, setShowLocationBridge] = useState(false)
  const [locationBridgeSource, setLocationBridgeSource] = useState<'discovery' | 'browse'>('discovery')

  return (
    <AppContext.Provider
      value={{
        city,
        setCity,
        temporalTab,
        setTemporalTab,
        browseFilters,
        setBrowseFilters,
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
