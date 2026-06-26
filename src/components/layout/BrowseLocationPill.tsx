interface BrowseLocationPillProps {
  label: string
  onClick: () => void
}

export function BrowseLocationPill({ label, onClick }: BrowseLocationPillProps) {
  return (
    <button type="button" onClick={onClick} className="browse-location-pill">
      <span className="browse-location-pill-inner">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="browse-location-icon shrink-0"
          aria-hidden
        >
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span className="browse-location-value min-w-0 truncate">{label}</span>
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="browse-location-chevron shrink-0"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
