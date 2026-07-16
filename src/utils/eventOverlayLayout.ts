import type { EventDetailOverlayLayout } from '../components/EventDetailView'

/**
 * Resolve event modal overlay layout.
 * Production desktop default is Airbnb v3; mobile keeps the classic modal via EventDetailView.
 */
export function resolveEventOverlayLayout(path?: string | null): EventDetailOverlayLayout {
  if (path?.startsWith('/experiment-event-modal-v3')) return 'v3'
  if (path?.startsWith('/experiment-event-modal')) return 'wide'
  return 'v3'
}
