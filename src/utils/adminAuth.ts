export const ADMIN_AUTH_PATH = '/api/admin-auth'

export interface AdminSessionState {
  authRequired: boolean
  authenticated: boolean
}

function isLocalAdminHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** When the auth API is unreachable locally, skip login instead of trapping on a broken form. */
function localDevAuthBypass(): AdminSessionState {
  return { authRequired: false, authenticated: true }
}

export async function fetchAdminSession(): Promise<AdminSessionState> {
  try {
    const response = await fetch(ADMIN_AUTH_PATH, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      if (isLocalAdminHost()) return localDevAuthBypass()
      return { authRequired: true, authenticated: false }
    }

    const data = (await response.json()) as {
      ok?: boolean
      authRequired?: boolean
      authenticated?: boolean
    }

    if (!response.ok || !data.ok) {
      if (isLocalAdminHost() && response.status === 503) return localDevAuthBypass()
      return { authRequired: true, authenticated: false }
    }

    return {
      authRequired: Boolean(data.authRequired),
      authenticated: Boolean(data.authenticated),
    }
  } catch {
    if (isLocalAdminHost()) return localDevAuthBypass()
    return { authRequired: true, authenticated: false }
  }
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch(ADMIN_AUTH_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = (await response.json()) as { ok?: boolean; error?: string }
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Could not sign in')
  }
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(ADMIN_AUTH_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' }),
  })

  let data: { ok?: boolean; error?: string }
  try {
    data = (await response.json()) as { ok?: boolean; error?: string }
  } catch {
    throw new Error('Could not sign out')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Could not sign out')
  }
}
