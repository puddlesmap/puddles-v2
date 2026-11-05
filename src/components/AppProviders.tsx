'use client'

import { useEffect, type ReactNode } from 'react'
import { AppProvider } from '@/context/AppContext'
import { LaunchStagingProvider } from '@/context/LaunchStagingContext'
import { SavedClerkBridge, SavedProvider } from '@/context/SavedContext'
import { initAnalytics } from '@/utils/analytics'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <AppProvider>
      <LaunchStagingProvider>
        <SavedProvider>
          <SavedClerkBridge />
          {children}
        </SavedProvider>
      </LaunchStagingProvider>
    </AppProvider>
  )
}
