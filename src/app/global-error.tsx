'use client'

import { useEffect } from 'react'

/**
 * Puddles-branded crash screen. Rendered by Next.js when the root layout or a
 * page throws during render. It replaces the whole document, so styles are
 * inlined (globals.css is not guaranteed to be present here).
 *
 * Note: this does NOT replace Netlify's platform "function has crashed" 502
 * page (served before our code runs). It covers in-app React render crashes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const posthog = (window as Window & {
      posthog?: { captureException: (error: unknown) => void }
    }).posthog
    posthog?.captureException(error)
  }, [error])

  const fontStack =
    "'Nunito Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.25rem calc(3rem + env(safe-area-inset-bottom))',
          background: '#ffffff',
          fontFamily: fontStack,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <main
          style={{
            width: '100%',
            maxWidth: '24rem',
            textAlign: 'center',
          }}
        >
          <img
            src="/maintenance-pin.png"
            alt=""
            width={96}
            height={120}
            decoding="async"
            style={{
              display: 'block',
              width: '6rem',
              height: 'auto',
              margin: '0 auto 1.5rem',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              color: '#000000',
            }}
          >
            We hit a little puddle.
          </h1>

          <p
            style={{
              margin: '0.75rem 0 0',
              fontSize: '1rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#686868',
            }}
          >
            Something went wrong on our end. Give it another try in a moment — we&apos;re on it.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%',
              marginTop: '2rem',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 46,
                padding: '0 1.5rem',
                border: 'none',
                borderRadius: 23,
                background: '#66c5f9',
                color: '#ffffff',
                fontFamily: fontStack,
                fontSize: '1rem',
                fontWeight: 700,
                lineHeight: 1.25,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 46,
                padding: '0 1.5rem',
                border: '1px solid #ebebeb',
                borderRadius: 23,
                background: '#ffffff',
                color: '#000000',
                fontFamily: fontStack,
                fontSize: '1rem',
                fontWeight: 700,
                lineHeight: 1.25,
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
