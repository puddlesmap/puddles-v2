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

type ToastKind = 'saved' | 'removed'

type ToastState = { eventId: string; visible: boolean; kind: ToastKind } | null

export type SavedAuthMode = 'create' | 'login'

type SavedContextValue = {
  saves: LocalSave[]
  isSaved: (eventId: string) => boolean
  toggleSave: (eventId: string) => void
  undoRemove: (eventId: string) => void
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
    (eventId: string) => {
      const id = eventId.trim()
      if (!id) return
      const wasSaved = activeLocalEventIds().has(id)
      toggleLocalSave(id)
      refreshFromStorage()
      const nowSaved = !wasSaved
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVED, {
        event_id: id,
        saved: nowSaved ? 'true' : 'false',
      })
      setToast(
        nowSaved
          ? { eventId: id, visible: true, kind: 'saved' }
          : { eventId: id, visible: true, kind: 'removed' },
      )
      void syncNow()
    },
    [refreshFromStorage, syncNow],
  )

  const undoRemove = useCallback(
    (eventId: string) => {
      const id = eventId.trim()
      if (!id) return
      if (activeLocalEventIds().has(id)) {
        setToast(null)
        return
      }
      toggleLocalSave(id)
      refreshFromStorage()
      trackEvent(ANALYTICS_EVENTS.ACTIVITY_SAVED, {
        event_id: id,
        saved: 'true',
      })
      setToast(null)
      void syncNow()
    },
    [refreshFromStorage, syncNow],
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

  useEffect(() => {
    saved?.setSignedInEmail(user?.primaryEmailAddress?.emailAddress ?? null)
  }, [saved, user?.primaryEmailAddress?.emailAddress])

  useEffect(() => {
    if (!saved) return
    if (!isLoaded || !isSignedIn || !userId) {
      saved.registerSync(null)
      return
    }

    const sync = async () => {
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
      }
    }

    saved.registerSync(sync)
    void sync()
    return () => saved.registerSync(null)
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
