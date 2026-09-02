import { ACTIVITY_TYPES, type ActivityType } from '../../types/event'
import { isNewActivityTypeFilter } from '../../config/activityTypeLaunch'

interface ActivityTypeFilterPillsProps {
  selected: ActivityType[]
  onChange: (types: ActivityType[]) => void
  buttonClassName?: (selected: boolean) => string
}

export function ActivityTypeFilterPills({
  selected,
  onChange,
  buttonClassName = (isSelected) =>
    `pill-select ${isSelected ? 'pill-select-active' : ''}`.trim(),
}: ActivityTypeFilterPillsProps) {
  return (
    <div className="pill-wrap">
      {ACTIVITY_TYPES.map((type) => {
        const isSelected = selected.includes(type)
        const showNew = isNewActivityTypeFilter(type)

        return (
          <button
            key={type}
            type="button"
            onClick={() =>
              onChange(
                isSelected ? selected.filter((value) => value !== type) : [...selected, type],
              )
            }
            className={[
              buttonClassName(isSelected),
              showNew ? 'pill-select--has-new' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="pill-select__label">{type}</span>
            {showNew ? (
              <span className="pill-select__new" aria-label="New activity type">
                NEW
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
