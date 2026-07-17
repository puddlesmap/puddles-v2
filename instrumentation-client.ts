import posthog from 'posthog-js'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const allowLocalDebug = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true'

function shouldInitPostHog(): boolean {
  if (!token || typeof window === 'undefined') return false
  const host = window.location.hostname
  if (host === 'puddlesmap.com' || host === 'www.puddlesmap.com') return true
  if (allowLocalDebug && (host === 'localhost' || host === '127.0.0.1')) return true
  return false
}

if (shouldInitPostHog()) {
  posthog.init(token!, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    // Manual SPA pageviews only — via trackPageView() (no automatic duplicate $pageview).
    capture_pageview: false,
    capture_pageleave: true,
    // Product events are explicit; do not autocapture clicks/inputs.
    autocapture: false,
    // Privacy: no session replay, no identify in app code.
    disable_session_recording: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development' && allowLocalDebug,
  })
}
