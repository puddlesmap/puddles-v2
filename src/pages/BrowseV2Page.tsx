import { BrowsePage } from './BrowsePage'
import { BROWSE_V2_PAGE_PROPS } from './browsePageConfigs'

/** Archived Browse design (pre 2-column mobile list). */
export function BrowseV2Page() {
  return <BrowsePage {...BROWSE_V2_PAGE_PROPS} />
}
