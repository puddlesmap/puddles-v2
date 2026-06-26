import { OrganicSubtitle, OrganicWordmarkSvg, organicWordmarkWidth } from './OrganicWordmark'
import { logoScale, type LogoExplorationProps } from './shared'
import { PuddleIcon } from './PuddleIcon'

/** Organic blob icon + custom wordmark lockup. */
export function LogoExploration5({ size = 'default', showSubtitle = true, className }: LogoExplorationProps) {
  const scale = logoScale(size)
  const iconSize = (size === 'compact' ? 28 : 32) * scale
  const wordmarkW = organicWordmarkWidth(size) * 0.92

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'compact' ? 8 : 10, lineHeight: 1 }}
      aria-label="Puddles"
    >
      <PuddleIcon size={iconSize} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
        <OrganicWordmarkSvg variant="plain" width={wordmarkW} />
        {showSubtitle && size !== 'compact' && <OrganicSubtitle scale={scale} />}
      </div>
    </div>
  )
}
