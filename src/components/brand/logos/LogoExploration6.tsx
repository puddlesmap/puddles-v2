import { OrganicWordmarkSvg, organicWordmarkWidth } from './OrganicWordmark'
import { logoScale, type LogoExplorationProps } from './shared'
import { PuddleIcon } from './PuddleIcon'

/** Compact mobile header: organic icon + wordmark, no subtitle. */
export function LogoExploration6({ size = 'compact', className }: LogoExplorationProps) {
  const scale = logoScale(size === 'default' ? 'default' : 'compact')
  const iconSize = 30 * scale

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, lineHeight: 1, height: 32 }}
      aria-label="Puddles"
    >
      <PuddleIcon size={iconSize} />
      <OrganicWordmarkSvg variant="plain" width={organicWordmarkWidth('compact') * 0.88} />
    </div>
  )
}
