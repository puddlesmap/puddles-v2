import posthog from 'posthog-js'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

if (token) {
  posthog.init(token, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    // SPA pageviews are sent manually from trackPageView() (Next + React Router).
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
  })
}
