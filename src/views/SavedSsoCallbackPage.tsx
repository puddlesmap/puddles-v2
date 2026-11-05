'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

/** Completes Clerk OAuth redirects for the Saved sign-in sheet. */
export function SavedSsoCallbackPage() {
  return (
    <div className="saved-sso-callback layout-container py-16 text-center">
      <p>Finishing sign-in…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
