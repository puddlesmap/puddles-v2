import { OrganicLogoStack } from './OrganicWordmark'
import type { LogoExplorationProps } from './shared'

/** Tiny eyes + smile inside the organic “u” bowl. */
export function LogoExploration2({ size = 'default', showSubtitle = true, className }: LogoExplorationProps) {
  return <OrganicLogoStack size={size} showSubtitle={showSubtitle} className={className} variant="eyesInU" />
}
