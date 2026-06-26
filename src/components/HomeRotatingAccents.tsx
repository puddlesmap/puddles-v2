import { useEffect, useState } from 'react'
import {
  HOME_EXPERIMENT_ACCENTS,
  HOME_EXPERIMENT_ROTATION_MS,
} from '../pages/homeExperimentAccentShared'

interface HomeRotatingAccentsProps {
  variant: 'hero' | 'row'
}

export function HomeRotatingAccents({ variant }: HomeRotatingAccentsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HOME_EXPERIMENT_ACCENTS.length)
    }, HOME_EXPERIMENT_ROTATION_MS)

    return () => window.clearInterval(timer)
  }, [])

  if (variant === 'hero') {
    return (
      <div className="home-experiment-accent-hero" aria-hidden="true">
        {HOME_EXPERIMENT_ACCENTS.map((accent, index) => (
          <img
            key={accent.id}
            src={accent.src}
            srcSet={`${accent.src} 1x, ${accent.src2x} 2x`}
            width={accent.width}
            height={accent.height}
            alt=""
            className={index === activeIndex ? 'is-active' : undefined}
            decoding="async"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="home-experiment-accent-row" aria-hidden="true">
      {HOME_EXPERIMENT_ACCENTS.map((accent, index) => (
        <img
          key={accent.id}
          src={accent.src}
          srcSet={`${accent.src} 1x, ${accent.src2x} 2x`}
          width={accent.width}
          height={accent.height}
          alt=""
          className={index === activeIndex ? 'is-active' : undefined}
          decoding="async"
        />
      ))}
    </div>
  )
}
