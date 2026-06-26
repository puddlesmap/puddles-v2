import { OrganicLogoStack } from './OrganicWordmark'
import type { LogoExplorationProps } from './shared'

/** First “d” as soft droplet with micro face. */
export function LogoExploration3({ size = 'default', showSubtitle = true, className }: LogoExplorationProps) {
  return <OrganicLogoStack size={size} showSubtitle={showSubtitle} className={className} variant="dropletD" />
}
