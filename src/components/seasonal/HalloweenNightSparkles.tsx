import type { CSSProperties } from 'react'

/** Soft night-sky sparkles for Halloween collection pages. */
export const HALLOWEEN_SPARKLES = [
  { top: '8%', left: '6%', size: 2, delay: '0s', duration: '2.8s' },
  { top: '12%', left: '22%', size: 3, delay: '0.4s', duration: '3.4s' },
  { top: '5%', left: '41%', size: 2, delay: '1.1s', duration: '2.6s' },
  { top: '18%', left: '58%', size: 4, delay: '0.2s', duration: '3.8s' },
  { top: '9%', left: '74%', size: 2, delay: '1.6s', duration: '2.9s' },
  { top: '14%', left: '88%', size: 3, delay: '0.8s', duration: '3.2s' },
  { top: '28%', left: '12%', size: 2, delay: '1.3s', duration: '3.1s' },
  { top: '34%', left: '33%', size: 3, delay: '0.6s', duration: '2.7s' },
  { top: '26%', left: '49%', size: 2, delay: '2s', duration: '3.5s' },
  { top: '38%', left: '67%', size: 4, delay: '0.9s', duration: '4s' },
  { top: '31%', left: '84%', size: 2, delay: '1.8s', duration: '2.5s' },
  { top: '48%', left: '8%', size: 3, delay: '0.3s', duration: '3.3s' },
  { top: '52%', left: '27%', size: 2, delay: '1.4s', duration: '2.8s' },
  { top: '56%', left: '46%', size: 3, delay: '0.7s', duration: '3.6s' },
  { top: '44%', left: '71%', size: 2, delay: '1.9s', duration: '3s' },
  { top: '60%', left: '91%', size: 4, delay: '0.5s', duration: '3.9s' },
  { top: '72%', left: '15%', size: 2, delay: '1.2s', duration: '2.9s' },
  { top: '78%', left: '38%', size: 3, delay: '0.1s', duration: '3.4s' },
  { top: '68%', left: '55%', size: 2, delay: '1.7s', duration: '2.6s' },
  { top: '82%', left: '76%', size: 3, delay: '0.95s', duration: '3.7s' },
  { top: '88%', left: '4%', size: 2, delay: '1.5s', duration: '3.1s' },
  { top: '91%', left: '63%', size: 4, delay: '0.35s', duration: '4.1s' },
  { top: '86%', left: '94%', size: 2, delay: '2.1s', duration: '2.7s' },
  { top: '42%', left: '18%', size: 2, delay: '2.3s', duration: '3.2s' },
] as const

export function HalloweenNightSparkles() {
  return (
    <div className="halloween-sparkles" aria-hidden>
      {HALLOWEEN_SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="halloween-sparkles__star"
          style={
            {
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              '--sparkle-delay': sparkle.delay,
              '--sparkle-duration': sparkle.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
