import {
  isLocalhostAnalyticsHost,
  isProductionAnalyticsHost,
} from './analyticsHost'

/** AdSense publisher client from account setup. */
export const ADSENSE_CLIENT = 'ca-pub-3898775059185873'

/** Same id on the layout <head> tag and client inject — load once only. */
export const ADSENSE_SCRIPT_ID = 'adsbygoogle-js'

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`

const SCRIPT_ID = ADSENSE_SCRIPT_ID

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>
  }
}

/** Mid-article In-article unit (AdSense → Ads → By ad unit). */
export const ADSENSE_SLOT_GUIDE_MID_DEFAULT = '1369744687'

/**
 * Mid-article In-article unit slot.
 * Override with NEXT_PUBLIC_ADSENSE_SLOT_GUIDE_MID on Netlify if needed.
 */
export function getAdSenseGuideMidSlot(): string {
  return (
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE_MID?.trim() ||
    process.env.VITE_ADSENSE_SLOT_GUIDE_MID?.trim() ||
    ADSENSE_SLOT_GUIDE_MID_DEFAULT
  )
}

export function isAdSenseEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (!getAdSenseGuideMidSlot()) return false
  if (isProductionAnalyticsHost()) return true
  return (
    isLocalhostAnalyticsHost() && process.env.NEXT_PUBLIC_ADSENSE_DEBUG === 'true'
  )
}

/** Load the AdSense library once; request non-personalized ads (matches Privacy Policy). */
export function ensureAdSenseScript(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  window.adsbygoogle = window.adsbygoogle || []
  ;(window.adsbygoogle as unknown as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds = 1

  if (
    document.getElementById(SCRIPT_ID) ||
    document.querySelector(`script[src*="adsbygoogle.js"]`)
  ) {
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = ADSENSE_SCRIPT_SRC
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}
