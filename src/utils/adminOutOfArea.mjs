import { ADMIN_CORE_CITIES } from './adminCatalogPlacement.mjs'

/** True when an outside-core city is an intentional listing, not a review flag. */
export function outOfCoreListingIsExpected(event) {
  if (!event) return false
  if (event.isSeasonal === true || event.isRegional === true) return true
  const id = String(event.id || '')
  if (id.startsWith('regional-') || id.startsWith('seasonal-drive-') || id.startsWith('seasonal-')) {
    return true
  }
  if (!ADMIN_CORE_CITIES.includes(String(event.city || '').trim())) return true
  return false
}
