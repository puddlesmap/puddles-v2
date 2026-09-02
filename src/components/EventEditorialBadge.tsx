import type { SeasonalBadgeIcon } from './SeasonalBadgeIcon'
import { SeasonalBadgeIcon as SeasonalBadgeIconGlyph } from './SeasonalBadgeIcon'

export type EditorialBadgeDisplay = {
  label: string
  icon?: SeasonalBadgeIcon
}

/** Seasonal editorial pick on event image — Fall / Halloween / Holiday Pick only. */
export function EventEditorialBadge({ label, icon }: EditorialBadgeDisplay) {
  return (
    <span className="event-editorial-badge" aria-label={label}>
      {icon ? <SeasonalBadgeIconGlyph icon={icon} className="seasonal-badge__icon" /> : null}
      {label}
    </span>
  )
}
