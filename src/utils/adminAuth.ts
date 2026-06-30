export const ADMIN_AUTH_PATH = '/api/admin-auth'

export interface AdminSessionState {
  authRequired: boolean
  authenticated: boolean
}

export async function fetchAdminSession(): Promise<AdminSessionState> {
  const response = await fetch(ADMIN_AUTH_PATH, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  const data = (await response.json()) as {
    ok?: boolean
    authRequired?: boolean
    authenticated?: boolean
  }

  if (!response.ok || !data.ok) {
    return { authRequired: true, authenticated: false }
  }

  return {
    authRequired: Boolean(data.authRequired),
    authenticated: Boolean(data.authenticated),
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
