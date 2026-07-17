import { SiteCatchAllLoader } from './SiteCatchAllLoader'

/**
 * Catch-all UI must not SSR: the client tree statically imports Leaflet via
 * home/browse maps, and Leaflet throws `window is not defined` on the server.
 * That 500 error shell also prevented the Plausible bootstrap from becoming a
 * real executable <script> tag.
 */
export default function SiteCatchAllPage() {
  return <SiteCatchAllLoader />
}
