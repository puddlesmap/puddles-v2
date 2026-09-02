'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type { Event } from '@/types/event'
import {
  getCatalogForLaunchContext,
  isLaunchStagingEnabled,
  isLaunchStagingRoute,
  readLaunchStagingToggle,
  writeLaunchStagingToggle,
  getLaunchStagingSummary,
} from '@/utils/launchStagingCatalog'

interface LaunchStagingContextValue {
  stagingActive: boolean
  toggleEnabled: boolean
  setToggleEnabled: (enabled: boolean) => void
  getCatalog: (now?: Date) => Event[]
  summary: ReturnType<typeof getLaunchStagingSummary>
}

const LaunchStagingContext = createContext<LaunchStagingContextValue | null>(null)

export function LaunchStagingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  const [toggleEnabled, setToggleEnabledState] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setToggleEnabledState(readLaunchStagingToggle())
    setHydrated(true)
  }, [])

  const stagingActive = isLaunchStagingEnabled(pathname, hydrated && toggleEnabled)

  const setToggleEnabled = useCallback((enabled: boolean) => {
    setToggleEnabledState(enabled)
    writeLaunchStagingToggle(enabled)
  }, [])

  const getCatalog = useCallback(
    (now: Date = new Date()) =>
      getCatalogForLaunchContext(pathname, hydrated && toggleEnabled, now),
    [pathname, hydrated, toggleEnabled],
  )

  const summary = useMemo(() => getLaunchStagingSummary(), [stagingActive, toggleEnabled, hydrated])

  const value = useMemo(
    () => ({
      stagingActive,
      toggleEnabled: hydrated && toggleEnabled,
      setToggleEnabled,
      getCatalog,
      summary,
    }),
    [stagingActive, hydrated, toggleEnabled, setToggleEnabled, getCatalog, summary],
  )

  return <LaunchStagingContext.Provider value={value}>{children}</LaunchStagingContext.Provider>
}

export function useLaunchStagingCatalog(): LaunchStagingContextValue {
  const context = useContext(LaunchStagingContext)
  if (!context) {
    return {
      stagingActive: false,
      toggleEnabled: false,
      setToggleEnabled: () => {},
      getCatalog: (now?: Date) => getCatalogForLaunchContext('/', false, now),
      summary: getLaunchStagingSummary(),
    }
  }
  return context
}

export function useLaunchStagingRoute(): boolean {
  const pathname = usePathname() || '/'
  return isLaunchStagingRoute(pathname)
}
