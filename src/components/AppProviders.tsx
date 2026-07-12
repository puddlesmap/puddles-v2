'use client'

import { useEffect, type ReactNode } from 'react'
import { AppProvider } from '@/context/AppContext'
import { initAnalytics } from '@/utils/analytics'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return <AppProvider>{children}</AppProvider>
}
