import type { ReactNode } from 'react'
import {
  LOGO_BRAND,
  LOGO_MUTED,
  LOGO_SUBTITLE_FONT,
  LOGO_SUBTITLE_SIZE,
  type LogoExplorationProps,
  type LogoSize,
  logoScale,
} from './shared'

/** Subtle per-letter blue tints — lumi-style variety within one brand family. */
export const ORGANIC_LETTER_COLORS = {
  p: '#66C5F9',
  u: '#5AB4EE',
  d1: '#66C5F9',
  d2: '#78CAFA',
  l: '#5AB4EE',
  e: '#66C5F9',
  s: '#5AB4EE',
} as const

export type OrganicWordmarkVariant = 'plain' | 'eyesInU' | 'dropletD'

const VIEWBOX_W = 132
const VIEWBOX_H = 28

/** Thick, rounded, organic letter paths — inspired by soft custom wordmarks like lumi. */
function LetterP() {
  return (
    <path
      fill={ORGANIC_LETTER_COLORS.p}
      d="M4.5 24.5c-1.3 0-2.2-0.9-2.2-2.2V6.8c0-2.6 1.6-4.3 4.2-4.3 1.7 0 3 0.8 3.6 2.2.7-1.2 2-2.2 3.8-2.2 3.2 0 5.2 2.4 5.2 6.1s-2 6.1-5.4 6.1H9.8v8.1c0 1.3-0.9 2.2-2.2 2.2H4.5zm5.2-14.2h3.1c2 0 3.1-1.1 3.1-3.1s-1.1-3.1-2.9-3.1c-1.8 0-2.9 1.2-2.9 3.1v3.1z"
    />
  )
}

function LetterU({ variant }: { variant: OrganicWordmarkVariant }) {
  return (
    <g transform="translate(20, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.u}
        d="M2.5 24c-1.2 0-2-0.8-2-2V12.5C0.5 7.8 3.2 5 7.8 5s7.3 2.8 7.3 7.5V22c0 1.2-0.8 2-2 2s-2-0.8-2-2v-9.8c0-2.8-1.5-4.5-3.8-4.5s-3.8 1.7-3.8 4.5V22c0 1.2-0.8 2-2 2z"
      />
      {variant === 'eyesInU' && (
        <>
          <circle cx="6.2" cy="14.8" r="1.15" fill="#2D2D2D" opacity="0.75" />
          <circle cx="9.8" cy="14.8" r="1.15" fill="#2D2D2D" opacity="0.75" />
          <path
            d="M5.5 16.8 Q7.8 18.2 10.5 16.8"
            fill="none"
            stroke="#2D2D2D"
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      )}
    </g>
  )
}

function LetterD1({ variant }: { variant: OrganicWordmarkVariant }) {
  if (variant === 'dropletD') {
    return (
      <g transform="translate(38, 0)">
        <path
          fill={ORGANIC_LETTER_COLORS.d1}
          d="M7.5 24.5c-4.8 0-7.5-3.5-7.5-8.8C0 10.5 4.5 3.5 7.8 1.8c0.8-0.4 1.7-0.4 2.4 0.2 3.2 2.2 6.8 8.5 6.8 14.2 0 5.2-2.6 8.3-6.5 8.3zm0.2-3.5c2.4 0 3.8-2.2 3.8-5.5 0-3.8-2.2-7.8-4.2-9.5-1.8 2-3.5 5.8-3.5 9.2 0 3.2 1.2 5.8 3.9 5.8z"
        />
        <circle cx="6.8" cy="11.5" r="0.95" fill="white" opacity="0.92" />
        <circle cx="9.2" cy="11.5" r="0.95" fill="white" opacity="0.92" />
        <path
          d="M6.2 13.2 Q8 14.2 9.8 13.2"
          fill="none"
          stroke="white"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    )
  }

  return (
    <g transform="translate(38, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.d1}
        d="M4.5 24.5c-1.3 0-2.2-0.9-2.2-2.2V6.8c0-2.6 1.4-4.3 3.8-4.3 4.5 0 7.2 3.2 7.2 8.5s-2.7 8.5-7.2 8.5H6.8v5.3c0 1.3-0.9 2.2-2.2 2.2H4.5zm2.3-12.8h2.5c2.6 0 4.1-1.8 4.1-4.5s-1.5-4.5-4-4.5c-2.2 0-3.5 1.5-3.5 4v5z"
      />
    </g>
  )
}

function LetterD2() {
  return (
    <g transform="translate(56, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.d2}
        d="M4.5 24.5c-1.3 0-2.2-0.9-2.2-2.2V6.8c0-2.6 1.4-4.3 3.8-4.3 4.5 0 7.2 3.2 7.2 8.5s-2.7 8.5-7.2 8.5H6.8v5.3c0 1.3-0.9 2.2-2.2 2.2H4.5zm2.3-12.8h2.5c2.6 0 4.1-1.8 4.1-4.5s-1.5-4.5-4-4.5c-2.2 0-3.5 1.5-3.5 4v5z"
      />
    </g>
  )
}

function LetterL() {
  return (
    <g transform="translate(74, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.l}
        d="M4.5 24.5c-1.3 0-2.2-0.9-2.2-2.2V6.5c0-2.4 1.3-4 3.5-4s3.5 1.6 3.5 4v15.8c0 1.3-0.9 2.2-2.2 2.2H4.5z"
      />
    </g>
  )
}

function LetterE() {
  return (
    <g transform="translate(86, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.e}
        d="M4.5 24.5c-1.3 0-2.2-0.9-2.2-2.2V6.8c0-2.6 1.5-4.3 4.5-4.3h7.8c1.2 0 2 0.8 2 2s-0.8 2-2 2H7.2c-1.2 0-2 0.8-2 2v2.8h6.5c1.2 0 2 0.8 2 2s-0.8 2-2 2H5.2v3.5c0 1.2 0.8 2 2 2h6.8c1.2 0 2 0.8 2 2s-0.8 2-2 2H7.5c-3.2 0-5-1.7-5-4.5z"
      />
    </g>
  )
}

function LetterS() {
  return (
    <g transform="translate(106, 0)">
      <path
        fill={ORGANIC_LETTER_COLORS.s}
        d="M11.5 20.2c-1.2 0-2.2-0.5-2.8-1.2-0.8-0.9-0.6-2.2 0.4-2.8 0.8-0.5 1.8-0.2 2.4 0.5 0.5 0.6 1.2 0.9 2 0.9 1.2 0 2-0.6 2-1.5s-0.8-1.4-2.5-1.8c-3.2-0.8-5-2.5-5-5.2 0-3.2 2.6-5.5 6.2-5.5 1.8 0 3.4 0.6 4.4 1.6 0.8 0.8 0.7 2.1-0.2 2.7-0.7 0.5-1.6 0.3-2.2-0.3-0.6-0.6-1.4-0.9-2.2-0.9-1.1 0-1.8 0.5-1.8 1.2s0.7 1.2 2.2 1.6c3.4 0.9 5.2 2.6 5.2 5.5 0 3.4-2.8 5.8-6.8 5.8z"
      />
    </g>
  )
}

function PuddleUnderline() {
  return (
    <g transform="translate(8, 25)">
      <ellipse cx="58" cy="3" rx="54" ry="3.2" fill={LOGO_BRAND} opacity="0.82" />
      <ellipse cx="78" cy="2.5" rx="28" ry="2.4" fill={LOGO_BRAND} opacity="0.65" />
      <circle cx="72" cy="1.8" r="1.4" fill="white" opacity="0.5" />
      <circle cx="88" cy="2.2" r="1" fill="white" opacity="0.4" />
    </g>
  )
}

interface OrganicWordmarkSvgProps {
  variant?: OrganicWordmarkVariant
  showUnderline?: boolean
  width?: number
  className?: string
}

export function OrganicWordmarkSvg({
  variant = 'plain',
  showUnderline = false,
  width = 128,
  className,
}: OrganicWordmarkSvgProps) {
  const height = (width / VIEWBOX_W) * (showUnderline ? VIEWBOX_H + 4 : VIEWBOX_H)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${showUnderline ? VIEWBOX_H + 4 : VIEWBOX_H}`}
      width={width}
      height={height}
      aria-hidden={!className}
      aria-label={className ? undefined : 'Puddles'}
      className={className}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <LetterP />
      <LetterU variant={variant} />
      <LetterD1 variant={variant} />
      <LetterD2 />
      <LetterL />
      <LetterE />
      <LetterS />
      {showUnderline && <PuddleUnderline />}
    </svg>
  )
}

export function OrganicSubtitle({ scale = 1 }: { scale?: number }) {
  return (
    <span
      style={{
        marginTop: 6 * scale,
        fontFamily: LOGO_SUBTITLE_FONT,
        fontSize: LOGO_SUBTITLE_SIZE * scale,
        fontWeight: 300,
        letterSpacing: '0.02em',
        color: LOGO_MUTED,
      }}
    >
      the tot map
    </span>
  )
}

interface OrganicLogoStackProps extends LogoExplorationProps {
  variant?: OrganicWordmarkVariant
  showUnderline?: boolean
  wordmarkWidth?: number
  children?: ReactNode
}

export function OrganicLogoStack({
  size = 'default',
  showSubtitle = true,
  className,
  variant = 'plain',
  showUnderline = false,
  wordmarkWidth,
  children,
}: OrganicLogoStackProps) {
  const scale = logoScale(size)
  const width = wordmarkWidth ?? (size === 'compact' ? 108 : 128) * scale

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}
      aria-label="Puddles"
    >
      {children ?? <OrganicWordmarkSvg variant={variant} showUnderline={showUnderline} width={width} />}
      {showSubtitle && size !== 'compact' && <OrganicSubtitle scale={scale} />}
    </div>
  )
}

export function organicWordmarkWidth(size: LogoSize = 'default'): number {
  const scale = logoScale(size ?? 'default')
  return (size === 'compact' ? 108 : 128) * scale
}
