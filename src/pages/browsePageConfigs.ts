/** Previous Browse design (pre 2-column list) — archived at /browse-v2 */
export const BROWSE_V2_PAGE_PROPS = {
  shellClassName:
    'browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--map-interaction',
  resultsCountStyle: 'contextual' as const,
  mapInteractionMode: 'connected' as const,
}

/** Current production Browse — 2-column compact list on mobile */
export const BROWSE_PAGE_PROPS = {
  shellClassName:
    'browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--experiment-2-column browse-page-shell--map-interaction',
  resultsCountStyle: 'contextual' as const,
  mapInteractionMode: 'connected' as const,
  listLayout: 'compact-two-column' as const,
}
