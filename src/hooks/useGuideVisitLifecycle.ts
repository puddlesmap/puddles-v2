import { useEffect } from 'react'
import { startGuideVisitAnalytics } from '../utils/guideVisitAnalytics'
import type { GuideVersion } from '../utils/discoveryAttribution'

/** Starts Guide visit analytics (reading time, impressions, section reach) for one mount. */
export function useGuideVisitLifecycle(
  guideSlug: string,
  guideVersion: GuideVersion = 'v2',
): void {
  useEffect(() => {
    const visit = startGuideVisitAnalytics({ guideSlug, guideVersion })
    return () => visit.dispose()
  }, [guideSlug, guideVersion])
}
