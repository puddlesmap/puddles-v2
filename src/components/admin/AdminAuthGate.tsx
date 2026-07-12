import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminAuthContext } from '../../context/AdminAuthContext'
import { fetchAdminSession, logoutAdmin } from '../../utils/adminAuth'
import { AdminLoginPage } from '../../views/admin/AdminLoginPage'

type GateState = 'loading' | 'ready' | 'login'

export function AdminAuthGate() {
  const [state, setState] = useState<GateState>('loading')
  const [authRequired, setAuthRequired] = useState(false)

  async function refreshSession() {
    setState('loading')
    const session = await fetchAdminSession()
    setAuthRequired(session.authRequired)
    if (!session.authRequired || session.authenticated) {
      setState('ready')
      return
    }
    setState('login')
  }

  async function signOut() {
    try {
      await logoutAdmin()
    } catch {
      // Still show the login screen so sign-out feels responsive.
    }
    setState('login')
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  const contextValue = { authRequired, signOut }

  if (state === 'loading') {
    return (
      <AdminAuthContext.Provider value={contextValue}>
        <div className="admin-auth-shell">
          <p className="admin-auth-loading">Loading admin…</p>
        </div>
      </AdminAuthContext.Provider>
    )
  }

  if (state === 'login') {
    return (
      <AdminAuthContext.Provider value={contextValue}>
        <AdminLoginPage onSuccess={() => void refreshSession()} />
      </AdminAuthContext.Provider>
    )
  }

  return (
    <AdminAuthContext.Provider value={contextValue}>
      <Outlet />
    </AdminAuthContext.Provider>
  )
}
