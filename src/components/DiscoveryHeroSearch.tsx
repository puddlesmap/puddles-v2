interface DiscoveryHeroSearchProps {
  onClick: () => void
  className?: string
}

export function DiscoveryHeroSearch({ onClick, className = '' }: DiscoveryHeroSearchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`discovery-hero-search ${className}`.trim()}
    >
      <span className="discovery-hero-search-label">Find toddler&apos;s activity nearby</span>
      <span className="discovery-hero-search-btn" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.25" />
          <path d="M16 16 L20.5 20.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
      </span>
      <span className="sr-only">Find toddler&apos;s activity nearby</span>
    </button>
  )
}
