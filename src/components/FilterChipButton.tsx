interface FilterChipButtonProps {
  label: string
  active?: boolean
  /** Shown as an Airbnb-style count badge when greater than zero. */
  selectionCount?: number
  onClick: () => void
}

export function FilterChipButton({
  label,
  active = false,
  selectionCount = 0,
  onClick,
}: FilterChipButtonProps) {
  const showCount = selectionCount > 0
  const ariaLabel = showCount ? `${label}, ${selectionCount} selected` : label

  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill-filter ${active ? 'pill-filter-active' : ''}`}
      aria-label={ariaLabel}
    >
      <span className="pill-filter-label">{label}</span>
      {showCount && (
        <span className="pill-filter-count" aria-hidden>
          {selectionCount}
        </span>
      )}
    </button>
  )
}
