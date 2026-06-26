import { OrganicLogoStack } from './OrganicWordmark'
import type { LogoExplorationProps } from './shared'

/** Organic wordmark with spreading puddle/blob underline. */
export function LogoExploration4({ size = 'default', showSubtitle = true, className }: LogoExplorationProps) {
  return (
    <OrganicLogoStack
      size={size}
      showSubtitle={showSubtitle}
      className={className}
      variant="plain"
      showUnderline
    />
  )
}
