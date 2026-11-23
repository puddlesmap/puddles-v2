'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ADSENSE_CLIENT,
  ensureAdSenseScript,
  getAdSenseGuideMidSlot,
  isAdSenseEnabled,
} from '../../utils/adsense'
import './guideMidArticleAd.css'

type Props = {
  /** Stable key so SPA navigations remount a fresh empty slot. */
  placementKey: string
}

/**
 * In-article AdSense unit for mid-guide placement between chapters.
 * Renders nothing until a slot ID is configured and ads are enabled.
 */
export function GuideMidArticleAd({ placementKey }: Props) {
  const [active, setActive] = useState(false)
  const pushedFor = useRef<string | null>(null)
  const slot = getAdSenseGuideMidSlot()

  useEffect(() => {
    setActive(isAdSenseEnabled())
  }, [])

  useEffect(() => {
    if (!active || !slot) return

    ensureAdSenseScript()

    const key = `${placementKey}:${slot}`
    if (pushedFor.current === key) return
    pushedFor.current = key

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      // AdSense push can throw if the slot was already filled.
    }
  }, [active, placementKey, slot])

  if (!active || !slot) return null

  return (
    <aside className="guide-mid-ad" aria-label="Sponsored">
      <p className="guide-mid-ad__label">Sponsored</p>
      <ins
        key={placementKey}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
      />
    </aside>
  )
}
