import { JULLIEN_COLORS, JULLIEN_STROKE, JULLIEN_STROKE_WIDTH } from './jullienStyle'

type PillarType = 'today-friendly' | 'low-commitment' | 'nearby-moments'

export function ValuePillarIllustration({ type }: { type: PillarType }) {
  return (
    <div className="value-pillar-illustration" aria-hidden>
      <svg viewBox="0 0 88 88" className="value-pillar-illustration-svg" role="presentation">
        <circle cx="44" cy="44" r="40" fill={JULLIEN_COLORS.cream} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        {type === 'today-friendly' && (
          <>
            <circle cx="44" cy="34" r="10" fill={JULLIEN_COLORS.sun} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
            <path d="M44 44 L44 58 M36 50 L52 50" stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} strokeLinecap="round" />
            <path d="M28 62 Q44 52 60 62" fill={JULLIEN_COLORS.grass} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
          </>
        )}
        {type === 'low-commitment' && (
          <>
            <rect x="28" y="24" width="32" height="40" rx="6" fill={JULLIEN_COLORS.blue} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
            <path d="M34 34 L54 34 M34 44 L50 44" stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} strokeLinecap="round" />
            <path d="M22 64 H66" stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} strokeLinecap="round" />
          </>
        )}
        {type === 'nearby-moments' && (
          <>
            <path
              d="M44 68 C44 68 62 56 62 40 C62 30 54 24 44 24 C34 24 26 30 26 40 C26 56 44 68 44 68 Z"
              fill={JULLIEN_COLORS.coral}
              stroke={JULLIEN_STROKE}
              strokeWidth={JULLIEN_STROKE_WIDTH}
              strokeLinejoin="round"
            />
            <circle cx="44" cy="40" r="6" fill="#fff" stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
          </>
        )}
      </svg>
    </div>
  )
}
