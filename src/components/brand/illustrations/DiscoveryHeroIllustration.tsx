import { JULLIEN_COLORS, JULLIEN_STROKE, JULLIEN_STROKE_WIDTH } from './jullienStyle'

export function DiscoveryHeroIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`discovery-hero-illustration ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 360 320" className="discovery-hero-illustration-svg" role="presentation">
        <rect
          x="34"
          y="42"
          width="210"
          height="210"
          rx="28"
          fill={JULLIEN_COLORS.cream}
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
        />
        <circle cx="88" cy="92" r="22" fill={JULLIEN_COLORS.sun} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M52 198 Q92 150 132 176 T212 188"
          fill={JULLIEN_COLORS.grass}
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinejoin="round"
        />
        <path
          d="M118 176 L118 214 M102 198 L134 198"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <circle cx="118" cy="158" r="14" fill={JULLIEN_COLORS.skin} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />

        <rect
          x="118"
          y="18"
          width="210"
          height="210"
          rx="28"
          fill="#fff"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
        />
        <rect x="136" y="42" width="78" height="54" rx="10" fill={JULLIEN_COLORS.blue} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M150 72 Q162 58 174 72 Q186 86 198 72"
          fill="none"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <circle cx="214" cy="150" r="16" fill={JULLIEN_COLORS.skin} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <circle cx="252" cy="138" r="12" fill={JULLIEN_COLORS.skin} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M214 166 L214 206 M198 184 L230 184 M252 150 L252 188 M244 176 L260 176"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d="M168 206 Q214 224 260 206"
          fill={JULLIEN_COLORS.coral}
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
