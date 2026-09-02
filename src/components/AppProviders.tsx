'use client'

import { useEffect, type ReactNode } from 'react'
import { AppProvider } from '@/context/AppContext'
import { LaunchStagingProvider } from '@/context/LaunchStagingContext'
import { initAnalytics } from '@/utils/analytics'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <AppProvider>
      <LaunchStagingProvider>{children}</LaunchStagingProvider>
    </AppProvider>
  )
}
