import { SiteCatchAllLoader } from './SiteCatchAllLoader'

/**
 * Catch-all UI must not SSR: the client tree statically imports Leaflet via
 * home/browse maps, and Leaflet throws `window is not defined` on the server.
 * That 500 error shell also prevented the Plausible bootstrap from becoming a
 * real executable <script> tag.
 *
 * Prefer a static shell on Netlify so document requests are not forced through
 * the flaky serverless handler (intermittent 502 / "function has crashed").
 */
export const dynamic = 'force-static'
/** Unknown paths (e.g. /about) still resolve; shell is prerendered client-only. */
export const dynamicParams = true

export default function SiteCatchAllPage() {
  return <SiteCatchAllLoader />
}
