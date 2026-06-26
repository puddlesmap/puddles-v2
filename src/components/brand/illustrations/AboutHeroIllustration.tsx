import { JULLIEN_COLORS, JULLIEN_STROKE, JULLIEN_STROKE_WIDTH } from './jullienStyle'

export function AboutHeroIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`about-hero-illustration ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 320 320" className="about-hero-illustration-svg" role="presentation">
        <circle cx="160" cy="160" r="148" fill={JULLIEN_COLORS.cream} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M48 214 Q110 176 160 188 Q210 200 272 214"
          fill={JULLIEN_COLORS.grass}
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinejoin="round"
        />
        <circle cx="118" cy="126" r="18" fill={JULLIEN_COLORS.skin} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <circle cx="198" cy="118" r="14" fill={JULLIEN_COLORS.skin} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M118 144 L118 198 M104 168 L132 168"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d="M198 132 L198 184 M188 158 L208 158"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d="M132 168 Q158 182 184 168"
          fill="none"
          stroke={JULLIEN_STROKE}
          strokeWidth={JULLIEN_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <circle cx="236" cy="92" r="20" fill={JULLIEN_COLORS.sun} stroke={JULLIEN_STROKE} strokeWidth={JULLIEN_STROKE_WIDTH} />
        <path
          d="M86 98 Q112 74 138 92"
          fill="none"
          stroke={JULLIEN_COLORS.blue}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
