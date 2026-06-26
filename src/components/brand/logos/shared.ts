export const LOGO_BRAND = '#66C5F9'
export const LOGO_CHARCOAL = '#2D2D2D'
export const LOGO_MUTED = '#717171'
export const LOGO_WORDMARK_FONT = '"Quicksand", system-ui, sans-serif'
export const LOGO_SUBTITLE_FONT = '"Comfortaa", system-ui, sans-serif'
export const LOGO_WORDMARK_SIZE = 16
export const LOGO_SUBTITLE_SIZE = 14

export type LogoSize = 'default' | 'compact'

export interface LogoExplorationProps {
  size?: LogoSize
  showSubtitle?: boolean
  className?: string
}

export function logoScale(size: LogoSize): number {
  return size === 'compact' ? 0.85 : 1
}
