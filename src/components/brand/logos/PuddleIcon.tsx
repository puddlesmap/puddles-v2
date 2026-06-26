import { LOGO_BRAND } from './shared'

interface PuddleIconProps {
  size?: number
  className?: string
}

/** Soft organic icon — overlapping water blobs, lumi-inspired roundness. */
export function PuddleIcon({ size = 32, className }: PuddleIconProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: LOGO_BRAND,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="11.5" rx="4.2" ry="3.6" fill="white" opacity="0.95" />
        <ellipse cx="7" cy="8" rx="2" ry="1.8" fill="white" opacity="0.72" />
        <ellipse cx="13" cy="7.5" rx="1.6" ry="1.4" fill="white" opacity="0.58" />
      </svg>
    </div>
  )
}
