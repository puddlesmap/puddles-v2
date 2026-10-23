import { SiteCatchAllLoader } from './[[...slug]]/SiteCatchAllLoader'

/** Same client shell as the catch-all, with a static server metadata page in front. */
export function StaticCatchAll() {
  return <SiteCatchAllLoader />
}
