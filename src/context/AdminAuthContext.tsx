import { createContext, useContext } from 'react'

export interface AdminAuthContextValue {
  authRequired: boolean
  signOut: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthGate')
  }
  return context
}
