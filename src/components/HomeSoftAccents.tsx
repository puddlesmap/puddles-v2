import { HOME_EXPERIMENT_SOFT_ACCENTS } from '../pages/homeExperimentAccentShared'

export function HomeSoftAccents() {
  return (
    <div className="home-experiment-soft-accents" aria-hidden="true">
      {HOME_EXPERIMENT_SOFT_ACCENTS.map((accent) => (
        <img
          key={accent.id}
          src={accent.src}
          srcSet={`${accent.src} 1x, ${accent.src2x} 2x`}
          width={accent.width}
          height={accent.height}
          alt=""
          decoding="async"
        />
      ))}
    </div>
  )
}
