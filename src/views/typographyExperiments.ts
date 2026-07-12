export interface TypographyExperiment {
  path: string
  title: string
  description: string
}

export interface TypographyExperimentGroup {
  id: string
  title: string
  description: string
  experiments: TypographyExperiment[]
}

export const TYPOGRAPHY_EXPERIMENT_GROUPS: TypographyExperimentGroup[] = [
  {
    id: 'share-style',
    title: 'Share-style heroes',
    description: '28px / 700 / black — same spec as Share page titles.',
    experiments: [
      {
        path: '/typography-experiment/home',
        title: 'Home',
        description: 'Refined home headline with Share-style weight and color.',
      },
      {
        path: '/typography-experiment/about',
        title: 'About',
        description: 'Tagline as Share-style hero; “About” eyebrow hidden.',
      },
    ],
  },
  {
    id: 'about-style',
    title: 'About tagline style',
    description: '600 / #1e293b — matches production “It takes a village…” headline.',
    experiments: [
      {
        path: '/typography-experiment/about-style/home',
        title: 'Home',
        description: 'Refined home headline using About tagline typography.',
      },
      {
        path: '/typography-experiment/about-style/share',
        title: 'Share',
        description: 'Intro line promoted to headline; tab titles removed.',
      },
    ],
  },
]

export const TYPOGRAPHY_EXPERIMENTS = TYPOGRAPHY_EXPERIMENT_GROUPS.flatMap(
  (group) => group.experiments,
)
