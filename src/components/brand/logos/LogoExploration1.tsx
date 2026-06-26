import { OrganicLogoStack } from './OrganicWordmark'
import type { LogoExplorationProps } from './shared'

/** Simple organic wordmark — lumi-inspired blob letterforms, no character. */
export function LogoExploration1({ size = 'default', showSubtitle = true, className }: LogoExplorationProps) {
  return <OrganicLogoStack size={size} showSubtitle={showSubtitle} className={className} variant="plain" />
}
