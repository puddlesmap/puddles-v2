'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { syncClerkAudienceSaves } from '../utils/audienceApi'
import {
  activeLocalEventIds,
  mergeRemoteActiveSaves,
  readLocalSaves,
  toggleLocalSave,
  toAudienceSavePayloads,
  type LocalSave,
} from '../utils/savedStorage'
import { ANALYTICS_EVENTS, trackEvent } from '../utils/analytics'
import { attributionProps, type SaveSurface } from '../utils/discoveryAttribution'

type ToastKind = 'saved' | 'removed'

type ToastState = { eventId: string; visible: boolean; kind: ToastKind } | null

export type SavedAuthMode = 'create' | 'login'

export type ToggleSaveOptions = {
  save_surface: SaveSurface
}

type SavedContextValue = {
  saves: LocalSave[]
  isSaved: (eventId: string) => boolean
  toggleSave: (eventId: string, options?: ToggleSaveOptions) => void
  undoRemove: (eventId: string, options?: ToggleSaveOptions) => void
  toast: ToastState
  dismissToast: () => void
  signInOpen: boolean
  authMode: SavedAuthMode
  openSignIn: () => void
  openAuthSheet: (mode?: SavedAuthMode) => void
  closeSignIn: () => void
  signedInEmail: string | null
  syncNow: () => Promise<void>
  refreshFromStorage: () => void
  setSignedInEmail: (email: string | null) => void
  registerSync: (fn: (() => Promise<void>) | null) => void
}

const SavedContext = createContext<SavedContextValue | null>(null)

function saveAnalyticsProps(eventId: string, saveSurface?: SaveSurface) {
  return {
    event_id: eventId,
    ...(saveSurface ? { save_surface: saveSurface } : {}),
    ...attributionProps(),
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saves, setSaves] = useState<LocalSave[]>(() =>
    typeof window === 'undefined' ? [] : readLocalSaves(),
  )
  const [toast, setToast] = useState<ToastState>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [authMode, setAuthMode] = useState<SavedAuthMode>('create')
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const syncFnRef = useRef<(() => Promise<void>) | null>(null)

  const refreshFromStorage = useCallback(() => {
    setSaves(readLocalSaves())
  }, [])

  const syncNow = useCallback(async () => {
    if (syncFnRef.current) await syncFnRef.current()
  }, [])

  const registerSync = useCallback((fn: (() => Promise<void>) | null) => {
    syncFnRef.current = fn
  }, [])

  const openAuthSheet = useCallback((mode: SavedAuthMode = 'create') => {
    setAuthMode(mode)
    setSignInOpen(true)
  }, [])

  const toggleSave = useCallback(
    (eventId: string, options?: ToggleSaveOptions) => {
      const id = eventId.trim()
      if (!id) return
      const saveSurface = options?.save_surface
      const wasSaved = activeLocalEventIds().has(id)
      const intendedSaved = !wasSaved

      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_CLICKED, {
        ...saveAnalyticsProps(id, saveSurface),
        intended_saved: intendedSaved ? 'true' : 'false',
      })

      let result: ReturnType<typeof toggleLocalSave>
      try {
        result = toggleLocalSave(id)
      } catch {
        trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_BLOCKED, {
          ...saveAnalyticsProps(id, saveSurface),
          reason: 'persist_error',
        })
        return
      }

      if (!result.persisted) {
        trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_BLOCKED, {
          ...saveAnalyticsProps(id, saveSurface),
          reason: 'persist_failed',
        })
        return
      }

      setSaves(result.saves)
      // Confirmed persisted state only — never count a failed write as success.
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVED, {
        ...saveAnalyticsProps(id, saveSurface),
        saved: result.nowSaved ? 'true' : 'false',
      })
      setToast(
        result.nowSaved
          ? { eventId: id, visible: true, kind: 'saved' }
          : { eventId: id, visible: true, kind: 'removed' },
      )
      void syncNow().catch(() => {
        trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_BLOCKED, {
          ...saveAnalyticsProps(id, saveSurface),
          reason: 'sync_failed',
        })
      })
    },
    [syncNow],
  )

  const undoRemove = useCallback(
    (eventId: string, options?: ToggleSaveOptions) => {
      const id = eventId.trim()
      if (!id) return
      if (activeLocalEventIds().has(id)) {
        setToast(null)
        return
      }
      const saveSurface = options?.save_surface
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_CLICKED, {
        ...saveAnalyticsProps(id, saveSurface),
        intended_saved: 'true',
      })
      const result = toggleLocalSave(id)
      if (!result.persisted || !result.nowSaved) {
        trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_BLOCKED, {
          ...saveAnalyticsProps(id, saveSurface),
          reason: 'persist_failed',
        })
        return
      }
      setSaves(result.saves)
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVED, {
        ...saveAnalyticsProps(id, saveSurface),
        saved: 'true',
      })
      setToast(null)
      void syncNow()
    },
    [syncNow],
  )

  const value = useMemo<SavedContextValue>(
    () => ({
      saves,
      isSaved: (eventId: string) => activeLocalEventIds(saves).has(eventId.trim()),
      toggleSave,
      undoRemove,
      toast,
      dismissToast: () => setToast(null),
      signInOpen,
      authMode,
      openSignIn: () => openAuthSheet('create'),
      openAuthSheet,
      closeSignIn: () => setSignInOpen(false),
      signedInEmail,
      syncNow,
      refreshFromStorage,
      setSignedInEmail,
      registerSync,
    }),
    [
      authMode,
      openAuthSheet,
      refreshFromStorage,
      registerSync,
      saves,
      signInOpen,
      signedInEmail,
      syncNow,
      toast,
      toggleSave,
      undoRemove,
    ],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

/** Mount only under ClerkProvider. */
export function SavedClerkBridge() {
  const saved = useSavedOptional()
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const syncInFlightRef = useRef(false)

  useEffect(() => {
    saved?.setSignedInEmail(user?.primaryEmailAddress?.emailAddress ?? null)
  }, [saved, user?.primaryEmailAddress?.emailAddress])

  useEffect(() => {
    if (!saved) return
    if (!isLoaded || !isSignedIn || !userId) {
      saved.registerSync(null)
      return
    }

    const runSync = async (attempt: number): Promise<boolean> => {
      try {
        const ph = (
          window as unknown as { posthog?: { identify?: (id: string, props?: object) => void } }
        ).posthog
        ph?.identify?.(userId, { user_type: 'parent' })
      } catch {
        /* ignore */
      }
      const result = await syncClerkAudienceSaves({
        saves: toAudienceSavePayloads(),
        getToken: () => getToken(),
      })
      if (result.ok && result.saves) {
        mergeRemoteActiveSaves(result.saves)
        saved.refreshFromStorage()
        return true
      }
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVE_BLOCKED, {
        reason: 'sync_failed',
        attempt: String(attempt),
        error: result.error || 'unknown',
      })
      return false
    }

    const sync = async () => {
      if (syncInFlightRef.current) return
      syncInFlightRef.current = true
      try {
        const ok = await runSync(1)
        if (!ok) {
          await new Promise((resolve) => setTimeout(resolve, 800))
          await runSync(2)
        }
      } finally {
        syncInFlightRef.current = false
      }
    }

    const onVisibleOrFocus = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return
      void sync()
    }

    saved.registerSync(sync)
    void sync()
    window.addEventListener('focus', onVisibleOrFocus)
    document.addEventListener('visibilitychange', onVisibleOrFocus)
    return () => {
      saved.registerSync(null)
      window.removeEventListener('focus', onVisibleOrFocus)
      document.removeEventListener('visibilitychange', onVisibleOrFocus)
    }
  }, [getToken, isLoaded, isSignedIn, saved, userId])

  return null
}

export function useSaved(): SavedContextValue {
  const context = useContext(SavedContext)
  if (!context) {
    throw new Error('useSaved must be used within SavedProvider')
  }
  return context
}

export function useSavedOptional(): SavedContextValue | null {
  return useContext(SavedContext)
}
